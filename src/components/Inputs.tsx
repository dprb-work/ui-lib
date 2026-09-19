import { Check, ChevronDown, Search } from "lucide-react";
import { Select } from "radix-ui";
import { type ComponentPropsWithRef, type ReactNode, useId } from "react";

import { cn } from "../cn";
import { Tooltip } from "./Interactions";
import { usePortalContainer } from "./portal-context";

type InputAppearance = "default" | "subtle";

export type TextInputProps = Omit<ComponentPropsWithRef<"input">, "type" | "title"> & {
  appearance?: InputAppearance;
  error?: ReactNode;
  type?: "text" | "search";
  tooltip?: ReactNode | false;
};

export type NumberInputProps = Omit<ComponentPropsWithRef<"input">, "type" | "title"> & {
  appearance?: InputAppearance;
  error?: ReactNode;
  tooltip?: ReactNode | false;
};

export type TextareaInputProps = Omit<ComponentPropsWithRef<"textarea">, "title"> & {
  appearance?: InputAppearance;
  error?: ReactNode;
  tooltip?: ReactNode | false;
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
  tooltip?: ReactNode | false;
};

const defaultClasses =
  "h-7 w-full rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent pl-1 pr-0 [font-family:inherit] text-xs text-ui-foreground shadow-none outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";
const subtleClasses =
  "h-7 w-full border-x-0 border-t-0 border-b border-ui-border/70 bg-transparent px-1 [font-family:inherit] text-xs text-ui-muted-foreground outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:text-ui-muted-foreground";

const textareaDefaultClasses =
  "min-h-16 w-full rounded-none border-x-0 border-t-0 border-b border-ui-border bg-transparent px-1 py-1 [field-sizing:content] [font-family:inherit] text-xs text-ui-foreground shadow-none outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:bg-transparent disabled:text-ui-muted-foreground";
const textareaSubtleClasses =
  "min-h-16 w-full border-x-0 border-t-0 border-b border-ui-border/70 bg-transparent px-1 py-1 [field-sizing:content] [font-family:inherit] text-xs text-ui-muted-foreground outline-hidden transition-colors focus:border-ui-accent aria-invalid:border-ui-danger aria-invalid:text-ui-danger disabled:cursor-not-allowed disabled:text-ui-muted-foreground";

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
  ref,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  type = "text",
  tooltip,
  ...inputProps
}: TextInputProps) {
  const generatedId = useId();
  const errorId = `${id ?? generatedId}-error`;
  const description = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ");
  return (
    <div className="grid gap-1">
      <div className="relative">
        {type === "search" && <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1 size-3.5 -translate-y-1/2 text-ui-muted-foreground" />}
        <Tooltip label={tooltip}>
          <input
            {...inputProps}
            ref={ref}
            id={id}
            aria-describedby={description || undefined}
            aria-invalid={error ? true : ariaInvalid}
            className={inputClassName(appearance, cn(type === "search" && "pl-6", className))}
            type={type}
          />
        </Tooltip>
      </div>
      {error && <InputError id={errorId}>{error}</InputError>}
    </div>
  );
}

export function TextareaInput({
  appearance = "default",
  error,
  id,
  className,
  ref,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  tooltip,
  ...textareaProps
}: TextareaInputProps) {
  const generatedId = useId();
  const errorId = `${id ?? generatedId}-error`;
  const description = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ");
  return (
    <div className="grid gap-1">
      <Tooltip label={tooltip}>
        <textarea
          {...textareaProps}
          ref={ref}
          id={id}
          aria-describedby={description || undefined}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(
            appearance === "subtle" ? textareaSubtleClasses : textareaDefaultClasses,
            className,
          )}
        />
      </Tooltip>
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
  ref,
  tooltip,
  ...inputProps
}: NumberInputProps) {
  const generatedId = useId();
  const errorId = `${id ?? generatedId}-error`;
  const description = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ");
  return (
    <div className="grid gap-1">
      <Tooltip label={tooltip}>
        <input
          {...inputProps}
          ref={ref}
          id={id}
          aria-describedby={description || undefined}
          aria-invalid={error ? true : ariaInvalid}
          className={inputClassName(appearance, className)}
          data-ui-number-input
          type="number"
        />
      </Tooltip>
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
  tooltip,
}: SelectInputProps) {
  const portalContainer = usePortalContainer();
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const isInvalid = invalid || Boolean(error);
  const compact = density === "compact";
  const triggerClasses = cn(
    appearance === "subtle" ? subtleClasses : defaultClasses,
    compact && "h-5 text-xs",
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
        {tooltip === false || tooltip == null ? (
          <Select.Trigger
            aria-label={label}
            aria-invalid={isInvalid || undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(triggerClasses, !compact && "text-sm")}
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
        ) : (
          <Tooltip label={tooltip}>
            <Select.Trigger
              aria-label={label}
              aria-invalid={isInvalid || undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(triggerClasses, !compact && "text-sm")}
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
          </Tooltip>
        )}
        <Select.Portal container={portalContainer}>
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
                    compact ? "text-xs" : "text-xs",
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
