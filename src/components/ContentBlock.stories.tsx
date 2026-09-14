import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileCode } from "lucide-react";

import { ContentBlock } from "./ContentBlock";
import { CodeViewport } from "./CodeViewport";
import { CopyButton } from "./Interactions";

const code = Array.from({ length: 30 }, (_, index) => `Record ${index + 1}: a deliberately long line to exercise horizontal and vertical scrolling without reserving a column for the floating action.`).join("\n");
const meta = {
  title: "Components/ContentBlock",
  component: ContentBlock,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ContentBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Scrollable: Story = {
  args: { title: "Records", "aria-label": "Records", metadata: ["30 rows"] },
  render: (args) => (
    <ContentBlock {...args} className="mt-6 w-96" icon={<FileCode className="size-4" />} corner={<CopyButton text={code} label="Copy records" />}>
      <CodeViewport aria-label="Record contents">{code}</CodeViewport>
    </ContentBlock>
  ),
};

export const Segments: Story = {
  args: { title: "Request", "aria-label": "Request" },
  render: (args) => (
    <ContentBlock {...args} className="mt-6 w-96">
      <CodeViewport aria-label="Request contents">Read records</CodeViewport>
      <div className="border-t border-ui-border"><CodeViewport wrap aria-label="Response contents">{code}</CodeViewport></div>
    </ContentBlock>
  ),
};
