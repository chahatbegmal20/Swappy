import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-muted-atelier"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "block w-full rounded-xl border border-atelier bg-surface px-3.5 py-2.5 text-sm text-pearl placeholder:text-muted-atelier/70",
            "focus:border-champagne/50 focus:outline-none focus:ring-2 focus:ring-champagne/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#b45a5a] focus:border-[#b45a5a] focus:ring-[#b45a5a]/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-[#b45a5a]">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
