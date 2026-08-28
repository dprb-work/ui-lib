import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "small" | "default" | "icon";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-md border [font-family:inherit] font-semibold outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ui-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ui-background disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0";

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
  default: "h-8 px-3 text-xs [&_svg]:size-4",
  icon: "h-8 w-8 p-0 text-xs [&_svg]:size-4",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-ui-accent bg-ui-accent text-ui-on-accent hover:border-ui-accent-hover hover:bg-ui-accent-hover",
  secondary:
    "border-ui-border bg-ui-surface text-ui-surface-foreground hover:bg-ui-muted",
  ghost:
    "border-transparent bg-transparent text-ui-muted-foreground hover:bg-ui-muted hover:text-ui-foreground",
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
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...buttonProps}
    />
  );
}
