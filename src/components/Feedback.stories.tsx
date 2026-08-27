import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { StatusPanel } from "./StatusPanel";

const meta = {
  title: "Components/Feedback",
  component: StatusPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof StatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Statuses: Story = {
  args: {
    eyebrow: "Analysis",
    title: "No changed responsibilities",
    description: "The snapshot is valid but contains no reviewable hunks.",
    actions: <Button variant="secondary">Choose another snapshot</Button>,
  },
  render: (args) => (
    <div className="grid min-h-96 place-items-center bg-ui-background p-8">
      <StatusPanel {...args} />
    </div>
  ),
};

export const ErrorStatus: Story = {
  args: {
    eyebrow: "Analysis failed",
    title: "The base revision is unavailable",
    description: "Fetch the revision or choose another comparison before retrying.",
    tone: "danger",
    actions: (
      <>
        <Button variant="danger">Retry analysis</Button>
        <Button variant="secondary">Change revision</Button>
      </>
    ),
  },
  render: (args) => (
    <div className="grid min-h-96 place-items-center bg-ui-background p-8">
      <StatusPanel {...args} />
    </div>
  ),
};

export const Badges: Story = {
  args: { title: "Unused" },
  render: () => (
    <div className="grid gap-4 rounded-xl border border-ui-border bg-ui-surface p-6 text-ui-surface-foreground shadow-sm">
      <p className="m-0 text-sm font-semibold">Status tones</p>
      <div className="flex flex-wrap gap-2">
        <Badge>Unknown</Badge>
        <Badge tone="info">Running</Badge>
        <Badge tone="success">Passed</Badge>
        <Badge tone="warning">Watch</Badge>
        <Badge tone="danger">Failed</Badge>
      </div>
    </div>
  ),
};
