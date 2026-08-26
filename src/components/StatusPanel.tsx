import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { classNames } from "../classNames";

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
      className={classNames(
        "mx-auto grid w-full max-w-2xl gap-3 rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
        tone === "danger" && "border-red-200 dark:border-red-900",
        className,
      )}
      {...sectionProps}
    >
      {eyebrow ? (
        <p className={classNames(
          "m-0 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400",
          tone === "danger" && "text-red-700 dark:text-red-300",
        )}>
          {eyebrow}
        </p>
      ) : null}
      <h1 className="m-0 text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</div> : null}
      {actions ? <div className="flex flex-wrap gap-2 pt-1">{actions}</div> : null}
    </section>
  );
}
