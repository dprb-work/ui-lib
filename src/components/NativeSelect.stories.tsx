import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";

import { NativeSelect } from "./NativeSelect";

const meta = {
  title: "Components/NativeSelect",
  component: NativeSelect,
  parameters: { layout: "centered" },
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function StandardExample() {
  const [value, setValue] = useState("focused");

  return (
    <label className="grid w-96 gap-1 text-sm">
      Review depth
      <NativeSelect name="review-depth" value={value} onChange={(event) => setValue(event.target.value)}>
        <option value="focused">Focused</option>
        <option value="complete">Complete</option>
        <option value="exhaustive" disabled>Exhaustive, unavailable</option>
      </NativeSelect>
    </label>
  );
}

function CompactExample() {
  const [value, setValue] = useState("astra");

  return (
    <label className="grid w-24 gap-1 text-xs text-ui-muted-foreground">
      Model
      <NativeSelect density="compact" value={value} onChange={(event) => setValue(event.target.value)}>
        <option value="luna">Luna</option>
        <option value="astra">Astra</option>
        <option value="sol" disabled>Sol, unavailable</option>
      </NativeSelect>
    </label>
  );
}

export const Standard: Story = {
  render: () => <StandardExample />,
};

export const Compact: Story = {
  render: () => <CompactExample />,
};

export const States: Story = {
  render: () => (
    <div className="grid w-72 max-w-full gap-5 text-sm text-ui-foreground">
      <label className="grid gap-1">
        Focused review depth
        <NativeSelect defaultValue="focused">
          <option value="focused">Focused</option>
          <option value="complete">Complete</option>
        </NativeSelect>
      </label>
      <label className="grid gap-1">
        Review depth with an error
        <NativeSelect aria-invalid="true" aria-describedby="review-depth-error" defaultValue="focused">
          <option value="focused">Focused</option>
          <option value="complete">Complete</option>
        </NativeSelect>
        <span id="review-depth-error" className="text-xs text-ui-danger">Choose a review depth.</span>
      </label>
      <label className="grid gap-1 text-ui-muted-foreground">
        Disabled review depth
        <NativeSelect disabled defaultValue="focused">
          <option value="focused">Focused</option>
          <option value="complete">Complete</option>
        </NativeSelect>
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: "Focused review depth" });

    await userEvent.click(select);
    await expect(select).toHaveFocus();
  },
};

export const StatesDark: Story = {
  ...States,
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "dark" } },
};

export const Narrow: Story = {
  render: () => (
    <label className="grid w-48 max-w-full gap-1 text-sm">
      Project
      <NativeSelect defaultValue="all">
        <option value="all">All projects</option>
        <option value="unavailable">Unavailable project</option>
      </NativeSelect>
    </label>
  ),
};
