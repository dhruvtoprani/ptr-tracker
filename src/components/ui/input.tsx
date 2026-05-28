import * as React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "h-10 w-full rounded-xl border border-soft-green bg-white px-3 text-sm text-charcoal outline-none ring-primary-green/40 placeholder:text-muted focus:ring-2",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
