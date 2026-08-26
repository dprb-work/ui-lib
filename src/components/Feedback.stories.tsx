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
    <div className="grid min-h-96 place-items-center bg-slate-50 p-8 dark:bg-slate-900">
      <StatusPanel {...args} />
    </div>
  ),
};

export const Badges: Story = {
  args: { title: "Unused" },
  render: () => (
    <div className="flex flex-wrap gap-2 rounded-lg bg-slate-50 p-6 dark:bg-slate-900">
      <Badge>Unknown</Badge>
      <Badge tone="info">Running</Badge>
      <Badge tone="success">Passed</Badge>
      <Badge tone="warning">Watch</Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  ),
};
