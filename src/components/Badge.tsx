import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "../classNames";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function Badge({ className, tone = "neutral", ...badgeProps }: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2 py-0.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em]",
        toneClasses[tone],
        className,
      )}
      {...badgeProps}
    />
  );
}
