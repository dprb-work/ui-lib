import type { Meta, StoryObj } from "@storybook/react-vite";

import { CopyableText } from "./CopyableText";

const meta = {
  title: "Components/CopyableText",
  component: CopyableText,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CopyableText>;

export default meta;
type Story = StoryObj<typeof meta>;

const text = "/home/jason/workspace/coex/src/features/projects/ProjectDetailsWithAnIntentionallyLongName.tsx";
const copyLabel = "Copy the full local workspace path for the selected project";

export const LongTextAndLabel: Story = {
  args: { text, copyLabel },
  render: (args) => (
    <div className="w-96 rounded-md border border-ui-border bg-ui-background p-3">
      <CopyableText
        {...args}
        label={<p className="text-sm font-medium">Local source with a deliberately long label</p>}
      />
    </div>
  ),
};
