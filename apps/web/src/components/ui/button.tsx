import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#e0d6c8] to-[#c4b8a5] text-[#070708] hover:opacity-92",
        secondary:
          "bg-surface-raised text-pearl border border-atelier hover:border-champagne/40",
        outline:
          "border border-champagne/45 bg-transparent text-pearl hover:bg-champagne/10",
        ghost: "text-muted-atelier hover:bg-surface-raised hover:text-pearl",
        danger: "bg-[#b45a5a] text-pearl hover:opacity-90",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-sm",
        md: "h-10 gap-2 px-4 text-sm",
        lg: "h-12 gap-2 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
