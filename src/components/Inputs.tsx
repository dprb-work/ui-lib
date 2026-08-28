import { Check, ChevronDown } from "lucide-react";
import { Select } from "radix-ui";
import { type ComponentPropsWithoutRef, type ReactNode, useId } from "react";

import { cn } from "../cn";

type InputAppearance = "default" | "subtle";

export type TextInputProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  appearance?: InputAppearance;
  error?: ReactNode;
};

export type NumberInputProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  appearance?: InputAppearance;
  error?: ReactNode;
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
  error?: ReactNode;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  className?: string;
};

const defaultClasses =
  "h-7 w-full rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent pl-1 pr-0 [font-family:inherit] text-xs text-ui-foreground shadow-none outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";
const subtleClasses =
  "mb-px h-7 w-full border-x-0 border-t-0 border-b border-ui-border/70 bg-transparent px-1 [font-family:inherit] text-xs text-ui-muted-foreground outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:text-ui-muted-foreground";

function inputClassName(appearance: InputAppearance, className: string | undefined) {
  return cn(appearance === "subtle" ? subtleClasses : defaultClasses, className);
}

function InputError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} aria-hidden="true" className="m-0 text-xs leading-4 text-ui-danger">
      {children}
    </p>
  );
}

export function TextInput({
  appearance = "default",
  error,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...inputProps
}: TextInputProps) {
  const generatedId = useId();
  const errorId = `${id ?? generatedId}-error`;
  const description = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ");
  return (
    <div className="grid gap-1">
      <input
        {...inputProps}
        id={id}
        aria-describedby={description || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={inputClassName(appearance, className)}
        type="text"
      />
      {error && <InputError id={errorId}>{error}</InputError>}
    </div>
  );
}

export function NumberInput({
  appearance = "default",
  error,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...inputProps
}: NumberInputProps) {
  const generatedId = useId();
  const errorId = `${id ?? generatedId}-error`;
  const description = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ");
  return (
    <div className="grid gap-1">
      <input
        {...inputProps}
        id={id}
        aria-describedby={description || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={inputClassName(appearance, className)}
        data-ui-number-input
        type="number"
      />
      {error && <InputError id={errorId}>{error}</InputError>}
    </div>
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
  error,
  disabled = false,
  name,
  required,
  className,
}: SelectInputProps) {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const isInvalid = invalid || Boolean(error);
  const compact = density === "compact";
  const triggerClasses = cn(
    appearance === "subtle" ? subtleClasses : defaultClasses,
    compact && "h-5 text-[0.625rem]",
    isInvalid && "border-ui-danger text-ui-danger",
    "flex min-w-0 items-center justify-between gap-1 overflow-hidden whitespace-nowrap text-left",
    className,
  );

  return (
    <div className="grid gap-1">
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
          aria-invalid={isInvalid || undefined}
          aria-describedby={error ? errorId : undefined}
          className={triggerClasses}
        >
          <Select.Value className="truncate" />
          <Select.Icon className="shrink-0 text-ui-muted-foreground">
            <ChevronDown
              aria-hidden="true"
              className={compact ? "size-3" : "size-3.5"}
              strokeWidth={2}
            />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-ui-border bg-ui-surface text-ui-surface-foreground shadow-xl"
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
                    "relative flex h-7 cursor-default select-none items-center px-7 pr-2 [font-family:inherit] outline-hidden data-[disabled]:opacity-50 data-[highlighted]:bg-ui-muted data-[highlighted]:text-ui-foreground",
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
      {error && <InputError id={errorId}>{error}</InputError>}
    </div>
  );
}
