import { LoaderCircle } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "../cn";
import { Tooltip } from "./Interactions";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "small" | "default" | "icon";

export type ButtonProps = Omit<ComponentPropsWithRef<"button">, "title"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tooltip?: ReactNode | false;
};

const baseClasses =
  "relative inline-flex items-center justify-center gap-ui-icon-text rounded-md border [font-family:inherit] font-semibold outline-hidden transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0";

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-7 px-2.5 text-xs [&_svg]:size-3.5",
  default: "h-8 px-3 text-xs [&_svg]:size-4",
  icon: "h-8 w-8 p-0 text-xs [&_svg]:size-4",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-ui-accent bg-ui-accent text-ui-on-accent hover:bg-ui-accent-hover active:bg-ui-accent-press-fill focus-visible:shadow-[inset_0_0_0_2px_var(--color-ui-on-accent)]",
  secondary:
    "border-ui-border bg-ui-surface text-ui-surface-foreground hover:bg-ui-hover-fill active:bg-ui-press-fill focus-visible:shadow-[inset_0_0_0_2px_var(--color-ui-accent-link)]",
  ghost:
    "border-transparent bg-transparent text-ui-muted-foreground hover:bg-ui-hover-fill active:bg-ui-press-fill focus-visible:shadow-[inset_0_0_0_2px_var(--color-ui-accent-link)]",
  danger:
    "border-ui-danger-ink bg-transparent text-ui-danger hover:bg-ui-danger-fill active:bg-ui-danger-press-fill focus-visible:shadow-[inset_0_0_0_2px_var(--color-ui-danger-ink)]",
};

export function Button({
  className,
  children,
  "aria-busy": ariaBusy,
  size = "default",
  type = "button",
  variant = "primary",
  tooltip,
  ref,
  ...buttonProps
}: ButtonProps) {
  const busy = ariaBusy === true || ariaBusy === "true";
  const selected = buttonProps["aria-pressed"] === true || buttonProps["aria-pressed"] === "true";
  const iconOnly = size === "icon";
  const filledSelection = !iconOnly && variant === "secondary" && selected;
  const button = (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      aria-busy={ariaBusy}
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[filledSelection ? "primary" : variant],
        iconOnly && variant !== "primary" && "focus-visible:border-ui-accent-link focus-visible:bg-ui-press-fill focus-visible:shadow-none",
        selected && (variant === "ghost" || (iconOnly && variant !== "primary")) && "text-ui-accent",
        className,
      )}
    >
      {busy && (
        <LoaderCircle
          data-ui-busy-spinner=""
          aria-hidden="true"
          className={cn("size-4 shrink-0 animate-spin motion-reduce:animate-none", iconOnly && "absolute inset-0 m-auto")}
        />
      )}
      {iconOnly ? (
        // Keep the wrapper in both states so busy changes never remount caller content.
        <span data-ui-busy-content="" className={cn("inline-flex items-center justify-center", busy && "opacity-0")}>
          {children}
        </span>
      ) : children}
    </button>
  );

  return <Tooltip label={tooltip}>{button}</Tooltip>;
}
