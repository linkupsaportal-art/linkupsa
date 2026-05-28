import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Discord-flavored Button — rounded corners, accent CTA, ink-on-paper hover for outline.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap " +
    "transition-colors duration-200 ease-out font-medium rounded-md " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Accent — primary CTA, blurple
        primary: "bg-accent text-accent-fg hover:bg-accent-hi shadow-[0_4px_16px_-4px_hsl(var(--accent)/0.5)]",
        // Hairline outlined
        outline:
          "border border-[hsl(var(--hairline-strong))] bg-transparent text-fg hover:bg-fg/10 hover:border-fg/40",
        // Ghost — minimal nav/dropdown style
        ghost: "text-fg-muted hover:text-fg hover:bg-fg/10",
        // Surface — secondary chip
        accent: "bg-accent text-accent-fg hover:bg-accent-hi",
        // Plain underline link
        link: "text-accent underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-xs uppercase tracking-wider",
        md: "h-11 px-5 text-xs uppercase tracking-wider",
        lg: "h-12 px-6 text-sm uppercase tracking-wider",
        xl: "h-14 px-8 text-sm uppercase tracking-wider",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
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
