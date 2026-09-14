import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "../cn";

export type ContentBlockProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  title: ReactNode;
  icon?: ReactNode;
  metadata?: readonly ReactNode[] | undefined;
  corner?: ReactNode;
};

export function ContentBlock({ title, icon, metadata, corner, children, className, ...props }: ContentBlockProps) {
  return (
    <section
      data-content-block
      className={cn("relative min-w-0 rounded-md border border-ui-border bg-ui-background text-sm text-ui-foreground [&>[data-code-viewport]]:pt-2", className)}
      {...props}
    >
      <header className="absolute -top-3 right-3 left-3 flex h-6 items-center text-[.8125rem]">
        <span className="flex h-6 min-w-0 items-center gap-1 rounded-md bg-ui-background pr-2 pl-1 text-ui-muted-foreground">
          {icon}
          <span className="truncate font-medium leading-6 text-ui-foreground">
            {title}
            {metadata?.map((segment, index) => segment != null && segment !== false && (
              <Fragment key={index}>
                {" "}<span aria-hidden="true" className="mx-1 text-ui-muted-foreground">·</span>{" "}{segment}
              </Fragment>
            ))}
          </span>
        </span>
      </header>
      {children}
      {corner && (
        <div data-content-block-corner className="absolute top-2 right-2 z-10 grid min-h-8 min-w-8 place-items-center rounded bg-ui-background text-ui-muted-foreground [&_button]:size-8 [&_button_svg]:size-3.5">
          {corner}
        </div>
      )}
    </section>
  );
}
