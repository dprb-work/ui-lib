import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "../cn";

export type StatusMessageProps = Omit<ComponentPropsWithRef<"p">, "children"> & {
  icon: ReactNode;
  children: ReactNode;
};

export function StatusMessage({ icon, children, className, ref, ...props }: StatusMessageProps) {
  return (
    <p
      {...props}
      ref={ref}
      className={cn("m-0 flex min-w-0 items-start gap-ui-icon-text", className)}
    >
      <span aria-hidden="true" className="shrink-0 [&_svg]:shrink-0">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
