import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../cn";

export type StatusPanelProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: "neutral" | "danger";
};

export function StatusPanel({
  eyebrow,
  title,
  description,
  actions,
  tone = "neutral",
  className,
  ...sectionProps
}: StatusPanelProps) {
  return (
    <section
      className={cn(
        "mx-auto grid w-full max-w-2xl gap-3 rounded-lg border border-ui-border bg-ui-surface p-6 text-ui-surface-foreground shadow-sm",
        tone === "danger" && "border-ui-danger",
        className,
      )}
      {...sectionProps}
    >
      {eyebrow ? (
        <p className={cn(
          "m-0 text-xs font-semibold uppercase tracking-[0.12em] text-ui-muted-foreground",
          tone === "danger" && "text-ui-danger",
        )}>
          {eyebrow}
        </p>
      ) : null}
      <h1 className="m-0 text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <div className="text-sm leading-6 text-ui-muted-foreground">{description}</div> : null}
      {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
    </section>
  );
}
