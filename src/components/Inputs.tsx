import { Check, ChevronDown } from "lucide-react";
import { Select } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../cn";

type InputAppearance = "default" | "subtle";

export type TextInputProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  appearance?: InputAppearance;
};

export type NumberInputProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  appearance?: InputAppearance;
};

export type SelectOption = Readonly<{
  label: string;
  value: string;
  disabled?: boolean;
}>;

export type SelectInputProps = {
  label: string;
  options: ReadonlyArray<SelectOption>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  density?: "compact" | "standard";
  appearance?: InputAppearance;
  invalid?: boolean;
  errorId?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  className?: string;
};

const defaultClasses =
  "h-7 w-full rounded-none border-x-0 border-t-0 border-b border-slate-300 bg-transparent pl-1 pr-0 [font-family:inherit] text-xs text-slate-900 shadow-none outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400 dark:border-slate-700 dark:bg-transparent dark:text-slate-100 dark:disabled:bg-transparent dark:disabled:text-slate-600";
const subtleClasses =
  "mb-px h-7 w-full border-x-0 border-t-0 border-b border-slate-300/70 bg-transparent px-1 [font-family:inherit] text-xs text-slate-700 outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-700/70 dark:text-slate-300 dark:disabled:text-slate-600";

function inputClassName(appearance: InputAppearance, className: string | undefined) {
  return cn(appearance === "subtle" ? subtleClasses : defaultClasses, className);
}

export function TextInput({
  appearance = "default",
  className,
  ...inputProps
}: TextInputProps) {
  return <input className={inputClassName(appearance, className)} type="text" {...inputProps} />;
}

export function NumberInput({
  appearance = "default",
  className,
  ...inputProps
}: NumberInputProps) {
  return (
    <input
      className={inputClassName(appearance, className)}
      data-ui-number-input
      type="number"
      {...inputProps}
    />
  );
}

export function SelectInput({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  density = "standard",
  appearance = "default",
  invalid = false,
  errorId,
  disabled = false,
  name,
  required,
  className,
}: SelectInputProps) {
  const compact = density === "compact";
  const triggerClasses = cn(
    appearance === "subtle" ? subtleClasses : defaultClasses,
    compact && "h-5 text-[0.625rem]",
    invalid && "border-ui-danger text-ui-danger",
    "flex min-w-0 items-center justify-between gap-1 overflow-hidden whitespace-nowrap text-left",
    className,
  );

  return (
    <Select.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      required={required}
    >
      <Select.Trigger
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        className={triggerClasses}
      >
        <Select.Value className="truncate" />
        <Select.Icon className="shrink-0 text-slate-400">
          <ChevronDown aria-hidden="true" className={compact ? "size-3" : "size-3.5"} strokeWidth={2} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-slate-300 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "relative flex h-7 cursor-default select-none items-center px-7 pr-2 [font-family:inherit] outline-hidden data-[disabled]:opacity-50 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-white",
                  compact ? "text-[0.625rem]" : "text-xs",
                )}
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
