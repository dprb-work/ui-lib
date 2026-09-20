import { MessagesSquare } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
export type IrcMessage = { id: string; from: string; to: string; text: string };
export type IrcMessagesProps = { messages: IrcMessage[] };
export function IrcMessages({ messages }: IrcMessagesProps) {
  return (
    <ChatBlock
      title="IRC"
      icon={<MessagesSquare aria-hidden="true" size={16} />}
    >
      <div
        role="log"
        aria-label="Messages between agents"
        aria-relevant="additions text"
        className="space-y-3 pt-5 px-3 pb-3"
      >
        {messages.map((message) => (
          <div key={message.id}>
            <p className="text-xs text-ui-muted-foreground">
              {message.from} <span aria-hidden="true">→</span>
              <span className="sr-only"> to </span> {message.to}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              {message.text}
            </p>
          </div>
        ))}
      </div>
    </ChatBlock>
  );
}
