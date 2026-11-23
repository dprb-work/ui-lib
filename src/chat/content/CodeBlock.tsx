import { CodeViewport } from "../../components/CodeViewport";
import { useChatPresentation } from "./ChatPresentation";
import { CodeText } from "./CodeText";
import { ChatBlock } from "./ChatBlock";

export type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  lineNumbers?: boolean;
  startLine?: number;
  className?: string;
};
export function CodeBlock({
  code,
  language,
  filename,
  lineNumbers = false,
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
        className={lineNumbers ? "pl-1.5" : undefined}
      >
        <CodeText
          code={code}
          {...(language ? { language } : {})}
          lineNumbers={lineNumbers}
          startLine={startLine}
        />
      </CodeViewport>
    </ChatBlock>
  );
}
