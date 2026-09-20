import { common, createLowlight } from "lowlight";
import type { RootContent } from "hast";
import { useMemo } from "react";

const lowlight = createLowlight(common);
const tokenClasses: Record<string, string> = {
  "hljs-keyword": "text-ui-accent",
  "hljs-string": "text-emerald-800 dark:text-emerald-300",
  "hljs-number": "text-amber-700 dark:text-amber-300",
  "hljs-comment": "text-ui-muted-foreground italic",
  "hljs-title": "text-sky-700 dark:text-sky-300",
  "hljs-literal": "text-ui-danger",
};
type Token = { text: string; className: string };
function highlightedLines(code: string, language?: string): Token[][] {
  if (language === "tsx") language = "typescript";
  let nodes: RootContent[] = [{ type: "text", value: code }];
  if (language && lowlight.registered(language))
    nodes = lowlight.highlight(language, code).children;
  const lines: Token[][] = [[]];
  function collect(node: RootContent, inherited: string) {
    if (node.type === "text")
      node.value.split("\n").forEach((text, index) => {
        if (index > 0) lines.push([]);
        lines.at(-1)?.push({ text, className: inherited });
      });
    else if (node.type === "element") {
      const classes = Array.isArray(node.properties.className)
        ? node.properties.className
            .map((name) => tokenClasses[String(name)] ?? "")
            .join(" ")
        : "";
      for (const child of node.children)
        collect(child, `${inherited} ${classes}`.trim());
    }
  }
  for (const node of nodes) collect(node, "");
  return lines;
}
export type CodeTextProps = {
  code: string;
  language?: string;
  lineNumbers?: boolean;
  startLine?: number;
  streaming?: boolean;
};
export function CodeText({
  code,
  language,
  lineNumbers = false,
  startLine = 1,
  streaming = false,
}: CodeTextProps) {
  const lines = useMemo(
    () => highlightedLines(code, language),
    [code, language],
  );
  const rowStyle = lineNumbers
    ? {
        gridTemplateColumns: `${Math.max(3, String(startLine).length, String(startLine + lines.length - 1).length)}ch minmax(0,1fr)`,
      }
    : undefined;
  return (
    <code className="grid">
      {lines.map((tokens, index) => (
        <span
          className="grid min-w-0 grid-cols-1 gap-2"
          style={rowStyle}
          key={index}
        >
          {lineNumbers && (
            <span
              aria-hidden="true"
              className="select-none text-right text-ui-muted-foreground"
            >
              {startLine + index}
            </span>
          )}
          <span className="min-w-0">
            {tokens.map((token, tokenIndex) => (
              <span className={token.className} key={tokenIndex}>
                {token.text}
              </span>
            ))}
            {streaming && index === lines.length - 1 && (
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-3 w-1 bg-ui-accent"
              />
            )}
            {index < lines.length - 1 ? "\n" : ""}
          </span>
        </span>
      ))}
    </code>
  );
}
