import type { Meta, StoryObj } from "@storybook/react-vite";
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
