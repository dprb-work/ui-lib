import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ArtifactCard } from "./ArtifactCard";
import { ChatBlock } from "./ChatBlock";
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

export const FragmentTitleLink: Story = {
  render: () => <ChatBlock title="Details" href="#details"><p id="details">Linked details</p></ChatBlock>,
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "Details" });
    await expect(link).toHaveAttribute("href", "#details");
    await expect(link).not.toHaveAttribute("target");
  },
};

const downloadArtifact = fn();

export const DownloadOnlyArtifacts: Story = {
  render: () => <>
    <ArtifactCard name="Download link" downloadHref={`${window.location.origin}/report.csv`} />
    <ArtifactCard name="External artifact" downloadHref="https://example.com/report.csv" />
    <ArtifactCard name="Download callback" onDownload={downloadArtifact} />
  </>,
  play: async ({ canvasElement }) => {
    downloadArtifact.mockClear();
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Download" })).toHaveAttribute("download");
    const external = canvas.getByRole("link", { name: "Open artifact" });
    await expect(external).toHaveAttribute("href", "https://example.com/report.csv");
    await expect(external).toHaveAttribute("target", "_blank");
    await expect(external).toHaveAttribute("rel", "noopener noreferrer");
    await expect(external).not.toHaveAttribute("download");
    await userEvent.click(canvas.getByRole("button", { name: "Download" }));
    await expect(downloadArtifact).toHaveBeenCalledOnce();
    await expect(canvas.queryByText("Artifact is unavailable.")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Open" })).not.toBeInTheDocument();
  },
};
