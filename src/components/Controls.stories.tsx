import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Clipboard,
  Columns2,
  List,
  Monitor,
  Moon,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "./Button";
import { Checkbox, Switch } from "./BinaryControls";
import { IconButton } from "./IconButton";
import { NumberInput, SelectInput, TextInput } from "./Inputs";
import { CopyButton } from "./Interactions";
import {
  SegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlProps,
} from "./SegmentedControl";

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
  const Icon =
    option.value === "system" ? Monitor : option.value === "light" ? Sun : Moon;
  return (
    <>
      <Icon aria-hidden="true" />
      <span>{option.label}</span>
    </>
  );
}

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
        <label className="grid gap-1 text-sm">
          Invalid example
          <TextInput
            defaultValue="Unknown base revision"
            error="Select an existing base revision."
          />
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

export const SegmentedControls: Story = {
  args: { children: "Unused" },
  render: () => (
    <Frame>
      <div className="grid gap-4">
        <ControlledSegmentedControl
          ariaLabel="View"
          options={layoutOptions}
          value="unified"
          onValueChange={() => undefined}
        >
          {renderLayoutOption}
        </ControlledSegmentedControl>
        <ControlledSegmentedControl
          ariaLabel="Theme"
          options={themeOptions}
          value="system"
          onValueChange={() => undefined}
        >
          {renderThemeOption}
        </ControlledSegmentedControl>
      </div>
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Split" }));
    await expect(canvas.getByRole("button", { name: "Split" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Dark" }));
    await expect(canvas.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
