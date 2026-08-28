import { Check } from "lucide-react";
import { Checkbox as RadixCheckbox, Switch as RadixSwitch } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../cn";

export type SwitchProps = Omit<
  ComponentPropsWithoutRef<typeof RadixSwitch.Root>,
  "aria-label" | "children"
> & {
  label: string;
};

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof RadixCheckbox.Root>,
  "aria-label" | "children"
> & {
  label: string;
};

export function Switch({ label, className, ...switchProps }: SwitchProps) {
  return (
    <RadixSwitch.Root
      aria-label={label}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full bg-ui-border p-0.5 outline-hidden transition-colors data-[state=checked]:bg-ui-accent focus-visible:ring-2 focus-visible:ring-ui-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ui-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...switchProps}
    >
      <RadixSwitch.Thumb className="block size-4 rounded-full bg-ui-surface shadow-sm transition-transform data-[state=checked]:translate-x-4" />
    </RadixSwitch.Root>
  );
}

export function Checkbox({ label, className, ...checkboxProps }: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      aria-label={label}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-xs border border-ui-border bg-ui-surface text-ui-on-accent outline-hidden data-[state=checked]:border-ui-accent data-[state=checked]:bg-ui-accent focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...checkboxProps}
    >
      <RadixCheckbox.Indicator>
        <Check aria-hidden="true" className="size-[0.6875rem]" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
