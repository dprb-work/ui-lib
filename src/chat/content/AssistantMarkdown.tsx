import { Children, isValidElement, useState, type ReactNode } from "react";
import type { Element, RootContent } from "hast";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Tabs } from "../../components/Interactions";
import { AttachmentViewer } from "./AttachmentViewer";
import { ArtifactCard } from "./ArtifactCard";
import { ChatBlock } from "./ChatBlock";
import { ChartOutput } from "./ChartOutput";
import { Citation } from "./Citation";
import { CodeBlock } from "./CodeBlock";
import { DiffViewer } from "./DiffViewer";
import { MathOutput } from "./MathOutput";
import { safeHref } from "./chat-links";
import { nodeText } from "./hast";
import { normalizeMdc } from "./normalize-mdc";
import { remarkMdc } from "./remark-mdc";

function chartPoints(
  value: string | undefined,
): { label: string; value: number }[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.every(
        (point) =>
          point &&
          typeof point === "object" &&
          typeof point.label === "string" &&
          typeof point.value === "number",
      )
      ? (parsed as { label: string; value: number }[])
      : null;
  } catch {
    return null;
  }
}

function containsCitation(node: RootContent): boolean {
  return (
    node.type === "element" &&
    (node.properties["data-mdc"] === "citation" ||
      node.children.some(containsCitation))
  );
}

function attributes(node: Element | undefined): Record<string, string> {
  const encoded = node?.properties["data-mdc-attributes"];
  if (typeof encoded !== "string") return {};
  const parsed: unknown = JSON.parse(encoded);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function MdcTabs({ children, label }: { children: ReactNode; label: string }) {
  const panels = Children.toArray(children).filter(
    (child) =>
      isValidElement<ExtraProps>(child) &&
      child.props.node?.properties["data-mdc"] === "tab",
  );
  const [selected, setSelected] = useState("0");
  if (!panels.length)
    return (
      <div>
        <p className="text-sm text-ui-danger" role="alert">
          Tabs need labeled panels.
        </p>
        {children}
      </div>
    );
  const tabs = panels.map((panel, index) => ({
    value: String(index),
    label: isValidElement<ExtraProps>(panel)
      ? (attributes(panel.props.node).label ?? `View ${index + 1}`)
      : `View ${index + 1}`,
  }));
  return (
    <Tabs
      ariaLabel={label}
      tabs={tabs}
      value={tabs.some((tab) => tab.value === selected) ? selected : "0"}
      onValueChange={setSelected}
      className="min-w-0"
      listClassName="flex flex-wrap gap-1"
      panelClassName="min-w-0 space-y-3 p-3"
    >
      {(tab) => panels[Number(tab.value)]}
    </Tabs>
  );
}

function MdcBlock({
  node,
  children,
}: {
  node?: Element;
  children?: ReactNode;
}) {
  const kind = node?.properties["data-mdc"];
  const a = attributes(node);
  const content = node ? nodeText(node).trim() : "";
  switch (kind) {
    case "notice":
    case "callout":
      return (
        <div>
          {a.title && <p className="font-semibold">{a.title}</p>}
          {children}
        </div>
      );
    case "disclosure":
      return (
        <ChatBlock title={a.title ?? "Details"}>
          <details className="min-w-0">
            <summary className="cursor-pointer pt-5 px-3 pb-3 text-sm font-medium">
              {a.summary ?? "Show details"}
            </summary>
            <div className="space-y-3 border-t border-ui-border p-3">
              {children}
            </div>
          </details>
        </ChatBlock>
      );
    case "tabs":
      return <MdcTabs label={a.title ?? "Content views"}>{children}</MdcTabs>;
    case "tab":
      return <div className="min-w-0 space-y-3">{children}</div>;
    case "evidence":
    case "recommendation":
    case "decision":
      return <>{children}</>;
    case "code":
      return (
        <CodeBlock
          code={content}
          {...(a.language ? { language: a.language } : {})}
          {...(a.path || a.filename
            ? { filename: a.path ?? a.filename ?? "" }
            : {})}
        />
      );
    case "diff":
      return (
        <DiffViewer patch={content} {...(a.path ? { path: a.path } : {})} />
      );
    case "artifact":
      return (
        <ArtifactCard
          name={a.label ?? a.filename ?? "Artifact"}
          {...(safeHref(a.href ?? a.src)
            ? { href: safeHref(a.href ?? a.src) }
            : { unavailableReason: "No safe artifact URL supplied" })}
        />
      );
    case "figure":
      return (
        <AttachmentViewer
          attachment={{
            name: a.caption ?? a.alt ?? "Figure",
            mediaType: "image/png",
            ...(safeHref(a.src) ? { href: safeHref(a.src) } : {}),
          }}
        />
      );
    case "metric":
      return (
        <section
          aria-label={a.label ?? "Metric"}
          className="rounded border border-ui-border bg-ui-muted/30 px-3 py-2"
        >
          <p className="text-xs text-ui-muted-foreground">
            {a.label ?? "Metric"}
          </p>
          <p className="font-mono text-lg font-semibold">
            {a.value ?? content}
            {a.unit ? ` ${a.unit}` : ""}
          </p>
          {a.source && (
            <p className="text-xs text-ui-muted-foreground">{a.source}</p>
          )}
        </section>
      );
    case "chart": {
      const points = chartPoints(a.points);
      return points &&
        a.title &&
        a.unit &&
        (a.type === undefined || a.type === "bar" || a.type === "line") ? (
        <ChartOutput
          title={a.title}
          unit={a.unit}
          points={points}
          {...(a.type ? { type: a.type } : {})}
        />
      ) : (
        <div>{children}</div>
      );
    }
    case "math":
      return <MathOutput tex={content} />;
    case "citation":
      return (
        <Citation
          label={a.label ?? (content || "Source")}
          {...(safeHref(a.href ?? a.url)
            ? { href: safeHref(a.href ?? a.url) }
            : {})}
        />
      );
    default:
      return <div>{children}</div>;
  }
}

const components: Components = {
  div: ({ node, children, ...props }) =>
    node?.properties["data-mdc"] ? (
      <MdcBlock node={node}>{children}</MdcBlock>
    ) : (
      <div {...props}>{children}</div>
    ),
  span: ({ node, children, ...props }) =>
    node?.properties["data-mdc"] ? (
      <MdcBlock node={node}>{children}</MdcBlock>
    ) : (
      <span {...props}>{children}</span>
    ),
  a: ({ href, node, children }) => {
    const target = node?.children.some(containsCitation)
      ? undefined
      : safeHref(href);
    return target ? (
      <a
        href={target}
        {...(target.startsWith("#")
          ? {}
          : { target: "_blank", rel: "noopener noreferrer" })}
        className="text-ui-accent underline underline-offset-2"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    );
  },
  img: ({ alt }) => (
    <span className="text-xs text-ui-muted-foreground">
      [Image not loaded{alt ? `: ${alt}` : ""}]
    </span>
  ),
  pre: ({ node, children }) => {
    const code = node?.children.find(
      (child): child is Element =>
        child.type === "element" && child.tagName === "code",
    );
    if (!code)
      return (
        <pre className="max-w-full overflow-auto whitespace-pre-wrap rounded-lg border border-ui-border p-3 text-xs">
          {children}
        </pre>
      );
    const languageClass = Array.isArray(code.properties.className)
      ? code.properties.className.find(
          (value) => typeof value === "string" && value.startsWith("language-"),
        )
      : undefined;
    const language =
      typeof languageClass === "string" ? languageClass.slice(9) : undefined;
    const filename = code.properties["data-filename"];
    const text = nodeText(code).replace(/\n$/, "");
    return language === "diff" ? (
      <DiffViewer
        patch={text}
        {...(typeof filename === "string" && filename
          ? { path: filename }
          : {})}
      />
    ) : (
      <CodeBlock
        code={text}
        {...(language ? { language } : {})}
        {...(typeof filename === "string" && filename ? { filename } : {})}
      />
    );
  },
  code: ({ children }) => (
    <code className="rounded bg-ui-muted px-1 py-0.5 font-mono text-[.875em]">
      {children}
    </code>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-semibold tracking-tight">{children}</h1>
  ),
  h2: ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold">{children}</h4>,
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-5">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-ui-border pl-4 text-ui-muted-foreground">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-ui-border bg-ui-muted px-3 py-2 font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-ui-border px-3 py-2 align-top">{children}</td>
  ),
  hr: () => <hr className="border-ui-border" />,
};

export function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="min-w-0 space-y-3 break-words text-[.9375rem] leading-7 text-ui-foreground [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto">
      <Markdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkMdc, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            { trust: false, strict: "error", maxExpand: 1000, maxSize: 20 },
          ],
        ]}
        components={components}
        skipHtml
        urlTransform={(value) => safeHref(value) ?? ""}
      >
        {normalizeMdc(content)}
      </Markdown>
    </div>
  );
}
