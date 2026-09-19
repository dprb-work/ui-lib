import type { ComponentPropsWithRef, ReactNode } from "react";

import { Button } from "./Button";

export type IconButtonProps = Omit<
  ComponentPropsWithRef<typeof Button>,
  "aria-label" | "children" | "label" | "size" | "title" | "tooltip"
> & {
  label: string;
  size?: "small" | "default" | "large";
  children: ReactNode;
  tooltip?: ReactNode | false;
};

const sizeClasses = {
  small: "h-6 w-6 [&_svg]:size-3",
  default: "h-8 w-8 [&_svg]:size-4",
  large: "h-11 w-11 [&_svg]:size-5",
} as const;

export function IconButton({
  label,
  size = "default",
  className,
  variant = "ghost",
  children,
  tooltip,
  ref,
  ...buttonProps
}: IconButtonProps) {
  const classes = [sizeClasses[size], className].filter(Boolean).join(" ");
  return (
    <Button
      {...buttonProps}
      ref={ref}
      aria-label={label}
      size="icon"
      variant={variant}
      className={classes}
      tooltip={tooltip === undefined ? label : tooltip}
    >
      {children}
    </Button>
  );
}
