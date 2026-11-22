import { type ChangeEvent, useId, useState } from "react";

import { cn } from "../cn";
import { type ColorFormat, type RgbColor, colorFormats, hexColorFormat, toHexColor } from "./color-formats";
import { InputError, TextInput } from "./Inputs";
import { NativeSelect } from "./NativeSelect";

export type ColorPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

const colorChannels = [
  { channel: "red", label: "Red" },
  { channel: "green", label: "Green" },
  { channel: "blue", label: "Blue" },
] as const;
const black: RgbColor = { red: 0, green: 0, blue: 0 };

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
  const [format, setFormat] = useState<ColorFormat>(hexColorFormat);
  const color = hexColorFormat.parse(value) ?? black;
  const [draft, setDraft] = useState(() => format.format(color));
  // `seenValue` is the last `value` prop; `emittedValue` is the color this draft last reported.
  // A typed entry keeps its spelling until `value` changes to something the draft did not report.
  const [seenValue, setSeenValue] = useState(value);
  const [emittedValue, setEmittedValue] = useState<string | null>(null);
  const nameId = useId();
  const errorId = useId();
  const draftIsValid = format.parse(draft) !== undefined;

  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== emittedValue) setDraft(format.format(color));
  }

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
    const parsed = format.parse(event.target.value);
    if (!parsed) return;
    const next = toHexColor(parsed);
    setEmittedValue(next);
    if (next !== value) onValueChange(next);
  };

  const handleFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = colorFormats.find((entry) => entry.id === event.target.value) ?? hexColorFormat;
    setFormat(next);
    setDraft(next.format(color));
    setEmittedValue(null);
  };

  return (
    <fieldset
      aria-labelledby={nameId}
      disabled={disabled}
      className={cn(
        "m-0 grid min-w-0 gap-3 border-0 p-0 text-ui-foreground disabled:cursor-not-allowed disabled:text-ui-muted-foreground",
        className,
      )}
    >
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <span id={nameId} className="min-w-0 flex-1 text-sm font-medium">{label}</span>
          <NativeSelect
            aria-label={`${label} format`}
            density="compact"
            value={format.id}
            disabled={disabled}
            onChange={handleFormatChange}
            wrapperClassName="shrink-0"
            className="w-auto"
          >
            {colorFormats.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
          </NativeSelect>
          <TextInput
            aria-label={`${label} ${format.id} value`}
            aria-describedby={draftIsValid ? undefined : errorId}
            aria-invalid={!draftIsValid}
            value={draft}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={handleDraftChange}
            className={cn(format.fieldWidth, "tabular-nums")}
          />
        </div>
        {!draftIsValid && <InputError id={errorId}>{format.hint}</InputError>}
      </div>
      {/* The swatch is the native color input itself, so clicking it opens the browser's picker. */}
      <input
        type="color"
        aria-label={`${label} color well`}
        value={toHexColor(color)}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value.toLowerCase())}
        className="h-10 w-full cursor-pointer rounded-md border border-ui-border bg-transparent p-0 outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-color-swatch]:rounded-[5px] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[5px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
      />
      <div className="grid gap-2">
        {colorChannels.map(({ channel, label: channelLabel }) => (
          <ColorChannel
            key={channel}
            colorLabel={label}
            label={channelLabel}
            value={color[channel]}
            disabled={disabled}
            onValueChange={(nextValue) => onValueChange(toHexColor({ ...color, [channel]: nextValue }))}
          />
        ))}
      </div>
    </fieldset>
  );
}
