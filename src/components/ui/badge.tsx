import * as React from "react";
import { cn } from "../../lib/utils";

const toneMap: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-800",
  High: "bg-green-100 text-green-800",
  Moderate: "bg-yellow-100 text-yellow-900",
  Low: "bg-amber-100 text-amber-900",
  Inactive: "bg-stone-100 text-stone-700",
  Watch: "bg-amber-100 text-amber-900",
  Dropped: "bg-red-100 text-red-800"
};

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone ? toneMap[tone] ?? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-700",
        className
      )}
      {...props}
    />
  );
}
