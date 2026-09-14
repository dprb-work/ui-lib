import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { ColorPicker } from "./ColorPicker";

const meta = {
  title: "Components/ColorPicker",
  component: ColorPicker,
  args: { label: "Accent color", value: "#4f46e5", onValueChange: () => {} },
  parameters: { layout: "centered" },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function ColorPickerExample() {
  const [value, setValue] = useState("#4f46e5");

  return (
    <div className="grid w-80 gap-6 rounded-xl border border-ui-border bg-ui-surface p-6 text-ui-surface-foreground shadow-sm">
      <ColorPicker label="Accent color" value={value} onValueChange={setValue} />
      <Button variant="secondary" onClick={() => setValue("#0f766e")}>
        Reset externally
      </Button>
      <ColorPicker label="Locked color" value="#6b7280" onValueChange={() => {}} disabled />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <ColorPickerExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hexInput = canvas.getByLabelText("Accent color hex value");

    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "#123");
    await expect(hexInput).toHaveAttribute("aria-invalid", "true");

    await userEvent.clear(hexInput);
    await userEvent.type(hexInput, "#123456");
    await expect(hexInput).toHaveValue("#123456");


    await userEvent.click(canvas.getByRole("button", { name: "Reset externally" }));
    await expect(hexInput).toHaveValue("#0f766e");

    await expect(canvas.getByLabelText("Locked color color well")).toBeDisabled();
    await expect(canvas.getByLabelText("Locked color hex value")).toBeDisabled();
  },
};
