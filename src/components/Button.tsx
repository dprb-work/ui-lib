import type { ComponentPropsWithoutRef } from "react";

import { classNames } from "../classNames";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "small" | "default" | "icon";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-md border [font:inherit] font-semibold outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ui-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-950 [&_svg]:shrink-0";

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
  default: "h-8 px-3 text-xs [&_svg]:size-4",
  icon: "size-8 p-0 text-xs [&_svg]:size-4",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-ui-accent bg-ui-accent text-ui-on-accent hover:border-ui-accent-hover hover:bg-ui-accent-hover",
  secondary:
    "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost:
    "border-transparent bg-transparent text-slate-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10",
  danger:
    "border-ui-danger bg-ui-danger text-ui-on-danger hover:border-ui-danger-hover hover:bg-ui-danger-hover focus-visible:ring-ui-danger",
};

export function Button({
  className,
  size = "default",
  type = "button",
  variant = "primary",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...buttonProps}
    />
  );
}
