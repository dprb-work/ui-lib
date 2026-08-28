import type { Meta, StoryObj } from "@storybook/react-vite";
import { Columns2, List, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  SegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlProps,
} from "./SegmentedControl";

const layoutOptions = [
  { value: "unified", label: "Unified" },
  { value: "split", label: "Split" },
] as const;

const themeOptions = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

function renderLayoutOption(option: SegmentedControlOption) {
  const Icon = option.value === "unified" ? List : Columns2;
  return (
    <>
      <Icon aria-hidden="true" />
      <span>{option.label}</span>
    </>
  );
}

function renderThemeOption(option: SegmentedControlOption) {
  const Icon = option.value === "system" ? Monitor : option.value === "light" ? Sun : Moon;
  return (
    <>
      <Icon aria-hidden="true" />
      <span>{option.label}</span>
    </>
  );
}
const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  parameters: { layout: "centered" },
  args: {
    ariaLabel: "View",
    options: layoutOptions,
    value: "unified",
    onValueChange: fn(),
    children: renderLayoutOption,
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledSegmentedControl({
  value: initialValue,
  onValueChange,
  ...props
}: SegmentedControlProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <SegmentedControl
      {...props}
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange(nextValue);
      }}
    />
  );
}

export const TwoWay: Story = {
  render: (args) => <ControlledSegmentedControl {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Split" }));
    await expect(canvas.getByRole("button", { name: "Split" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(args.onValueChange).toHaveBeenCalledWith("split");
  },
};

export const ThreeWay: Story = {
  args: {
    ariaLabel: "Theme",
    options: themeOptions,
    value: "system",
    children: renderThemeOption,
  },
  render: (args) => <ControlledSegmentedControl {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Dark" }));
    await expect(canvas.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(args.onValueChange).toHaveBeenCalledWith("dark");
  },
};

