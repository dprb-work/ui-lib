import type { Root } from "mdast";
import type {} from "mdast-util-directive";
import { visit } from "unist-util-visit";

const supported: Record<string, true | undefined> = {
  callout: true,
  notice: true,
  disclosure: true,
  tabs: true,
  tab: true,
  evidence: true,
  recommendation: true,
  decision: true,
  code: true,
  diff: true,
  artifact: true,
  figure: true,
  metric: true,
  chart: true,
  math: true,
  citation: true,
};
const attributes: Record<string, true | undefined> = {
  title: true,
  label: true,
  summary: true,
  kind: true,
  status: true,
  source: true,
  date: true,
  path: true,
  revision: true,
  language: true,
  href: true,
  url: true,
  src: true,
  filename: true,
  caption: true,
  alt: true,
  value: true,
  total: true,
  unit: true,
  type: true,
  points: true,
  context: true,
  author: true,
  year: true,
};

export function remarkMdc() {
  return (tree: Root, file: { value: unknown }) => {
    visit(tree, (node) => {
      if (node.type === "code")
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            "data-filename": node.meta ?? "",
          },
        };
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      )
        return;
      const data = node.data ?? (node.data = {});
      if (
        !Object.hasOwn(supported, node.name) ||
        (node.type === "textDirective" && node.name !== "citation")
      ) {
        data.hName = node.type === "textDirective" ? "span" : "pre";
        data.hProperties = { "data-mdc-unsupported": node.name };
        data.hChildren = [
          {
            type: "text",
            value: String(file.value).slice(
              node.position?.start.offset,
              node.position?.end.offset,
            ),
          },
        ];
        return;
      }
      const safeAttributes: Record<string, string> = {};
      for (const [key, value] of Object.entries(node.attributes ?? {}))
        if (Object.hasOwn(attributes, key) && typeof value === "string")
          safeAttributes[key] = value;
      const first = node.children[0];
      if (
        node.type === "containerDirective" &&
        first?.type === "paragraph" &&
        first.data?.directiveLabel
      ) {
        safeAttributes.title ??= first.children
          .map((child) => ("value" in child ? child.value : ""))
          .join("");
        node.children.shift();
      }
      if (node.name === "figure") {
        const paragraph = node.children.find(
          (child) => child.type === "paragraph",
        );
        const image =
          paragraph?.type === "paragraph"
            ? paragraph.children.find((child) => child.type === "image")
            : undefined;
        if (image?.type === "image") {
          safeAttributes.src ??= image.url;
          safeAttributes.alt ??= image.alt ?? "";
        }
      }
      data.hName = node.type === "textDirective" ? "span" : "div";
      data.hProperties = {
        "data-mdc": node.name,
        "data-mdc-attributes": JSON.stringify(safeAttributes),
      };
    });
  };
}
