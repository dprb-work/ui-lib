import { DropdownMenu } from "radix-ui";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "../cn";

export type MenuItemProps = Omit<ComponentPropsWithRef<typeof DropdownMenu.Item>, "asChild" | "children"> & {
  icon?: ReactNode;
  children: ReactNode;
};

export function MenuItem({ icon, children, className, ref, ...props }: MenuItemProps) {
  return (
    <DropdownMenu.Item
      {...props}
      ref={ref}
      className={cn("flex min-w-0 items-center gap-ui-icon-text", className)}
    >
      {icon ? <span aria-hidden="true" className="shrink-0 [&_svg]:shrink-0">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </DropdownMenu.Item>
  );
}
