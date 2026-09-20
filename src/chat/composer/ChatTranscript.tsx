import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowDown } from "lucide-react";

import { cn } from "../../cn";
import { IconButton } from "../../components/IconButton";
import { useChatPresentation } from "../content/ChatPresentation";

export type ChatTranscriptProps<T extends { id: string; role: string }> = {
  messages: readonly T[];
  queuedMessages?: readonly T[];
  running: boolean;
  history?: ReactNode;
  renderMessage: (message: T) => ReactNode;
  renderQueuedMessage?: (message: T) => ReactNode;
  initialPosition?: "start" | "latest";
  followKey?: string | number;
  className?: string;
};

const followThreshold = 48;

function isPrepend<T extends { id: string }>(
  messages: readonly T[],
  previousMessages: readonly T[],
) {
  if (
    previousMessages.length === 0 ||
    messages.length <= previousMessages.length
  )
    return false;
  return previousMessages.every(
    (message, index) =>
      messages[messages.length - previousMessages.length + index]?.id ===
      message.id,
  );
}

function isAtBottom(element: HTMLDivElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <
    followThreshold
  );
}

export function ChatTranscript<T extends { id: string; role: string }>({
  messages,
  queuedMessages = [],
  running,
  history,
  renderMessage,
  renderQueuedMessage,
  initialPosition = "latest",
  followKey,
  className,
}: ChatTranscriptProps<T>) {
  const { density } = useChatPresentation();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const follow = useRef(initialPosition === "latest");
  const previous = useRef<{
    messages: readonly T[];
    scrollHeight: number;
    followKey: string | number | undefined;
  }>({
    messages: [],
    scrollHeight: 0,
    followKey,
  });
  const [following, setFollowing] = useState(initialPosition === "latest");

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const previousMessages = previous.current.messages;
    if (followKey !== previous.current.followKey) {
      follow.current = true;
      setFollowing(true);
      element.scrollTop = element.scrollHeight;
    } else if (isPrepend(messages, previousMessages)) {
      element.scrollTop += element.scrollHeight - previous.current.scrollHeight;
    } else if (follow.current) {
      element.scrollTop = element.scrollHeight;
    }

    previous.current = {
      messages,
      scrollHeight: element.scrollHeight,
      followKey,
    };
  }, [messages, running, followKey]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      if (follow.current) element.scrollTop = element.scrollHeight;
      previous.current.scrollHeight = element.scrollHeight;
    });
    observer.observe(element);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  function updateFollowing(element: HTMLDivElement) {
    const next = isAtBottom(element);
    follow.current = next;
    setFollowing(next);
  }

  return (
    <section
      className={cn(
        "transcript",
        density === "compact" && "transcript--compact",
        className,
      )}
      aria-label="Conversation transcript"
    >
      <div className="transcript__body">
        <div
          ref={viewport}
          role="log"
          aria-live="polite"
          aria-busy={running}
          aria-label="Conversation messages"
          tabIndex={0}
          className="transcript__viewport"
          onScroll={(event) => updateFollowing(event.currentTarget)}
        >
          <div ref={content} className="transcript__content">
            {history && <div className="transcript__history">{history}</div>}
            {messages.length === 0 && (
              <p className="transcript__empty">No messages yet.</p>
            )}
            {running && (
              <p role="status" className="sr-only">
                Assistant is working…
              </p>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                aria-label={`${message.role} message`}
                className={`transcript__message transcript__message--${message.role}`}
              >
                {renderMessage(message)}
              </article>
            ))}
          </div>
        </div>
        {queuedMessages.length > 0 && (
          <div className="transcript__queued" aria-label="Queued messages">
            {queuedMessages.map((message) => (
              <article
                key={message.id}
                aria-label="Queued user message"
                className="transcript__message transcript__message--user transcript__message--queued"
              >
                {renderQueuedMessage
                  ? renderQueuedMessage(message)
                  : renderMessage(message)}
              </article>
            ))}
          </div>
        )}
      </div>
      {!following && (
        <div className="transcript__return-anchor">
          <IconButton
            label="Return to latest"
            variant="secondary"
            className="transcript__return"
            onClick={() => {
              const element = viewport.current;
              if (!element) return;
              element.scrollTop = element.scrollHeight;
              updateFollowing(element);
              element.focus();
            }}
          >
            <ArrowDown aria-hidden="true" />
          </IconButton>
        </div>
      )}
    </section>
  );
}
