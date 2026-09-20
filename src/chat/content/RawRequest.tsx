export type RawRequestProps = { input: string; className?: string };
export function RawRequest({ input, className }: RawRequestProps) {
  return (
    <details className={className}>
      <summary className="cursor-pointer text-xs text-ui-muted-foreground focus-visible:outline-2 focus-visible:outline-ui-accent">
        Inspect raw request
      </summary>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-ui-muted p-2 text-xs text-ui-foreground">
        {input}
      </pre>
    </details>
  );
}
