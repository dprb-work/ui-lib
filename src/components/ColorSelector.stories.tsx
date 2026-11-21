import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { ColorSelector } from "./ColorSelector";

const meta = {
  title: "Components/ColorSelector",
  component: ColorSelector,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ColorSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleColors = ["#2563eb", "#0f766e", "#c2410c", "#7e22ce", "#475569"];
const initialColors = [...sampleColors, ...sampleColors];

function InteractiveSelector() {
  const [colors, setColors] = useState(initialColors);
  const updateColor = (index: number, value: string) =>
    setColors((current) => current.map((color, slot) => slot === index ? value : color));

  return (
    <div className="grid gap-5 p-5">
      <ColorSelector label="Series color" colors={colors} onValueChange={updateColor} />
      <div className="flex items-center gap-1" aria-label="Example selector states">
        <ColorSelector label="Hover example" colors={[initialColors[0]]} onValueChange={() => {}} className="[&>button:hover]:border-ui-foreground" />
        <ColorSelector label="Focus example" colors={[initialColors[1]]} onValueChange={() => {}} className="[&>button:focus-visible]:ring-2 [&>button:focus-visible]:ring-ui-accent" />
        <ColorSelector label="Disabled example" colors={[initialColors[2]]} onValueChange={() => {}} disabled />
      </div>
      <p className="text-xs text-ui-muted-foreground">Hover or focus a slot to preview its state; open a slot to edit its color.</p>
    </div>
  );
}

export const StatesAndInteraction: Story = {
  args: { colors: initialColors, onValueChange: fn() },
  render: () => <InteractiveSelector />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const firstSlot = canvas.getByRole("button", { name: "Series color 1" });
    await expect(canvas.getByRole("button", { name: "Disabled example 1" })).toBeDisabled();
    await userEvent.click(firstSlot);
    const picker = body.getByRole("dialog", { name: "Series color 1 picker" });
    await expect(picker).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(firstSlot).toHaveFocus();
  },
};
