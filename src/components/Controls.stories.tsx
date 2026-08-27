import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clipboard, Search, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { Checkbox, Switch } from "./BinaryControls";
import { IconButton } from "./IconButton";
import { NumberInput, SelectInput, TextInput } from "./Inputs";
import { CopyButton } from "./Interactions";

const meta = {
  title: "Components/Controls",
  component: Button,
  parameters: { layout: "centered" },
  args: { children: "Save changes", onClick: fn() },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["small", "default", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

function Frame({ children, width = "w-auto" }: { children: ReactNode; width?: string }) {
  return (
    <div
      className={`rounded-xl border border-ui-border bg-ui-surface p-6 text-ui-surface-foreground shadow-sm ${width}`}
    >
      {children}
    </div>
  );
}

export const Buttons: Story = {
  render: (args) => (
    <Frame>
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button {...args} />
          <Button variant="secondary">Cancel</Button>
          <Button variant="ghost">Details</Button>
          <Button variant="danger">Delete</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="small">Small</Button>
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const primary = canvas.getByRole("button", { name: "Save changes" });
    await userEvent.click(primary);
    await expect(args.onClick).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("button", { name: "Disabled" })).toBeDisabled();
  },
};

export const IconButtons: Story = {
  args: { children: "Unused" },
  render: () => (
    <Frame>
      <div className="flex items-center gap-4">
        <IconButton label="Search" size="small">
          <Search aria-hidden="true" />
        </IconButton>
        <IconButton label="Copy reference" variant="secondary">
          <Clipboard aria-hidden="true" />
        </IconButton>
        <IconButton label="Delete item" size="large" variant="danger">
          <Trash2 aria-hidden="true" />
        </IconButton>
      </div>
    </Frame>
  ),
};

export const Inputs: Story = {
  args: { children: "Unused" },
  render: () => (
    <Frame width="w-96">
      <div className="grid gap-5">
        <label className="grid gap-1 text-sm">
          Review name
          <TextInput defaultValue="Responsibility review" />
        </label>
        <label className="grid gap-1 text-sm">
          Context lines
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
        <label className="grid gap-1 text-sm text-ui-danger">
          Invalid example
          <TextInput aria-invalid defaultValue="Unknown base revision" />
        </label>
        <label className="grid gap-1 text-sm text-ui-muted-foreground">
          Disabled example
          <TextInput disabled defaultValue="Managed by repository" />
        </label>
      </div>
    </Frame>
  ),
};

export const BinaryControls: Story = {
  args: { children: "Unused" },
  render: () => (
    <Frame width="w-96">
      <div className="grid gap-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          Include generated files
          <Checkbox label="Include generated files" defaultChecked />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          Show unchanged context
          <Switch label="Show unchanged context" defaultChecked />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm text-ui-muted-foreground">
          Protected setting
          <Switch label="Protected setting" disabled />
        </label>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox", { name: "Include generated files" });
    await expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
  },
};

export const CopyToClipboard: Story = {
  args: { children: "Unused" },
  render: () => (
    <Frame>
      <div className="flex items-center gap-3">
        <code className="rounded bg-ui-muted px-3 py-2 text-sm">src/review/summary.ts</code>
        <CopyButton text="src/review/summary.ts" label="Copy path" />
      </div>
    </Frame>
  ),
};
