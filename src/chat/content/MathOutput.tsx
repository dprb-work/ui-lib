import { useMemo } from "react";
import katex from "katex";
export type MathOutputProps = {
  tex: string;
  displayMode?: boolean;
  label?: string;
};
export function MathOutput({
  tex,
  displayMode = true,
  label = "Mathematical expression",
}: MathOutputProps) {
  const rendered = useMemo(() => {
    try {
      return {
        html: katex.renderToString(tex, {
          displayMode,
          throwOnError: true,
          trust: false,
          strict: "error",
          maxExpand: 1000,
          maxSize: 20,
        }),
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid TeX." };
    }
  }, [tex, displayMode]);
  if ("error" in rendered)
    return (
      <p role="alert" className="text-sm text-ui-danger">
        Unable to render math: {rendered.error}
      </p>
    );
  return displayMode ? (
    <div
      role="math"
      aria-label={label}
      className="overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  ) : (
    <span
      role="math"
      aria-label={label}
      className="inline-block"
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}
