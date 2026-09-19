import { ChevronDown } from "lucide-react";
import { type ComponentPropsWithRef } from "react";

import { cn } from "../cn";

export type NativeSelectProps = ComponentPropsWithRef<"select"> & {
  density?: "compact" | "standard";
  wrapperClassName?: string;
};

const standardClasses =
  "min-h-11 w-full appearance-none rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent pt-2 pl-1 pr-6 [font-family:inherit] text-xs text-ui-foreground shadow-none outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";
const compactClasses =
  "min-h-8 w-full cursor-pointer appearance-none rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent pl-1 pr-5 [font-family:inherit] text-[0.625rem] text-ui-muted-foreground outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";

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
          "pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-ui-muted-foreground",
          density === "compact" ? "right-0 size-3" : "top-[calc(50%+0.25rem)] size-3.5",
        )}
      />
    </div>
  );
}
