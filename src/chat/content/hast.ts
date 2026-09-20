import type { Element, RootContent } from "hast";

export function nodeText(node: RootContent | Element): string {
  if (node.type === "text") return node.value;
  return "children" in node ? node.children.map(nodeText).join("") : "";
}
