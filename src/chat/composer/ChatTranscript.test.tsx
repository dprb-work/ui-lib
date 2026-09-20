import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ChatTranscript } from "./ChatTranscript";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

describe("ChatTranscript", () => {
  test("renders only the message whose immutable object changes while streaming", () => {
    const historical = {
      id: "user-1",
      role: "user",
      text: "Earlier message",
    } as const;
    const streaming = {
      id: "assistant-1",
      role: "assistant",
      text: "First chunk",
    } as const;
    const renderMessage = vi.fn((message: Message) => <p>{message.text}</p>);
    const { rerender } = render(
      <ChatTranscript
        messages={[historical, streaming]}
        running
        renderMessage={renderMessage}
      />,
    );

    renderMessage.mockClear();
    const updatedStreaming: Message = {
      ...streaming,
      text: "Second chunk",
    };
    rerender(
      <ChatTranscript
        messages={[historical, updatedStreaming]}
        running
        renderMessage={renderMessage}
      />,
    );

    expect(renderMessage).toHaveBeenCalledWith(updatedStreaming);
    expect(renderMessage).not.toHaveBeenCalledWith(historical);
    expect(screen.getByText("Second chunk")).toBeVisible();
  });
});
