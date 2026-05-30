"use client";

import * as React from "react";
import {
  usePhoneInput,
  defaultCountries,
  parseCountry,
  FlagImage,
  type CountryIso2,
} from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, Check } from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────── */

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
  /** When `lockCountry` is true, this overrides the inferred country. */
  lockedTo?: CountryIso2;
}

/* ── Parsed country list (computed once) ──────────────────────────────── */

const COUNTRY_LIST = defaultCountries.map((c) => parseCountry(c));

/* ── Component ────────────────────────────────────────────────────────── */

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
  const {
    phone,
    inputValue,
    handlePhoneValueChange,
    inputRef,
    country,
    setCountry,
  } = usePhoneInput({
    defaultCountry: lockedTo ?? defaultCountry,
    value,
    onChange: (phoneData) => {
      const cleanPhone = phoneData.phone.trim();
      const dialCodeWithPlus = `+${country.dialCode}`;
      const isJustDialCode = cleanPhone === dialCodeWithPlus || cleanPhone === "+";
      onChange(isJustDialCode ? "" : cleanPhone, { country: country.iso2 });
    },
    disableDialCodeAndPrefix: true,
  });

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  /* Close on click outside */
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Close on Escape */
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  /* Auto-focus search when dropdown opens */
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure the dropdown is rendered before focusing
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  /* Filter countries */
  const filteredCountries = React.useMemo(() => {
    if (!search.trim()) return COUNTRY_LIST;
    const q = search.toLowerCase();
    return COUNTRY_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.includes(q),
    );
  }, [search]);

  function selectCountry(iso2: CountryIso2) {
    setCountry(iso2);
    setOpen(false);
    setSearch("");
    // Re-focus the phone input after selection
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const canOpen = !lockCountry && !disabled;

  return (
    <div ref={containerRef} className="relative" dir="ltr">
      {/* ── Main Field ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "group flex items-center h-12 border bg-surface rounded-xl overflow-hidden transition-all duration-200",
          "border-[hsl(var(--hairline-strong))]",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
          invalid &&
            "border-danger focus-within:border-danger focus-within:ring-danger/30",
          disabled && "opacity-60 cursor-not-allowed",
        )}
      >
        {/* Country Trigger — flag + dial code integrated into the field */}
        <button
          type="button"
          onClick={() => canOpen && setOpen((v) => !v)}
          disabled={!canOpen}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="اختر الدولة"
          className={cn(
            "flex items-center gap-2 h-full shrink-0 transition-colors",
            "ps-3.5 pe-2.5",
            canOpen
              ? "cursor-pointer hover:bg-[hsl(var(--hairline))]"
              : "cursor-default",
          )}
        >
          <FlagImage
            iso2={country.iso2}
            style={{ width: "22px", height: "16px" }}
            className="rounded-[3px] shrink-0 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
          />
          <span className="font-mono text-sm font-bold text-fg tabular-nums leading-none select-none whitespace-nowrap">
            +{country.dialCode}
          </span>
          {canOpen && (
            <ChevronDown
              className={cn(
                "size-3.5 text-fg-muted shrink-0 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          )}
        </button>

        {/* Thin separator */}
        <div className="w-px h-6 bg-[hsl(var(--hairline-strong))] shrink-0" />

        {/* Phone Input — always LTR */}
        <input
          ref={inputRef}
          type="text"
          value={value ? inputValue : ""}
          onChange={handlePhoneValueChange}
          disabled={disabled}
          placeholder={placeholder ?? "5X XXX XXXX"}
          id={id}
          name={name}
          dir="ltr"
          autoComplete="tel"
          className="flex-1 bg-transparent text-fg placeholder:text-fg-faint outline-none h-full min-w-0 font-semibold tabular-nums text-sm px-3.5"
        />
      </div>

      {/* ── Dropdown Panel ─────────────────────────────────────────── */}
      {open && (
        <div
          ref={dropdownRef}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-[100] mt-1.5",
            "bg-[hsl(var(--bg))] border border-[hsl(var(--hairline-strong))]",
            "rounded-2xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.06)]",
            "animate-in fade-in slide-in-from-top-2 duration-150",
            "overflow-hidden",
          )}
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-[hsl(var(--hairline))]">
            <div className="flex items-center gap-2 h-10 px-3 bg-[hsl(var(--surface))] rounded-xl">
              <Search className="size-4 text-fg-faint shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن دولة..."
                dir="auto"
                className="flex-1 bg-transparent text-fg text-sm outline-none placeholder:text-fg-faint min-w-0"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-[240px] overflow-y-auto overscroll-contain py-1 px-1.5 scroll-smooth phone-dropdown-scroll">
            {filteredCountries.length === 0 ? (
              <div className="text-sm text-fg-faint text-center py-6 select-none">
                لا توجد نتائج
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isActive = c.iso2 === country.iso2;
                return (
                  <button
                    key={c.iso2}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => selectCountry(c.iso2 as CountryIso2)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-start transition-colors",
                      "hover:bg-[hsl(var(--surface))]",
                      isActive && "bg-[hsl(var(--accent)/0.08)]",
                    )}
                  >
                    <FlagImage
                      iso2={c.iso2}
                      style={{ width: "22px", height: "16px" }}
                      className="rounded-[3px] shrink-0 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
                    />
                    <span className="flex-1 text-sm font-medium text-fg truncate">
                      {c.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-fg-subtle tabular-nums shrink-0">
                      +{c.dialCode}
                    </span>
                    {isActive && (
                      <Check className="size-4 text-accent shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
