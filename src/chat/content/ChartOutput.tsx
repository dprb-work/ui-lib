import { useState } from "react";
import { ChartColumn, ChartLine, ChevronDown, ChevronUp, Table2 } from "lucide-react";
import { Button } from "../../components/Button";
import { ChatBlock } from "./ChatBlock";
export type ChartPoint = { label: string; value: number };
export type ChartOutputProps = {
  title: string;
  points: ChartPoint[];
  unit: string;
  type?: "bar" | "line";
};
export function ChartOutput({
  title,
  points,
  unit,
  type = "bar",
}: ChartOutputProps) {
  const [table, setTable] = useState(false);
  const [sort, setSort] = useState<{ column: "label" | "value"; direction: "ascending" | "descending" } | null>(null);
  const valid = points.filter((point) => Number.isFinite(point.value));
  const tablePoints = sort === null ? valid : [...valid].sort((left, right) => {
    const order = sort.column === "value" ? left.value - right.value : left.label.localeCompare(right.label, undefined, { numeric: true });
    return sort.direction === "descending" ? -order : order;
  });
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
  const chartIcon =
    type === "line" ? (
      <ChartLine aria-hidden="true" />
    ) : (
      <ChartColumn aria-hidden="true" />
    );
  return (
    <ChatBlock
      title={title}
      icon={chartIcon}
      actions={[
        {
          kind: "button",
          label: table ? "Show chart" : "Show table",
          icon: table ? chartIcon : <Table2 aria-hidden="true" />,
          onSelect: () => setTable((current) => !current),
        },
      ]}
      expansion={table ? "scroll" : "zoom"}
    >
      <div className="flex h-[17.5rem] min-h-0 flex-col in-data-[content-block-viewport=expanded]:h-full">
        {table ? (
          <div
            className="flex min-h-0 flex-1 overflow-x-auto"
            tabIndex={0} // NOSONAR(S6845): native horizontal scrolling must be keyboard-focusable
          >
            <table className="ui-content-data-table">
              <thead>
                <tr>
                  {(["label", "value"] as const).map((column) => (
                    <th key={column} scope="col" aria-sort={sort?.column === column ? sort.direction : "none"}>
                      <Button variant="ghost" className="h-auto w-full rounded-none border-0 py-2 text-sm text-ui-foreground" onClick={() => setSort({ column, direction: sort?.column === column && sort.direction === "ascending" ? "descending" : "ascending" })}>
                        {column === "label" ? "Label" : "Value"}
                        {sort?.column === column && (sort.direction === "descending" ? <ChevronDown className="absolute right-1" aria-hidden="true" /> : <ChevronUp className="absolute right-1" aria-hidden="true" />)}
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                tabIndex={0} // NOSONAR(S6845): the scrollable table body needs native keyboard scrolling
                aria-label={`${title} data`}
              >
                {tablePoints.map((point) => (
                  <tr key={point.label}>
                    <td>{point.label}</td>
                    <td>{point.value} {unit}</td>
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
          <figure className="min-h-0 flex-1">
            <svg
              viewBox="0 0 100 100"
              role="img"
              aria-label={`${title} chart`}
              className="h-full w-full overflow-visible"
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
