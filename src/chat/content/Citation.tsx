import { safeHref } from "./chat-links";
export type CitationProps = { label: string; href?: string };
export function Citation({ label, href }: CitationProps) {
  const safe = safeHref(href);
  const className =
    "inline-flex max-w-full items-center rounded border border-ui-border bg-ui-muted px-2 py-0.5 text-xs text-ui-accent";
  return safe ? (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {label}
    </a>
  ) : (
    <span className={className}>{label}</span>
  );
}
