"use client";

import * as React from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check, ChevronLeft, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * shadcn-style DropdownMenu — themed via our tokens, RTL-friendly.
 * The chevron uses ChevronLeft because the menu opens to the LEFT in RTL.
 */
export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;
export const DropdownMenuGroup = Dropdown.Group;
export const DropdownMenuPortal = Dropdown.Portal;
export const DropdownMenuSub = Dropdown.Sub;
export const DropdownMenuRadioGroup = Dropdown.RadioGroup;

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Dropdown.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Dropdown.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <Dropdown.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
      "focus:bg-fg/10 data-[state=open]:bg-fg/10",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronLeft className="ms-auto size-4" />
  </Dropdown.SubTrigger>
));
DropdownMenuSubTrigger.displayName = Dropdown.SubTrigger.displayName;

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Dropdown.SubContent>,
  React.ComponentPropsWithoutRef<typeof Dropdown.SubContent>
>(({ className, ...props }, ref) => (
  <Dropdown.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-[hsl(var(--hairline-strong))] bg-surface p-1 shadow-2xl",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = Dropdown.SubContent.displayName;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Dropdown.Content>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <Dropdown.Portal>
    <Dropdown.Content
      ref={ref}
      sideOffset={sideOffset}
      // The `theme-admin` class re-applies the cream/lime tokens on the
      // portaled content. Radix portals to <body>, which sits OUTSIDE the
      // admin layout's themed wrapper, so without this scope override the
      // dropdown would inherit the public dark Discord theme.
      className={cn(
        "theme-admin",
        "z-50 min-w-[14rem] overflow-hidden rounded-2xl p-1.5",
        "bg-white border border-[hsl(220_18%_14%/0.08)]",
        "shadow-[0_24px_60px_-30px_rgba(15,23,32,0.45),0_2px_6px_-2px_rgba(15,23,32,0.08)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </Dropdown.Portal>
));
DropdownMenuContent.displayName = Dropdown.Content.displayName;

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Dropdown.Item>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <Dropdown.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-[hsl(222_30%_6%)] outline-none transition-colors",
      "hover:bg-[hsl(60_14%_94%)] focus:bg-[hsl(60_14%_94%)] focus:text-[hsl(222_30%_6%)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "ps-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = Dropdown.Item.displayName;

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Dropdown.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Dropdown.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <Dropdown.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 ps-8 pe-2 text-sm outline-none transition-colors",
      "focus:bg-fg/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute start-2 flex size-3.5 items-center justify-center">
      <Dropdown.ItemIndicator>
        <Check className="size-3.5" />
      </Dropdown.ItemIndicator>
    </span>
    {children}
  </Dropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = Dropdown.CheckboxItem.displayName;

export const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof Dropdown.RadioItem>,
  React.ComponentPropsWithoutRef<typeof Dropdown.RadioItem>
>(({ className, children, ...props }, ref) => (
  <Dropdown.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-md py-1.5 ps-8 pe-2 text-sm outline-none transition-colors",
      "focus:bg-fg/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute start-2 flex size-3.5 items-center justify-center">
      <Dropdown.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </Dropdown.ItemIndicator>
    </span>
    {children}
  </Dropdown.RadioItem>
));
DropdownMenuRadioItem.displayName = Dropdown.RadioItem.displayName;

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Dropdown.Label>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <Dropdown.Label
    ref={ref}
    className={cn(
      "px-2.5 py-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(220_8%_52%)]",
      inset && "ps-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = Dropdown.Label.displayName;

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Dropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Separator>
>(({ className, ...props }, ref) => (
  <Dropdown.Separator
    ref={ref}
    className={cn("mx-1 my-1 h-px bg-[hsl(220_18%_14%/0.08)]", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = Dropdown.Separator.displayName;

export function DropdownMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ms-auto text-[10px] tracking-widest text-fg-faint", className)}
      {...props}
    />
  );
}
