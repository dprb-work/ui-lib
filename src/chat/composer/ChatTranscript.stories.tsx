import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import { ChatTranscript } from "./ChatTranscript";
import { ChatMessageContent } from "./ChatMessageContent";
import "./styles.css";

type Message = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  text: string;
  reasoning?: string;
  durationMs?: number;
  streaming?: boolean;
};

const messages: readonly Message[] = [
  { id: "1", role: "user", text: "Can you review this change?" },
  {
    id: "2",
    role: "assistant",
    text: "I found one issue in the request flow. The retry currently loses the selected model.",
    reasoning: "Checking the state transition before recommending a fix.",
    durationMs: 1200,
  },
  { id: "3", role: "tool", text: "Read src/chat/request.ts" },
];

const meta = {
  title: "Chat/Transcript",
  component: ChatTranscript<Message>,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex h-[34rem] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatTranscript<Message>>;

export default meta;
type Story = StoryObj<typeof meta>;

function renderMessage(message: Message) {
  return <ChatMessageContent {...message} />;
}

function FollowAfterSendingExample() {
  const [conversation, setConversation] = useState<readonly Message[]>(
    Array.from(
      { length: 24 },
      (_, index): Message => ({
        id: String(index + 1),
        role: index % 2 === 0 ? "user" : "assistant",
        text: `Earlier message ${index + 1}`,
      }),
    ),
  );
  const [running, setRunning] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={() => {
          setRunning(true);
          setConversation((current) => [
            ...current,
            { id: "follow-up", role: "user", text: "Please continue." },
            {
              id: "final-response",
              role: "assistant",
              text: "Working…",
              streaming: true,
            },
          ]);
        }}
      >
        Send follow-up
      </button>
      <button
        type="button"
        disabled={!running}
        onClick={() => {
          setConversation((current) =>
            current.map((message) =>
              message.id === "final-response"
                ? {
                    ...message,
                    text: "Final response is visible.\n\nThe completed response stays in view after streaming finishes.",
                    streaming: false,
                  }
                : message,
            ),
          );
          setRunning(false);
        }}
      >
        Complete response
      </button>
      <ChatTranscript
        messages={conversation}
        running={running}
        renderMessage={renderMessage}
      />
    </div>
  );
}

export const Light: Story = {
  args: { messages, running: false, renderMessage },
};

export const Dark: Story = {
  ...Light,
  globals: { theme: "dark" },
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
};

export const FollowsNewUserMessage: StoryObj<typeof FollowAfterSendingExample> =
  {
    render: () => <FollowAfterSendingExample />,
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const transcript = canvas.getByRole("log", {
        name: "Conversation messages",
      });

      transcript.scrollTop = 0;
      transcript.dispatchEvent(new Event("scroll", { bubbles: true }));
      await expect(
        await canvas.findByRole("button", { name: "Return to latest" }),
      ).toBeVisible();

      await userEvent.click(
        canvas.getByRole("button", { name: "Send follow-up" }),
      );

      await userEvent.click(
        canvas.getByRole("button", { name: "Complete response" }),
      );
      const finalResponse = canvas
        .getByText(
          "The completed response stays in view after streaming finishes.",
        )
        .getBoundingClientRect();
      const viewport = transcript.getBoundingClientRect();
      await expect(
        transcript.scrollHeight -
          transcript.scrollTop -
          transcript.clientHeight,
      ).toBeLessThan(1);
      await expect(finalResponse.bottom).toBeLessThanOrEqual(viewport.bottom);
      await expect(finalResponse.top).toBeGreaterThanOrEqual(viewport.top);
      await expect(
        canvas.queryByRole("button", { name: "Return to latest" }),
      ).not.toBeInTheDocument();
    },
  };
