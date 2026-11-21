import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { MultiSeriesLineChart, MultiSeriesLinePlot, SERIES_COLOR_TOKENS } from "./charts";
import type { ChartSeries } from "./charts";

const labels = ["Mon", "Tue", "Wed"];
const series: ChartSeries[] = [
  { id: "requests", label: "Requests", values: [64, 71, null] },
  { id: "errors", label: "Errors", values: [18, 22, 25] },
  { id: "timeouts", label: "Timeouts", values: [3, 4, 2] },
];

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("multi-series chart contracts", () => {
  test("exports all ten series color tokens in order", () => {
    expect(SERIES_COLOR_TOKENS).toEqual(Array.from({ length: 10 }, (_, index) => `--color-ui-series-${index + 1}`));
  });

  test("renders graph controls, the complete legend, the accessible chart, and graph actions", () => {
    render(
      <MultiSeriesLineChart
        labels={labels}
        series={series}
        xLabel="Day"
        yLabel="Usage"
        unit="%"
        ariaLabel="Weekly usage"
        graphActions={<button type="button">Download chart</button>}
      />,
    );

    expect(screen.getByRole("tab", { name: "Graph" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Values" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("img", { name: "Weekly usage" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download chart" })).toBeVisible();

    const legend = screen.getByRole("list", { name: "Series" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Requests", "Errors", "Timeouts"]);
  });

  test("shows semantic values with percentage formatting and em dashes for null points", async () => {
    render(<MultiSeriesLineChart labels={labels} series={series} xLabel="Day" yLabel="Usage" unit="%" tableCaption="Weekly usage values" />);

    await userEvent.click(screen.getByRole("tab", { name: "Values" }));
    const table = screen.getByRole("table");
    expect(within(table).getByText("Weekly usage values")).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Day", "Requests", "Errors", "Timeouts"]);
    expect(within(table).getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual(labels);
    expect(within(table).getByRole("cell", { name: "64%" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "18%" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "—" })).toBeInTheDocument();
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(4);
    expect(table.querySelectorAll('th[scope="row"]')).toHaveLength(3);
  });

  test("formats non-percentage units and accepts a custom formatter", async () => {
    const { rerender } = render(
      <MultiSeriesLineChart labels={labels} series={series} xLabel="Day" yLabel="Latency" unit="ms" defaultView="values" />,
    );
    expect(screen.getByRole("cell", { name: "64 ms" })).toBeInTheDocument();

    rerender(
      <MultiSeriesLineChart
        labels={labels}
        series={series}
        xLabel="Day"
        yLabel="Latency"
        unit="ms"
        defaultView="values"
        formatValue={(value) => `~${value}`}
      />,
    );
    expect(screen.getByRole("cell", { name: "~64" })).toBeInTheDocument();
  });

  test("supports keyboard tab switching in both directions", async () => {
    render(<MultiSeriesLineChart labels={labels} series={series} xLabel="Day" yLabel="Usage" />);
    const graph = screen.getByRole("tab", { name: "Graph" });
    graph.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Values" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table")).toBeVisible();
    await userEvent.keyboard("{ArrowLeft}");
    expect(graph).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector("[data-ui-chart] canvas")).toBeInTheDocument();
  });

  test("keeps controlled tab state with the caller and reports requested changes", async () => {
    const onViewChange = vi.fn();
    const { rerender } = render(
      <MultiSeriesLineChart labels={labels} series={series} xLabel="Day" yLabel="Usage" view="graph" onViewChange={onViewChange} />,
    );

    await userEvent.click(screen.getByRole("tab", { name: "Values" }));
    expect(onViewChange).toHaveBeenCalledWith("values");
    expect(screen.getByRole("tab", { name: "Graph" })).toHaveAttribute("aria-selected", "true");
    rerender(<MultiSeriesLineChart labels={labels} series={series} xLabel="Day" yLabel="Usage" view="values" onViewChange={onViewChange} />);
    expect(screen.getByRole("tab", { name: "Values" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table")).toBeVisible();
  });

  test("allows the standalone plot to omit its legend", () => {
    const { rerender } = render(
      <MultiSeriesLinePlot labels={labels} series={series} xLabel="Day" yLabel="Usage" showLegend={false} />,
    );
    expect(screen.queryByRole("list", { name: "Series" })).not.toBeInTheDocument();

    rerender(<MultiSeriesLinePlot labels={labels} series={series} xLabel="Day" yLabel="Usage" compact />);
    expect(screen.queryByRole("list", { name: "Series" })).not.toBeInTheDocument();
  });
});
