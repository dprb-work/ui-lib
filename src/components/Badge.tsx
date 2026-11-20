import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../cn";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-ui-muted text-ui-muted-foreground",
  info: "bg-ui-info-fill text-ui-info-ink",
  success: "bg-ui-success-fill text-ui-success-ink",
  warning: "bg-ui-warning-fill text-ui-warning-ink",
  danger: "bg-ui-danger-fill text-ui-danger-ink",
};

export function Badge({ className, tone = "neutral", ...badgeProps }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 [font-family:inherit] text-[0.6875rem] font-semibold uppercase tracking-[0.06em]",
        toneClasses[tone],
        className,
      )}
      {...badgeProps}
    />
  );
}
