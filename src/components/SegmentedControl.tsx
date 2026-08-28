import type { CSSProperties, ReactNode } from "react";

import { cn } from "../cn";

export type SegmentedControlOption<Value extends string = string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

export type SegmentedControlProps<Value extends string = string> = {
  ariaLabel: string;
  options: readonly SegmentedControlOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  children?: (option: SegmentedControlOption<Value>) => ReactNode;
  className?: string;
  buttonClassName?: string;
};

export function SegmentedControl<Value extends string>({
  ariaLabel,
  options,
  value,
  onValueChange,
  children,
  className,
  buttonClassName,
}: SegmentedControlProps<Value>) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const style = {
    gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
  } satisfies CSSProperties;

  return (
    <div
      className={cn(
        "relative isolate inline-grid rounded-lg border border-ui-border bg-ui-muted",
        className,
      )}
      style={style}
      role="group"
      aria-label={ariaLabel}
      data-ui-segmented-control=""
    >
      {selectedIndex >= 0 && options.length > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-[0.4375rem] bg-ui-surface transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
          data-ui-segment-indicator=""
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={option.disabled}
          className={cn(
            "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-ui-muted-foreground outline-hidden transition-colors duration-200 hover:text-ui-foreground focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:text-ui-surface-foreground motion-reduce:transition-none [&_svg]:size-3.5 [&_svg]:shrink-0",
            buttonClassName,
          )}
          onClick={() => onValueChange(option.value)}
        >
          {children ? children(option) : <span>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}
