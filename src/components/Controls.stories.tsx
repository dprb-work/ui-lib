import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { Checkbox, Switch } from "./BinaryControls";
import { IconButton } from "./IconButton";
import { NumberInput, SelectInput, TextInput } from "./Inputs";

const meta = {
  title: "Components/Controls",
  component: Button,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  args: { children: "Save changes", onClick: fn() },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-6 dark:bg-slate-900">
      <Button {...args} />
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Details</Button>
      <Button variant="danger">Delete</Button>
      <IconButton label="Delete item" variant="ghost">
        <Trash2 aria-hidden="true" />
      </IconButton>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("button", { name: "Delete item" })).toHaveAttribute(
      "title",
      "Delete item",
    );
  },
};

export const Inputs: Story = {
  args: { children: "Unused" },
  render: () => (
    <div className="grid w-80 gap-4 rounded-lg bg-slate-50 p-6 dark:bg-slate-900">
      <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
        Name
        <TextInput defaultValue="Review stream" />
      </label>
      <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
        Limit
        <NumberInput defaultValue={25} min={1} />
      </label>
      <SelectInput
        label="Review depth"
        defaultValue="focused"
        options={[
          { label: "Focused", value: "focused" },
          { label: "Complete", value: "complete" },
        ]}
      />
      <div className="flex items-center gap-4">
        <Checkbox label="Include generated files" defaultChecked />
        <Switch label="Show unchanged context" defaultChecked />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Include generated files" });
    await expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
  },
};
