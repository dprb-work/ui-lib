import { ChevronDown } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode } from "react";

import { cn } from "../cn";
import { Tooltip } from "./Interactions";

export type NativeSelectProps = Omit<ComponentPropsWithRef<"select">, "title"> & {
  density?: "compact" | "standard";
  wrapperClassName?: string;
  tooltip?: ReactNode | false;
};

const standardClasses =
  "min-h-11 w-full appearance-none rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent pt-2 pl-1 pr-6 [font-family:inherit] text-sm text-ui-foreground shadow-none outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";
const compactClasses =
  "min-h-8 w-full cursor-pointer appearance-none rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent pl-1 pr-5 [font-family:inherit] text-sm text-ui-muted-foreground outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";

export function NativeSelect({
  className,
  density = "standard",
  ref,
  wrapperClassName,
  tooltip,
  ...selectProps
}: NativeSelectProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Tooltip label={tooltip}>
        <select
          {...selectProps}
          ref={ref}
          className={cn(density === "compact" ? compactClasses : standardClasses, className)}
        />
      </Tooltip>
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
