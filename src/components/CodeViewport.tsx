import type { ComponentPropsWithRef } from "react";

import { cn } from "../cn";

export type CodeViewportProps = ComponentPropsWithRef<"pre"> & { wrap?: boolean };

export function CodeViewport({ children, className, wrap = false, ...props }: CodeViewportProps) {
  return (
    <div className="min-w-0" data-code-viewport>
      <pre
        tabIndex={0}
        {...props}
        className={cn(
          "m-0 max-h-[calc(10lh+1rem)] overflow-auto scroll-smooth px-3 py-2 font-mono text-xs leading-5 text-ui-foreground [scrollbar-width:thin] motion-reduce:scroll-auto",
          wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre [overflow-wrap:normal]",
          className,
        )}
      >
        {children}
      </pre>
    </div>
  );
}
