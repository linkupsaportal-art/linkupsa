import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — modern pill primitives that work on both themes.
 *
 * Variants:
 *   - primary  → solid black on cream / blurple on dark, soft drop-shadow
 *   - accent   → solid lime, black text (used for the most prominent CTA)
 *   - outline  → hairline border, transparent fill
 *   - ghost    → text-only, fades-in surface tint on hover
 *   - link     → underline link, no padding
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold " +
    "transition-all duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-fg text-bg hover:bg-[hsl(var(--surface-4))] " +
          "shadow-[0_8px_20px_-8px_hsl(220_30%_8%/0.45)]",
        accent:
          "bg-accent text-accent-fg hover:bg-accent-hi " +
          "shadow-[0_8px_22px_-8px_hsl(var(--accent)/0.55)]",
        outline:
          "border border-[hsl(var(--hairline-strong))] bg-transparent text-fg hover:bg-surface-2",
        ghost: "text-fg-muted hover:text-fg hover:bg-surface-2",
        link: "text-fg underline-offset-4 hover:underline px-0 h-auto rounded-none",
        danger:
          "bg-danger text-white hover:bg-danger/90 shadow-[0_8px_20px_-8px_hsl(var(--danger)/0.5)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-sm",
        xl: "h-14 px-8 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
