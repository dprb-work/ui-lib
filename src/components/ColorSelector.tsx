import { useState } from "react";

import { cn } from "../cn";
import { ColorPicker } from "./ColorPicker";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Tooltip } from "./Interactions";

export type ColorSelectorProps = {
  colors: readonly string[];
  onValueChange: (index: number, value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function ColorSelector({
  colors,
  onValueChange,
  label = "Color",
  disabled = false,
  className,
}: ColorSelectorProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center gap-0.5", className)}>
      {colors.map((color, index) => {
        const slotLabel = `${label} ${index + 1}`;
        const isOpen = openIndex === index;
        return (
          <Popover
            key={index}
            open={isOpen}
            onOpenChange={(open) => setOpenIndex(open ? index : null)}
          >
            <Tooltip label={slotLabel}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={slotLabel}
                  disabled={disabled}
                  className={cn(
                    "size-6 shrink-0 rounded-sm border border-ui-border outline-hidden transition-colors hover:border-ui-foreground focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ui-accent disabled:cursor-not-allowed disabled:opacity-40",
                    isOpen && "border-2 border-ui-foreground",
                  )}
                  style={{ backgroundColor: `var(--ui-color-selector-${index + 1}, ${color})` }}
                />
              </PopoverTrigger>
            </Tooltip>
            <PopoverContent aria-label={`${slotLabel} picker`} className="w-72">
              <ColorPicker
                label={slotLabel}
                value={color}
                onValueChange={(value) => onValueChange(index, value)}
                disabled={disabled}
              />
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
