import { CodeViewport } from "../../components/CodeViewport";
import { useChatPresentation } from "./ChatPresentation";
import { CodeText } from "./CodeText";
import { ChatBlock } from "./ChatBlock";

export type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  startLine?: number;
  className?: string;
};
export function CodeBlock({
  code,
  language,
  filename,
  startLine = 1,
  className,
}: CodeBlockProps) {
  const { wrapText } = useChatPresentation();
  return (
    <ChatBlock
      title={filename ?? "Code"}
      language={language}
      actions={[{ kind: "copy", text: code, label: "Copy code" }]}
      expansion="scroll"
      className={className}
    >
      <CodeViewport
        wrap={wrapText}
        aria-label="Source code"
      >
        <CodeText
          code={code}
          {...(language ? { language } : {})}
          startLine={startLine}
        />
      </CodeViewport>
    </ChatBlock>
  );
}
