import { cn } from "../../cn";
import { NativeSelect } from "../../components/NativeSelect";
import { ReasoningSlider } from "./ReasoningSlider";

export type ModelControlOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ModelControlsProps = {
  value: string;
  options: readonly ModelControlOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  tooltip?: string;
  reasoning?: {
    value: string;
    values: readonly string[];
    onValueChange: (value: string) => void | Promise<void>;
  };
  className?: string;
};

export function ModelControls({
  value,
  options,
  onValueChange,
  disabled,
  tooltip,
  reasoning,
  className,
}: ModelControlsProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <NativeSelect
        density="compact"
        aria-label="Model"
        value={value}
        tooltip={tooltip ?? "Choose a model"}
        disabled={disabled}
        className="w-24"
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </NativeSelect>
      {reasoning && reasoning.values.length > 0 && (
        <ReasoningSlider
          value={reasoning.value}
          values={reasoning.values}
          disabled={disabled}
          onChange={reasoning.onValueChange}
        />
      )}
    </div>
  );
}
