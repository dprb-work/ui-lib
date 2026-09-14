import { type ChangeEvent, useId, useState } from "react";

import { cn } from "../cn";
import { TextInput } from "./Inputs";

export type ColorPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

type RgbColor = Readonly<{
  red: number;
  green: number;
  blue: number;
}>;

const hexColorPattern = /^#([0-9a-f]{6})$/i;
const colorChannels = [
  { channel: "red", label: "Red" },
  { channel: "green", label: "Green" },
  { channel: "blue", label: "Blue" },
] as const;

function parseHexColor(value: string): RgbColor | undefined {
  const match = hexColorPattern.exec(value);
  if (!match) {
    return undefined;
  }

  const hex = match[1];
  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function toHexColor({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function ColorChannel({
  colorLabel,
  label,
  value,
  disabled,
  onValueChange,
}: {
  colorLabel: string;
  label: string;
  value: number;
  disabled: boolean;
  onValueChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 text-xs">
      <label htmlFor={id} className="text-ui-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-label={`${colorLabel} ${label} channel`}
        type="range"
        min={0}
        max={255}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ui-muted accent-ui-accent outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
      />
      <output htmlFor={id} className="text-right tabular-nums text-ui-muted-foreground">
        {value}
      </output>
    </div>
  );
}

export function ColorPicker({
  value,
  onValueChange,
  label,
  disabled = false,
  className,
}: ColorPickerProps) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const hexInputId = useId();
  const color = parseHexColor(value);
  const channels = color ?? { red: 0, green: 0, blue: 0 };
  const displayColor = color ? value : "#000000";
  const draftIsValid = parseHexColor(draft) !== undefined;

  if (value !== previousValue) {
    setPreviousValue(value);
    setDraft(value);
  }

  const handleHexChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    const parsedColor = parseHexColor(nextDraft);
    if (parsedColor) {
      onValueChange(toHexColor(parsedColor));
    }
  };

  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "m-0 grid min-w-0 gap-3 border-0 p-0 text-ui-foreground disabled:cursor-not-allowed disabled:text-ui-muted-foreground",
        className,
      )}
    >
      <legend className="p-0 text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`${label} color well`}
          value={displayColor}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value.toLowerCase())}
          className="size-10 shrink-0 cursor-pointer rounded-md border border-ui-border bg-transparent p-0.5 outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div
          aria-label={`${label} preview`}
          role="img"
          className="h-10 min-w-0 flex-1 rounded-md border border-ui-border"
          style={{ backgroundColor: displayColor }}
        />
        <span className="font-mono text-xs text-ui-muted-foreground">{value}</span>
      </div>
      <div className="grid gap-2">
        {colorChannels.map(({ channel, label: channelLabel }) => (
          <ColorChannel
            key={channel}
            colorLabel={label}
            label={channelLabel}
            value={channels[channel]}
            disabled={disabled}
            onValueChange={(nextValue) =>
              onValueChange(toHexColor({ ...channels, [channel]: nextValue }))
            }
          />
        ))}
      </div>
      <div className="grid gap-1">
        <label htmlFor={hexInputId} className="text-xs text-ui-muted-foreground">
          Hex value
        </label>
        <TextInput
          id={hexInputId}
          aria-label={`${label} hex value`}
          value={draft}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-invalid={!draftIsValid}
          error={!draftIsValid ? "Enter a six-digit hex value, for example #4f46e5." : undefined}
          onChange={handleHexChange}
        />
      </div>
    </fieldset>
  );
}
