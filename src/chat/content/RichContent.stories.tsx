import type { Meta, StoryObj } from "@storybook/react-vite";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { ChartOutput } from "./ChartOutput";
import { ChatPresentationProvider } from "./ChatPresentation";
import { FileDeletion } from "./FileDeletion";

const meta = {
  title: "Chat/Rich content",
  decorators: [
    (Story) => (
      <ChatPresentationProvider wrapText>
        <div className="max-w-3xl p-6">
          <Story />
        </div>
      </ChatPresentationProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Markdown: Story = {
  render: () => (
    <AssistantMarkdown
      content={
        "## Review\n\nSafe **Markdown** with $p = 0.95$.\n\n```ts session.ts\nconst connected = true;\n```\n\n[Unsafe](javascript:alert)"
      }
    />
  ),
};

export const Chart: Story = {
  render: () => (
    <ChartOutput
      title="Latency by service"
      unit="ms"
      points={[
        { label: "API", value: 42 },
        { label: "Worker", value: 18 },
        { label: "Search", value: 67 },
      ]}
    />
  ),
};

export const Deletion: Story = {
  render: () => (
    <FileDeletion
      rawInput={'{"file_path":"src/reports/obsolete.ts"}'}
      deletion={{
        path: "src/reports/obsolete.ts",
        removedContent: "export const obsolete = true;",
        state: "confirmed",
      }}
    />
  ),
};
