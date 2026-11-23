import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const variants = {
  default: "border border-atelier bg-surface-raised text-muted-atelier",
  success: "border border-[#6f9b7a]/35 bg-[#6f9b7a]/10 text-[#6f9b7a]",
  warning: "border border-champagne/35 bg-champagne/10 text-champagne",
  danger: "border border-[#b45a5a]/35 bg-[#b45a5a]/10 text-[#b45a5a]",
  info: "border border-steel/35 bg-steel/10 text-steel",
} as const;

interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
