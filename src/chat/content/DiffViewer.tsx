import { useMemo, useState } from "react";
import { CopyButton } from "../../components/Interactions";
import { IconButton } from "../../components/IconButton";
import { Columns2, Rows2 } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
import { useChatPresentation } from "./ChatPresentation";
import { languageForPath } from "./CodeLanguageIcon";
export type DiffViewerProps = {
  patch: string;
  path?: string;
  href?: string;
  onNavigate?: (target: { path: string }) => void;
};
type DiffLine = {
  kind: "add" | "remove" | "context" | "hunk" | "meta";
  text: string;
  oldLine?: number;
  newLine?: number;
};
function parsePatch(patch: string): DiffLine[] {
  const sourceLines = patch.split(/\r?\n/);
  if (sourceLines.at(-1) === "") sourceLines.pop();
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;
  return sourceLines.map((text) => {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      inHunk = true;
      return { kind: "hunk", text: text.slice(hunk[0].length).trim() };
    }
    if (text.startsWith("diff --git ")) {
      inHunk = false;
      return { kind: "meta", text };
    }
    if (!inHunk && (text.startsWith("--- ") || text.startsWith("+++ ")))
      return { kind: "meta", text };
    if (!inHunk) return { kind: "meta", text };
    if (text.startsWith("+"))
      return { kind: "add", text: text.slice(1), newLine: newLine++ };
    if (text.startsWith("-"))
      return { kind: "remove", text: text.slice(1), oldLine: oldLine++ };
    if (text.startsWith(" "))
      return {
        kind: "context",
        text: text.slice(1),
        oldLine: oldLine++,
        newLine: newLine++,
      };
    return { kind: "meta", text };
  });
}
type SplitRow = {
  index: number;
  left?: DiffLine;
  right?: DiffLine;
  heading?: DiffLine;
};
function splitPatchLines(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    if (line.kind === "context") {
      rows.push({ index, left: line, right: line });
      index++;
    } else if (line.kind === "add" || line.kind === "remove") {
      const start = index;
      const removed: DiffLine[] = [];
      const added: DiffLine[] = [];
      while (index < lines.length) {
        const change = lines[index]!;
        if (change.kind === "remove") removed.push(change);
        else if (change.kind === "add") added.push(change);
        else break;
        index++;
      }
      for (
        let offset = 0;
        offset < Math.max(removed.length, added.length);
        offset++
      )
        rows.push({
          index: start + offset,
          ...(removed[offset] ? { left: removed[offset] } : {}),
          ...(added[offset] ? { right: added[offset] } : {}),
        });
    } else {
      rows.push({ index, heading: line });
      index++;
    }
  }
  return rows;
}
function deletionPath(patch: string): string | undefined {
  const target = /^\+\+\+ \/dev\/null(?:\t.*)?$/m.test(patch);
  const source = /^--- (?:a\/)?(.+?)(?:\t.*)?$/m.exec(patch)?.[1];
  return target && source && source !== "/dev/null" ? source : undefined;
}
export function DiffViewer({ patch, path, href, onNavigate }: DiffViewerProps) {
  const [split, setSplit] = useState(false);
  const { wrapText } = useChatPresentation();
  const lines = useMemo(() => parsePatch(patch), [patch]);
  const additions = lines.filter((line) => line.kind === "add").length;
  const removals = lines.filter((line) => line.kind === "remove").length;
  const deletedPath = deletionPath(patch);
  const filename = path ?? deletedPath ?? /^\+\+\+ b\/(.+)$/m.exec(patch)?.[1];
  const title = deletedPath
    ? `Deletion in patch: ${deletedPath}`
    : (filename ?? "Patch");
  const codeClass = wrapText
    ? "whitespace-pre-wrap break-words"
    : "whitespace-pre";
  return (
    <ChatBlock
      title={title}
      language={languageForPath(filename ?? "") ?? "code"}
      href={href}
      onTitleClick={
        filename && onNavigate
          ? () => onNavigate({ path: filename })
          : undefined
      }
      metadata={[
        <span
          key="stats"
          aria-label={`${additions} additions and ${removals} removals`}
          className="font-mono text-xs"
        >
          <span className="text-emerald-800 dark:text-emerald-300">
            +{additions}
          </span>{" "}
          <span className="text-ui-danger">-{removals}</span>
        </span>,
      ]}
      corner={
        <div className="flex items-center gap-1">
          <CopyButton text={patch} label="Copy patch" />
          <IconButton
            label={split ? "Show unified diff" : "Show side-by-side diff"}
            aria-pressed={split}
            onClick={() => setSplit((value) => !value)}
          >
            {split ? (
              <Rows2 aria-hidden="true" />
            ) : (
              <Columns2 aria-hidden="true" />
            )}
          </IconButton>
        </div>
      }
    >
      <div className="pt-2">
        <div
          tabIndex={0}
          aria-label="Patch content"
          className="max-h-128 overflow-auto font-mono text-xs leading-5"
        >
          {split ? (
            <div className="min-w-[40rem]" aria-label="Side-by-side diff">
              {splitPatchLines(lines).map((row) => {
                if (row.heading?.kind === "meta") return null;
                if (row.heading)
                  return (
                    <div
                      key={row.index}
                      className={`${codeClass} px-3 text-ui-muted-foreground`}
                    >
                      {row.heading.text}
                    </div>
                  );
                const cell = (
                  line: DiffLine | undefined,
                  side: "old" | "new",
                ) => (
                  <div
                    className={`grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] ${side === "old" ? "border-r border-ui-border" : ""} ${line?.kind === "remove" ? "bg-ui-danger/10" : line?.kind === "add" ? "bg-emerald-500/10" : ""}`}
                  >
                    <span className="select-none border-r border-ui-border/60 px-2 text-right text-ui-muted-foreground">
                      {side === "old" ? line?.oldLine : line?.newLine}
                    </span>
                    <code className={`${codeClass} px-3`}>
                      {line
                        ? `${line.kind === "remove" ? "-" : line.kind === "add" ? "+" : " "}${line.text}`
                        : " "}
                    </code>
                  </div>
                );
                return (
                  <div key={row.index} className="grid grid-cols-2">
                    {cell(row.left, "old")}
                    {cell(row.right, "new")}
                  </div>
                );
              })}
            </div>
          ) : (
            lines.map((line, index) =>
              line.kind === "meta" ? null : line.kind === "hunk" ? (
                <div
                  key={index}
                  className={`${codeClass} px-3 text-ui-muted-foreground`}
                >
                  {line.text}
                </div>
              ) : (
                <div
                  className={`grid grid-cols-[3rem_3rem_minmax(0,1fr)] ${line.kind === "add" ? "bg-emerald-500/10" : line.kind === "remove" ? "bg-ui-danger/10" : ""}`}
                  key={`${index}-${line.text}`}
                >
                  <span className="select-none border-r border-ui-border/60 px-2 text-right text-ui-muted-foreground">
                    {line.oldLine ?? ""}
                  </span>
                  <span className="select-none border-r border-ui-border/60 px-2 text-right text-ui-muted-foreground">
                    {line.newLine ?? ""}
                  </span>
                  <code className={`${codeClass} px-3`}>
                    {line.kind === "add"
                      ? "+"
                      : line.kind === "remove"
                        ? "-"
                        : " "}
                    {line.text}
                  </code>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </ChatBlock>
  );
}
