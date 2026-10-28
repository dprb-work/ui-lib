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
  "ui-select-control min-h-11 w-full appearance-none pr-8 [font-family:inherit] outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ui-accent aria-invalid:text-ui-danger aria-invalid:focus-visible:ring-ui-danger disabled:cursor-not-allowed disabled:text-ui-muted-foreground disabled:opacity-60";
const compactClasses =
  "ui-select-control min-h-8 w-full cursor-pointer appearance-none pr-6 [font-family:inherit] outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ui-accent aria-invalid:text-ui-danger aria-invalid:focus-visible:ring-ui-danger disabled:cursor-not-allowed disabled:text-ui-muted-foreground disabled:opacity-60";

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
