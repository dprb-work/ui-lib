import { CopyButton } from "../../components/Interactions";
import { FileCode2 } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
import { useChatPresentation } from "./ChatPresentation";
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
      corner={<CopyButton text={excerpt} label="Copy file excerpt" />}
    >
      <div className="pt-2">
        <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-5">
          <code>
            {excerpt.split("\n").map((line, index) => (
              <span
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
                key={index}
              >
                {startLine && (
                  <span className="select-none text-right text-ui-muted-foreground">
                    {startLine + index}
                  </span>
                )}
                <span
                  className={`min-w-0 ${wrapText ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}
                >
                  {line}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </ChatBlock>
  );
}
