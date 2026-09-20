import { useRef, useState } from "react";

import { cn } from "../../cn";

export type ReasoningSliderProps = {
  value: string;
  values: readonly string[];
  onChange: (value: string) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

export function ReasoningSlider({
  value,
  values,
  onChange,
  disabled,
  className,
}: ReasoningSliderProps) {
  const interacting = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
  const displayed = draft ?? value;
  const index = values.indexOf(displayed);
  const label = displayed
    ? displayed === "xhigh"
      ? "Extra high"
      : displayed.charAt(0).toUpperCase() + displayed.slice(1)
    : "Default";
  const last = values.length - 1;

  async function commit(next: string) {
    interacting.current = false;
    setDraft(next);
    try {
      if (next !== value) await onChange(next);
    } finally {
      setDraft(null);
    }
  }

  function finish(input: HTMLInputElement) {
    if (!interacting.current) return;
    const next = values[Number(input.value)];
    if (next !== undefined) void commit(next);
  }

  return (
    <label
      className={cn(
        "flex shrink-0 items-center gap-2",
        disabled && "opacity-50",
        className,
      )}
      title={`Reasoning: ${label}`}
    >
      <span className="relative flex h-8 w-20 items-center sm:w-24">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[.3125rem] top-1/2 h-px rounded-full bg-ui-muted-foreground/40"
        >
          <span
            className="absolute inset-y-0 left-0 bg-ui-foreground"
            style={{
              width: `${last > 0 && index >= 0 ? (index / last) * 100 : 0}%`,
            }}
          />
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[.3125rem] top-1/2"
        >
          {values.map((level, step) => (
            <span
              key={level}
              style={{ left: `${last > 0 ? (step / last) * 100 : 0}%` }}
              className={`absolute size-[.1875rem] -translate-x-1/2 -translate-y-1/2 rounded-full ${step <= index ? "bg-ui-foreground" : "bg-ui-muted-foreground"}`}
            />
          ))}
        </span>
        <input
          type="range"
          aria-label="Reasoning level"
          min={0}
          max={Math.max(last, 0)}
          step={1}
          value={Math.max(index, 0)}
          aria-valuetext={label}
          disabled={disabled || last < 1}
          onPointerDown={(event) => {
            interacting.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => finish(event.currentTarget)}
          onPointerCancel={() => {
            interacting.current = false;
            setDraft(null);
          }}
          onKeyDown={(event) => {
            if (
              [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
                "PageUp",
                "PageDown",
              ].includes(event.key)
            ) {
              interacting.current = true;
            }
          }}
          onKeyUp={(event) => finish(event.currentTarget)}
          onBlur={(event) => finish(event.currentTarget)}
          onChange={(event) => {
            const next = values[Number(event.target.value)];
            if (next === undefined) return;
            if (interacting.current) setDraft(next);
            else void commit(next);
          }}
          className="reasoning-slider"
        />
      </span>
      <span
        aria-hidden="true"
        className="w-12 text-xs text-ui-muted-foreground"
      >
        {label}
      </span>
    </label>
  );
}
