"use client";

import "react-international-phone/style.css";
import * as React from "react";
import { PhoneInput as RIPhoneInput, type CountryIso2 } from "react-international-phone";
import { cn } from "@/lib/utils";

/**
 * Phone input with country picker. Wraps `react-international-phone` so we
 * pick up its CSS-sprite flag rendering (no emoji rendering issues across
 * Windows/macOS/Linux) and apply our cream/black/lime theme.
 *
 * Locking strategy:
 *   - When `lockCountry` is `true`, the country dropdown is disabled —
 *     useful AFTER the user has saved a phone, so they can't accidentally
 *     swap the dial code on subsequent edits.
 *   - The wrapper itself is RTL-aware: digits stay LTR, the flag sits at
 *     the inline-start edge to keep the international format readable.
 *
 * Default country is Saudi Arabia (`sa`) since this is a Saudi-first product.
 */
export interface PhoneInputProps {
  /** Full E.164 value, e.g. `+966555111222`. Empty string for unset. */
  value: string;
  onChange: (value: string, meta: { country: CountryIso2 }) => void;
  /** Default ISO2 country if `value` is empty. */
  defaultCountry?: CountryIso2;
  /** Lock the country dropdown — useful when editing an already-saved phone. */
  lockCountry?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  /** When `lockCountry` is true, this overrides the inferred country (e.g.
   *  the value persisted on the profile row). */
  lockedTo?: CountryIso2;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "sa",
  lockCountry = false,
  disabled,
  invalid,
  placeholder,
  id,
  name,
  lockedTo,
}: PhoneInputProps) {
  return (
    <div
      data-invalid={invalid ? "true" : undefined}
      className={cn(
        "linkup-phone-input",
        invalid && "is-invalid",
        disabled && "is-disabled",
      )}
    >
      <RIPhoneInput
        defaultCountry={lockedTo ?? defaultCountry}
        value={value}
        onChange={(v, meta) => onChange(v, meta)}
        disabled={disabled}
        forceDialCode
        disableDialCodeAndPrefix={false}
        showDisabledDialCodeAndPrefix={false}
        countrySelectorStyleProps={{
          buttonStyle: { pointerEvents: lockCountry ? "none" : undefined },
          dropdownStyleProps: { className: "linkup-phone-dropdown" },
        }}
        inputProps={{
          id,
          name,
          placeholder,
          dir: "ltr",
          // Stops mobile browsers from suggesting unrelated autofill that
          // can desync the country dropdown.
          autoComplete: "tel",
        }}
      />
    </div>
  );
}
