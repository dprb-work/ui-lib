import { Check } from "lucide-react";
import { Checkbox as RadixCheckbox, Switch as RadixSwitch } from "radix-ui";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { cn } from "../cn";
import { Tooltip } from "./Interactions";

export type SwitchProps = Omit<
  ComponentPropsWithRef<typeof RadixSwitch.Root>,
  "aria-label" | "children" | "title"
> & {
  label: string;
  tooltip?: ReactNode | false;
};

export type CheckboxProps = Omit<
  ComponentPropsWithRef<typeof RadixCheckbox.Root>,
  "aria-label" | "children" | "title"
> & {
  label: string;
  tooltip?: ReactNode | false;
};

export function Switch({ label, className, tooltip, ref, ...switchProps }: SwitchProps) {
  const control = (
    <RadixSwitch.Root
      {...switchProps}
      ref={ref}
      aria-label={label}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full bg-ui-border p-0.5 outline-hidden transition-colors data-[state=checked]:bg-ui-accent focus-visible:ring-2 focus-visible:ring-ui-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ui-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <RadixSwitch.Thumb className="block size-4 rounded-full bg-ui-surface shadow-sm transition-transform data-[state=checked]:translate-x-4" />
    </RadixSwitch.Root>
  );

  return <Tooltip label={tooltip}>{control}</Tooltip>;
}

export function Checkbox({ label, className, tooltip, ref, ...checkboxProps }: CheckboxProps) {
  const control = (
    <RadixCheckbox.Root
      {...checkboxProps}
      ref={ref}
      aria-label={label}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-xs border border-ui-border bg-ui-surface text-ui-on-accent outline-hidden data-[state=checked]:border-ui-accent data-[state=checked]:bg-ui-accent focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <RadixCheckbox.Indicator>
        <Check aria-hidden="true" className="size-[0.6875rem]" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  return <Tooltip label={tooltip}>{control}</Tooltip>;
}
