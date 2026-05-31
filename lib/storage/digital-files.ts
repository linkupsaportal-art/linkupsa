import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Digital-file delivery via short-lived signed URLs.
 *
 * Files for `digital_file` products live in the PRIVATE `digital-files`
 * bucket. The customer never gets a permanent link — at pickup time we mint a
 * signed URL valid for a few minutes only, so a leaked link expires fast and
 * the object can't be enumerated.
 *
 * `file_storage_path` on the account is the object key inside the bucket
 * (e.g. "products/chatgpt/guide.pdf"). For backward-compat, if it's already a
 * full http(s) URL we return it unchanged.
 */

const BUCKET = "digital-files";
const DEFAULT_TTL_SECONDS = 300; // 5 minutes — matches the architecture doc

export async function signDigitalFileUrl(
  storagePath: string | null | undefined,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<string | null> {
  if (!storagePath) return null;

  // Already a full URL (legacy rows / external host) — pass through.
  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  const sb = createServiceClient();
  const key = storagePath.replace(/^\/+/, "");
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(key, ttlSeconds, { download: true });

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
