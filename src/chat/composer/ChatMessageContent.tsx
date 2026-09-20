import type { ReactNode } from "react";

import { CopyButton, Tooltip } from "../../components/Interactions";
import { AssistantMarkdown } from "../content/AssistantMarkdown";

export type ChatMessageContentProps = {
  role: "user" | "assistant" | "tool" | "system";
  text: string;
  reasoning?: string;
  streaming?: boolean;
  durationMs?: number;
  attachments?: ReactNode;
  tool?: ReactNode;
};

function activitySummary(role: "tool" | "system", text: string) {
  const kind = role === "tool" ? "Tool activity" : "Session event";
  const trimmed = text.trim();
  const excerpt = trimmed.replace(/\s+/g, " ").slice(0, 72);
  return excerpt
    ? `${kind}: ${excerpt}${trimmed.length > excerpt.length ? "…" : ""}`
    : kind;
}

export function ChatMessageContent({
  role,
  text,
  reasoning,
  streaming = false,
  durationMs,
  attachments,
  tool,
}: ChatMessageContentProps) {
  if (role === "user") {
    return (
      <div className="transcript__user-bubble">
        {text}
        {attachments}
      </div>
    );
  }

  if (role === "tool" && tool) {
    return (
      <>
        {tool}
        {attachments}
      </>
    );
  }

  if (role === "tool" || role === "system") {
    return (
      <details className="transcript__details">
        <summary>{activitySummary(role, text)}</summary>
        {text && <pre>{text}</pre>}
        {attachments}
      </details>
    );
  }

  return (
    <div className="transcript__assistant-body">
      {reasoning && (
        <div className="transcript__reasoning">
          <AssistantMarkdown content={reasoning} />
        </div>
      )}
      {text && <AssistantMarkdown content={text} />}
      {attachments}
      {tool}
      {text && (
        <div className="transcript__assistant-actions">
          <CopyButton
            className="size-6 [&_svg]:size-3.5"
            text={text}
            label="Copy assistant message"
          />
          {durationMs !== undefined && !streaming && (
            <Tooltip label="Response duration">
              <span aria-label="Response duration">
                {(durationMs / 1000).toFixed(1)}s
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
