import { ChevronDown } from "lucide-react";
import { type ComponentPropsWithRef } from "react";

import { cn } from "../cn";

export type NativeSelectProps = ComponentPropsWithRef<"select"> & {
  density?: "compact" | "standard";
  wrapperClassName?: string;
};

const standardClasses =
  "min-h-11 w-full appearance-none rounded-md border border-ui-border bg-ui-background px-3 py-2 pr-9 text-sm text-ui-foreground outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-accent disabled:cursor-not-allowed disabled:opacity-50";
const compactClasses =
  "min-h-8 cursor-pointer appearance-none rounded-sm bg-transparent py-1 pr-5 pl-2 text-xs text-ui-muted-foreground hover:bg-ui-muted outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-accent disabled:cursor-not-allowed disabled:opacity-50";

export function NativeSelect({
  className,
  density = "standard",
  ref,
  wrapperClassName,
  ...selectProps
}: NativeSelectProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(density === "compact" ? compactClasses : standardClasses, className)}
        {...selectProps}
      />
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ui-muted-foreground",
          density === "compact" ? "right-1 size-3.5" : "size-4",
        )}
      />
    </div>
  );
}
