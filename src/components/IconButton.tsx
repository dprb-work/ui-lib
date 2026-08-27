import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button } from "./Button";

export type IconButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "aria-label" | "children" | "size" | "title"
> & {
  label: string;
  size?: "small" | "default" | "large";
  children: ReactNode;
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
  ...buttonProps
}: IconButtonProps) {
  const classes = [sizeClasses[size], className].filter(Boolean).join(" ");
  return (
    <Button
      aria-label={label}
      title={label}
      size="icon"
      variant={variant}
      className={classes}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
