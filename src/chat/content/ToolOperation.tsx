import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { CodeViewport } from "../../components/CodeViewport";
import { ActivityStatus, type OperationState } from "./ActivityStatus";
import { ChatBlock } from "./ChatBlock";
import type { CodeLanguage } from "./CodeLanguageIcon";
import { CodeText } from "./CodeText";
import { useChatPresentation } from "./ChatPresentation";

export type OperationData = {
  name: string;
  input: string;
  output?: string;
  state: OperationState;
  language?: CodeLanguage;
  path?: string;
};

export type ToolOperationProps = {
  operation: OperationData;
  streamingInput?: boolean;
  inputContent?: ReactNode;
  output?: ReactNode;
};

function ToolOperationText({
  text,
  label,
  active,
  children,
}: {
  text: string;
  label: string;
  active: boolean;
  children?: ReactNode;
}) {
  const { wrapText } = useChatPresentation();
  const viewport = useRef<HTMLPreElement>(null);
  const [following, setFollowing] = useState(true);

  useLayoutEffect(() => {
    if (active && following && viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "instant",
      });
    }
  }, [text, active, following]);

  return (
    <CodeViewport
      wrap={wrapText}
      ref={viewport}
      aria-label={label}
      aria-live={active && following ? "polite" : "off"}
      onScroll={(event) => {
        const element = event.currentTarget;
        setFollowing(
          element.scrollHeight - element.clientHeight - element.scrollTop < 1,
        );
      }}
    >
      {children ?? (text || " ")}
    </CodeViewport>
  );
}

export function ToolOperation({
  operation,
  streamingInput = false,
  inputContent,
  output,
}: ToolOperationProps) {
  const active = operation.state === "running";

  return (
    <ChatBlock
      title={operation.name}
      aria-label={
        operation.path
          ? `${operation.name} · ${operation.path}`
          : operation.name
      }
      metadata={operation.path ? [operation.path] : undefined}
      language={operation.language}
      busy={active}
      corner={
        operation.state !== "completed" && (
          <ActivityStatus state={operation.state} />
        )
      }
    >
      {inputContent === undefined ? (
        <ToolOperationText text={operation.input} label="Input" active={active}>
          {operation.language ? (
            <CodeText
              code={operation.input}
              language={operation.language}
              streaming={streamingInput}
            />
          ) : (
            <>
              {operation.input || " "}
              {streamingInput && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-3 w-1 bg-ui-accent"
                />
              )}
            </>
          )}
        </ToolOperationText>
      ) : (
        <div aria-label="Input">{inputContent}</div>
      )}
      {(output !== undefined || operation.output !== undefined) && (
        <div className="border-t border-ui-border">
          {output ?? (
            <ToolOperationText
              text={operation.output ?? ""}
              label="Output"
              active={active}
            />
          )}
        </div>
      )}
    </ChatBlock>
  );
}
