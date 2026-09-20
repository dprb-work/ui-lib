import { CodeBlock } from "./CodeBlock";
export type JsonBlockProps = { data: unknown; title?: string };
function safeJson(data: unknown) {
  const ancestors: object[] = [];
  try {
    return (
      JSON.stringify(
        data,
        function (_key, value) {
          if (typeof value === "object" && value) {
            while (ancestors.length > 0 && ancestors.at(-1) !== this)
              ancestors.pop();
            if (ancestors.includes(value)) return "[Circular]";
            ancestors.push(value);
          }
          return typeof value === "bigint" ? String(value) : value;
        },
        2,
      ) ?? "undefined"
    );
  } catch {
    return "Unable to serialize this data.";
  }
}
export function JsonBlock({ data, title = "Structured data" }: JsonBlockProps) {
  return <CodeBlock code={safeJson(data)} language="json" filename={title} />;
}
