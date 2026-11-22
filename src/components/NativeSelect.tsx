import { ChevronDown } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode } from "react";

import { cn } from "../cn";
import { Tooltip } from "./Interactions";

export type NativeSelectProps = Omit<ComponentPropsWithRef<"select">, "title"> & {
  density?: "compact" | "standard";
  wrapperClassName?: string;
  tooltip?: ReactNode | false;
};

// `appearance` lives in the stylesheet's components layer, where Chromium upgrades it to base-select.
const standardClasses =
  "h-7 w-full rounded-t-md rounded-b-none border-x-0 border-t-0 border-b-2 border-ui-border bg-transparent pt-1 pb-0.5 pl-2 pr-6 [font-family:inherit] text-sm leading-5 text-ui-foreground shadow-none outline-hidden [--ui-hover-weight:6%] [--ui-press-weight:12%] transition-colors hover:bg-ui-hover-fill active:bg-ui-press-fill focus:border-ui-accent-link focus:bg-[color-mix(in_srgb,var(--color-ui-accent)_8%,var(--color-ui-surface))] aria-invalid:border-ui-danger aria-invalid:focus:border-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground disabled:opacity-50";
const compactClasses =
  "h-5 w-full cursor-pointer rounded-t-md rounded-b-none border-x-0 border-t-0 border-b-2 border-ui-border bg-transparent py-0 pl-1 pr-5 [font-family:inherit] text-xs text-ui-muted-foreground outline-hidden [--ui-hover-weight:6%] [--ui-press-weight:12%] transition-colors hover:bg-ui-hover-fill active:bg-ui-press-fill focus:border-ui-accent-link focus:bg-[color-mix(in_srgb,var(--color-ui-accent)_8%,var(--color-ui-surface))] aria-invalid:border-ui-danger aria-invalid:focus:border-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground disabled:opacity-50";

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
          data-ui-native-select=""
          className={cn(density === "compact" ? compactClasses : standardClasses, className)}
        />
      </Tooltip>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-ui-muted-foreground",
          density === "compact" ? "right-0 size-3" : "size-3.5",
        )}
      />
    </div>
  );
}
