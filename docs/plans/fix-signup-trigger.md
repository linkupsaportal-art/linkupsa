# Plan - Fix Signup Database Error (handle_new_user Trigger)

This plan details the resolution of the signup blocker caused by the database trigger failing with a `Database error creating new user` during manager/merchant registration.

## Root Cause Analysis
During registration, Supabase Auth creates a row in `auth.users`, which fires the `on_auth_user_created` trigger function `public.handle_new_user()`.
Inside the trigger, the function calls `gen_random_bytes(16)` to auto-generate the user's `webhook_key`.
However:
1. `gen_random_bytes` is defined in the `extensions` schema.
2. The `handle_new_user()` function is defined as `SECURITY DEFINER` but does not set an explicit `search_path`, causing it to execute using the caller's search path (i.e. the Supabase Auth internal user `supabase_auth_admin`).
3. Since `supabase_auth_admin` does not have `extensions` in its search path, the call to `gen_random_bytes` fails with: `ERROR: function gen_random_bytes(integer) does not exist`.
4. This trigger failure rolls back the entire signup transaction, causing the auth signup to report `Database error creating new user`.

## Proposed Solution
We will update the trigger function `handle_new_user()` in the database to:
1. Explicitly qualify the schema for the random byte generator: `extensions.gen_random_bytes(16)`.
2. Secure the function by adding `SET search_path = public, extensions` to prevent search path manipulation and resolve any other implicit function lookups.

## Implementation Steps

- [ ] Update scratch migration script [update-trigger.sql](file:///C:/Users/MSI-PC/.gemini/antigravity/brain/fc154faf-3941-432c-849c-2a281f5045ef/scratch/update-trigger.sql) with the updated function.
- [ ] Run the SQL script on the remote linked Supabase instance using `npx supabase db query --linked`.
- [ ] Verify that new signup attempts succeed.
- [ ] Update `docs/changelog.md` to document the fix.
- [ ] Verify there are no compilation or layout errors.

## Verification Plan

### Automated Tests
- Execute database query verification of `handle_new_user()` definition to confirm it has been updated.
- Verify using a script or frontend testing.

### Manual Verification
- Attempt to register a new user in the app UI and check if they can register and verification OTP is sent successfully.
