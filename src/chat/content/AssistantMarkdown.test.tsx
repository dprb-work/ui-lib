import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantMarkdown } from "./AssistantMarkdown";

describe("AssistantMarkdown content boundary", () => {
  it("renders allowed MDC content without executing HTML or attribute expressions", () => {
    const html = renderToStaticMarkup(
      <AssistantMarkdown
        content={
          '<script>alert(1)</script>\n\n:::notice{title="Review" onclick="alert(1)" style="position:fixed"}\n**Keep the result.**\n:::\n\n[unsafe](javascript:alert)'
        }
      />,
    );
    expect(html).toContain("Review");
    expect(html).toContain("<strong>Keep the result.</strong>");
    expect(html).not.toMatch(
      /<script|onclick=|position:fixed|href="javascript:/i,
    );
  });

  it("keeps unknown components literal and does not import or execute them", () => {
    const html = renderToStaticMarkup(
      <AssistantMarkdown
        content={
          ':::iframe{src="https://example.com"}\nRead this literally.\n:::'
        }
      />,
    );
    expect(html).toContain(":::iframe");
    expect(html).toContain("Read this literally.");
    expect(html).not.toContain("<iframe");
  });

  it("does not embed remote images from Markdown or MDC", () => {
    const html = renderToStaticMarkup(
      <AssistantMarkdown
        content={
          '![private image](https://example.com/tracker.png)\n\n::figure{caption="Evidence" src="https://example.com/evidence.png"}'
        }
      />,
    );
    expect(html).not.toContain("<img");
  });

  it("preserves code text and fence filename alongside the raw copy control", () => {
    const html = renderToStaticMarkup(
      <AssistantMarkdown
        content={'```ts session.ts\nconst value = "<script>";\n```'}
      />,
    );
    expect(html).toContain("session.ts");
    expect(html).toContain("Copy code");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("rejects prototype-like directive names", () => {
    const html = renderToStaticMarkup(
      <AssistantMarkdown content={":::constructor\nLiteral input.\n:::"} />,
    );
    expect(html).toContain(":::constructor");
    expect(html).toContain("Literal input.");
  });

  it("does not make citation controls activate an enclosing Markdown link", () => {
    const html = renderToStaticMarkup(
      <AssistantMarkdown
        content={
          '[read *:citation[details]{source="Runbook"}*](https://attacker.example)'
        }
      />,
    );
    expect(html).toContain("details");
    expect(html).not.toContain('href="https://attacker.example');
  });
});
