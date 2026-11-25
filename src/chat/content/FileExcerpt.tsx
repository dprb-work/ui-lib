import { FileCode2 } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
import { useChatPresentation } from "./ChatPresentation";
import { CodeText } from "./CodeText";
export type FileExcerptProps = {
  path: string;
  excerpt: string;
  startLine?: number;
  endLine?: number;
  revision?: string;
  href?: string;
  onNavigate?: (target: {
    path: string;
    line?: number;
    revision?: string;
  }) => void;
};
export function FileExcerpt({
  path,
  excerpt,
  startLine,
  endLine,
  revision,
  href,
  onNavigate,
}: FileExcerptProps) {
  const { wrapText } = useChatPresentation();
  const label = startLine
    ? `${path}:${startLine}${endLine && endLine !== startLine ? `-${endLine}` : ""}`
    : path;
  return (
    <ChatBlock
      title={label}
      icon={<FileCode2 aria-hidden="true" size={16} />}
      href={href}
      onTitleClick={
        onNavigate
          ? () =>
              onNavigate({
                path,
                ...(startLine === undefined ? {} : { line: startLine }),
                ...(revision === undefined ? {} : { revision }),
              })
          : undefined
      }
      actions={[{ kind: "copy", text: excerpt, label: "Copy file excerpt" }]}
      expansion="scroll"
    >
      <pre className={`max-h-96 overflow-auto font-mono text-xs leading-5 in-data-[content-block-viewport=expanded]:max-h-none ${wrapText ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre"}`}>
        <CodeText code={excerpt} startLine={startLine ?? 1} />
      </pre>
    </ChatBlock>
  );
}
