import { useState } from "react";
import { Fullscreen } from "../../components/Fullscreen";
import { IconButton } from "../../components/IconButton";
import { ChartColumn, ChartLine, Maximize2, Table2 } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
export type ChartPoint = { label: string; value: number };
export type ChartOutputProps = {
  title: string;
  points: ChartPoint[];
  unit: string;
  type?: "bar" | "line";
};
type ChartOutputInternalProps = ChartOutputProps & { expanded?: boolean };
export function ChartOutput({
  title,
  points,
  unit,
  type = "bar",
  expanded = false,
}: ChartOutputInternalProps) {
  const [table, setTable] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const valid = points.filter((point) => Number.isFinite(point.value));
  const values = valid.map((point) => point.value);
  const observedMinimum = values.length ? Math.min(...values) : 0;
  const observedMaximum = values.length ? Math.max(...values) : 0;
  const minimum =
    observedMinimum === observedMaximum && observedMinimum === 0
      ? -1
      : Math.min(0, observedMinimum);
  const maximum =
    observedMinimum === observedMaximum && observedMaximum === 0
      ? 1
      : Math.max(0, observedMaximum);
  const range = maximum - minimum;
  const yFor = (value: number) => 10 + ((maximum - value) / range) * 80;
  const baseline = yFor(0);
  const coordinates = valid
    .map(
      (point, index) =>
        `${valid.length === 1 ? 50 : 8 + (index * 84) / (valid.length - 1)},${yFor(point.value)}`,
    )
    .join(" ");
  return (
    <ChatBlock
      title={title}
      icon={
        type === "line" ? (
          <ChartLine aria-hidden="true" size={16} />
        ) : (
          <ChartColumn aria-hidden="true" size={16} />
        )
      }
      corner={
        <div className="flex items-center gap-1">
          {!expanded && (
            <Fullscreen
              open={fullscreen}
              onOpenChange={setFullscreen}
              title={`${title} chart`}
              closeLabel="Close expanded chart"
              zoomable
              trigger={
                <IconButton label="Expand chart">
                  <Maximize2 aria-hidden="true" />
                </IconButton>
              }
            >
              <div className="w-full max-w-6xl rounded-lg bg-ui-surface p-4">
                <ChartOutput
                  title={title}
                  points={points}
                  unit={unit}
                  type={type}
                  expanded
                />
              </div>
            </Fullscreen>
          )}
          <IconButton
            label={table ? "Show chart" : "Show table"}
            aria-pressed={table}
            onClick={() => setTable((current) => !current)}
          >
            {table ? (
              type === "line" ? (
                <ChartLine aria-hidden="true" />
              ) : (
                <ChartColumn aria-hidden="true" />
              )
            ) : (
              <Table2 aria-hidden="true" />
            )}
          </IconButton>
        </div>
      }
    >
      <div className="pt-5 px-3 pb-3">
        {table ? (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-ui-border p-2">Label</th>
                  <th className="border-b border-ui-border p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {valid.map((point) => (
                  <tr key={point.label}>
                    <td className="border-b border-ui-border p-2">
                      {point.label}
                    </td>
                    <td className="border-b border-ui-border p-2">
                      {point.value} {unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : valid.length === 0 ? (
          <p className="text-sm text-ui-muted-foreground">
            No finite values to chart.
          </p>
        ) : (
          <figure>
            <svg
              viewBox="0 0 100 100"
              role="img"
              aria-label={`${title} chart`}
              className={
                expanded
                  ? "h-[min(72dvh,48rem)] w-full overflow-visible"
                  : "h-64 w-full overflow-visible"
              }
            >
              {type === "bar" ? (
                valid.map((point, index) => {
                  const x =
                    valid.length === 1
                      ? 42
                      : 8 +
                        (index * 84) / valid.length +
                        (84 / valid.length) * 0.15;
                  const width =
                    valid.length === 1 ? 16 : (84 / valid.length) * 0.7;
                  const y = yFor(point.value);
                  return (
                    <rect
                      key={point.label}
                      x={x}
                      y={Math.min(y, baseline)}
                      width={width}
                      height={Math.abs(baseline - y)}
                      className="fill-ui-accent"
                    />
                  );
                })
              ) : (
                <>
                  <polyline
                    points={coordinates}
                    fill="none"
                    className="stroke-ui-accent"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {valid.map((point, index) => (
                    <circle
                      key={point.label}
                      cx={
                        valid.length === 1
                          ? 50
                          : 8 + (index * 84) / (valid.length - 1)
                      }
                      cy={yFor(point.value)}
                      r="2"
                      className="fill-ui-accent"
                    />
                  ))}
                </>
              )}
              <text
                x="2"
                y="12"
                className="fill-ui-muted-foreground text-[5px]"
              >
                {maximum} {unit}
              </text>
              <text
                x="2"
                y="94"
                className="fill-ui-muted-foreground text-[5px]"
              >
                {minimum} {unit}
              </text>
            </svg>
          </figure>
        )}
      </div>
    </ChatBlock>
  );
}
