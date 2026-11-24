import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { MultiSeriesLineChart, StackedBarChart, StackedBarPlot } from "./charts";
import type { ChartSeries } from "./charts";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
// Upper bound on Tab presses needed to reach a range button from anywhere in one chart.
const MAX_TAB_STOPS = 30;

const tabbedCharts = [
  ["MultiSeriesLineChart", MultiSeriesLineChart],
  ["StackedBarChart", StackedBarChart],
] as const;

function utcMinuteLabel(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 16).replace("T", " ");
}

// Forty days of model usage per account, one point per day at midnight UTC.
// The data lies in 2024, so a window anchored at the wall clock would keep nothing.
const DAILY_POINTS = 40;
const dailyTimestamps = Array.from({ length: DAILY_POINTS }, (_, day) => Date.UTC(2024, 9, 1 + day));
const dailyLabels = dailyTimestamps.map((timestamp) => new Date(timestamp).toISOString().slice(0, 10));
const LAST_DAY = DAILY_POINTS - 1;
const dailySeries: ChartSeries[] = [
  { id: "personal", label: "Personal account", values: dailyTimestamps.map((_, day) => 100 + day) },
  // The work account has no usage on the last day, so its only kept value in "Last 24 hours" is null.
  { id: "work", label: "Work account", values: dailyTimestamps.map((_, day) => (day === LAST_DAY ? null : 300 + day)) },
];

function lastDailyLabels(count: number): string[] {
  return dailyLabels.slice(DAILY_POINTS - count);
}

function lastDailyRows(count: number): string[][] {
  return Array.from({ length: count }, (_, offset) => {
    const day = DAILY_POINTS - count + offset;
    return [dailyLabels[day], `${100 + day} tok`, day === LAST_DAY ? "—" : `${300 + day} tok`];
  });
}

function renderDailyUsage(defaultTimeRange?: "day" | "week" | "month" | "all") {
  return render(
    <MultiSeriesLineChart
      labels={dailyLabels}
      series={dailySeries}
      timestamps={dailyTimestamps}
      defaultTimeRange={defaultTimeRange}
      xLabel="Day"
      yLabel="Tokens"
      unit="tok"
      ariaLabel="Daily model usage"
    />,
  );
}

function timeRangeGroup(): HTMLElement {
  return screen.getByRole("group", { name: "Time range" });
}

function rangeButton(name: string): HTMLElement {
  return within(timeRangeGroup()).getByRole("button", { name });
}

function expectRangeOptions(names: readonly string[]) {
  const group = timeRangeGroup();
  expect(within(group).getAllByRole("button")).toHaveLength(names.length);
  for (const name of names) {
    expect(within(group).getByRole("button", { name })).toBeInTheDocument();
  }
}

function expectSelectedRange(name: string) {
  const group = timeRangeGroup();
  const total = within(group).getAllByRole("button").length;
  expect(within(group).getAllByRole("button", { pressed: true })).toEqual([within(group).getByRole("button", { name })]);
  expect(within(group).getAllByRole("button", { pressed: false })).toHaveLength(total - 1);
}

function valueRowLabels(): string[] {
  return within(screen.getByRole("table"))
    .getAllByRole("rowheader")
    .map((cell) => cell.textContent ?? "");
}

function valueRows(): string[][] {
  return within(screen.getByRole("table"))
    .getAllByRole("row")
    .flatMap((row) => {
      const header = within(row).queryAllByRole("rowheader");
      if (header.length === 0) return [];
      return [[...header, ...within(row).getAllByRole("cell")].map((cell) => cell.textContent ?? "")];
    });
}

async function focusWithTab(user: UserEvent, target: HTMLElement) {
  for (let stop = 0; stop < MAX_TAB_STOPS && document.activeElement !== target; stop += 1) {
    await user.tab();
  }
  expect(target).toHaveFocus();
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("chart time-range presets", () => {
  test("renders no time-range control and lists every label when timestamps are absent", async () => {
    const user = userEvent.setup();
    const labels = ["Mon", "Tue", "Wed"];
    const series: ChartSeries[] = [{ label: "Personal account", values: [12, 18, 7] }];

    for (const [, Chart] of tabbedCharts) {
      const { unmount } = render(<Chart labels={labels} series={series} xLabel="Day" yLabel="Tokens" unit="tok" />);
      expect(screen.queryByRole("group", { name: "Time range", hidden: true })).not.toBeInTheDocument();
      await user.click(screen.getByRole("tab", { name: "Values" }));
      expect(valueRowLabels()).toEqual(labels);
      unmount();
    }
  });

  test.each(tabbedCharts)(
    "%s keeps points strictly inside the window anchored at the latest timestamp, in their original order",
    async (_, Chart) => {
      const user = userEvent.setup();
      const latest = Date.UTC(2024, 10, 9, 12);
      // Newest first, as a usage log lists runs; each pair straddles one window edge.
      const timestamps = [
        latest,
        latest - DAY_MS + MINUTE_MS,
        latest - DAY_MS,
        latest - 7 * DAY_MS + MINUTE_MS,
        latest - 7 * DAY_MS,
        latest - 30 * DAY_MS + MINUTE_MS,
        latest - 30 * DAY_MS,
        latest - 45 * DAY_MS,
      ];
      const labels = timestamps.map(utcMinuteLabel);
      const series: ChartSeries[] = [{ label: "Personal account", values: timestamps.map((_, index) => 10 * (index + 1)) }];

      render(<Chart labels={labels} series={series} timestamps={timestamps} xLabel="Run" yLabel="Tokens" unit="tok" />);
      await user.click(screen.getByRole("tab", { name: "Values" }));

      const expectedLabels: [string, string[]][] = [
        ["Last 24 hours", labels.slice(0, 2)],
        ["Last week", labels.slice(0, 4)],
        ["Last month", labels.slice(0, 6)],
        ["All", labels],
      ];
      for (const [range, kept] of expectedLabels) {
        await user.click(rangeButton(range));
        expectSelectedRange(range);
        expect(valueRowLabels()).toEqual(kept);
      }
    },
  );

  test("filters Values rows to the kept points of every series and keeps every series in the legend", async () => {
    const user = userEvent.setup();
    renderDailyUsage();

    expect(screen.getAllByRole("group", { name: "Time range", hidden: true })).toHaveLength(1);
    expectRangeOptions(["Last 24 hours", "Last week", "Last month", "All"]);
    expectSelectedRange("All");

    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(valueRows()).toEqual(lastDailyRows(DAILY_POINTS));

    await user.click(rangeButton("Last month"));
    expect(valueRows()).toEqual(lastDailyRows(30));

    await user.click(rangeButton("Last week"));
    expect(valueRows()).toEqual(lastDailyRows(7));

    await user.click(rangeButton("Last 24 hours"));
    expect(valueRows()).toEqual(lastDailyRows(1));

    const legend = screen.getByRole("list", { name: "Series" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Personal account", "Work account"]);
  });

  test("offers All exactly when Last month would drop a point: at least 30 days between earliest and latest", async () => {
    const user = userEvent.setup();
    const october = Array.from({ length: 31 }, (_, day) => Date.UTC(2024, 9, 1 + day));
    const series: ChartSeries[] = [{ label: "Personal account", values: october.map((_, day) => day) }];
    const labels = october.map(utcMinuteLabel);

    // Exactly 30 days between the first and last point: "Last month" drops the first point, so "All" is offered.
    const { unmount } = render(
      <MultiSeriesLineChart labels={labels} series={series} timestamps={october} xLabel="Day" yLabel="Tokens" />,
    );
    expectRangeOptions(["Last 24 hours", "Last week", "Last month", "All"]);
    expectSelectedRange("All");
    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(valueRowLabels()).toEqual(labels);
    await user.click(rangeButton("Last month"));
    expect(valueRowLabels()).toEqual(labels.slice(1));
    unmount();

    // One minute less than 30 days between the first and last point: "Last month" already keeps every point.
    const shortened = [october[0] + MINUTE_MS, ...october.slice(1)];
    render(<MultiSeriesLineChart labels={labels} series={series} timestamps={shortened} xLabel="Day" yLabel="Tokens" />);
    expectRangeOptions(["Last 24 hours", "Last week", "Last month"]);
    expect(within(timeRangeGroup()).queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expectSelectedRange("Last month");
    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(valueRowLabels()).toEqual(labels);
  });

  test("selects defaultTimeRange first, then All when offered, else Last month", async () => {
    const user = userEvent.setup();

    const week = renderDailyUsage("week");
    expectSelectedRange("Last week");
    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(valueRowLabels()).toEqual(lastDailyLabels(7));
    week.unmount();

    // Ten daily points span nine days, so "All" is not offered.
    const tenDays = dailyTimestamps.slice(0, 10);
    const tenLabels = dailyLabels.slice(0, 10);
    const tenSeries: ChartSeries[] = [{ label: "Personal account", values: tenDays.map((_, day) => 100 + day) }];

    const fallback = render(
      <MultiSeriesLineChart labels={tenLabels} series={tenSeries} timestamps={tenDays} xLabel="Day" yLabel="Tokens" />,
    );
    expect(within(timeRangeGroup()).queryByRole("button", { name: "All" })).not.toBeInTheDocument();
    expectSelectedRange("Last month");
    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(valueRowLabels()).toEqual(tenLabels);
    fallback.unmount();

    render(
      <MultiSeriesLineChart
        labels={tenLabels}
        series={tenSeries}
        timestamps={tenDays}
        defaultTimeRange="all"
        xLabel="Day"
        yLabel="Tokens"
      />,
    );
    expectSelectedRange("Last month");
    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(valueRowLabels()).toEqual(tenLabels);
  });

  test("selects a range with Tab plus Enter or Space and keeps it across Graph and Values switches", async () => {
    const user = userEvent.setup();
    renderDailyUsage();

    await focusWithTab(user, rangeButton("Last week"));
    await user.keyboard("{Enter}");
    expectSelectedRange("Last week");

    await user.click(screen.getByRole("tab", { name: "Values" }));
    expectSelectedRange("Last week");
    expect(valueRowLabels()).toEqual(lastDailyLabels(7));

    await user.click(screen.getByRole("tab", { name: "Graph" }));
    expectSelectedRange("Last week");

    await focusWithTab(user, rangeButton("Last 24 hours"));
    await user.keyboard(" ");
    expectSelectedRange("Last 24 hours");

    await user.click(screen.getByRole("tab", { name: "Values" }));
    expectSelectedRange("Last 24 hours");
    expect(valueRowLabels()).toEqual(lastDailyLabels(1));
  });

  test("throws a RangeError when timestamps and labels differ in length", () => {
    // React reports the render error on the console before rethrowing it.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const shortTimestamps = dailyTimestamps.slice(1);

    for (const [, Chart] of tabbedCharts) {
      expect(() =>
        render(<Chart labels={dailyLabels} series={dailySeries} timestamps={shortTimestamps} xLabel="Day" yLabel="Tokens" />),
      ).toThrow(RangeError);
    }
  });
});

describe("stacked bar charts", () => {
  const labels = ["Mon", "Tue", "Wed"];
  const series: ChartSeries[] = [
    { id: "personal", label: "Personal account", values: [64, 71, null] },
    { id: "work", label: "Work account", values: [18, 22, 25] },
    { id: "team", label: "Team account", values: [3, 4, 2] },
  ];

  test("StackedBarChart offers Graph and Values tabs, a named chart, the legend, and formatted values", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <StackedBarChart labels={labels} series={series} xLabel="Day" yLabel="Quota" unit="%" ariaLabel="Weekly quota by account" />,
    );

    expect(screen.getByRole("tab", { name: "Graph" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Values" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("img", { name: "Weekly quota by account" })).toBeInTheDocument();
    const legend = screen.getByRole("list", { name: "Series" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Personal account",
      "Work account",
      "Team account",
    ]);

    await user.click(screen.getByRole("tab", { name: "Values" }));
    expect(screen.getByRole("tab", { name: "Values" })).toHaveAttribute("aria-selected", "true");
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Day",
      "Personal account",
      "Work account",
      "Team account",
    ]);
    expect(valueRows()).toEqual([
      ["Mon", "64%", "18%", "3%"],
      ["Tue", "71%", "22%", "4%"],
      ["Wed", "—", "25%", "2%"],
    ]);

    rerender(<StackedBarChart labels={labels} series={series} xLabel="Day" yLabel="Tokens" unit="tok" />);
    expect(valueRows()[0]).toEqual(["Mon", "64 tok", "18 tok", "3 tok"]);

    rerender(
      <StackedBarChart labels={labels} series={series} xLabel="Day" yLabel="Tokens" unit="tok" formatValue={(value) => `~${value}`} />,
    );
    expect(valueRows()[0]).toEqual(["Mon", "~64", "~18", "~3"]);
  });

  test("StackedBarPlot renders the legend and the chart without tabs or a time-range control", () => {
    render(<StackedBarPlot labels={labels} series={series} xLabel="Day" yLabel="Quota" unit="%" ariaLabel="Weekly quota by account" />);

    expect(screen.getByRole("img", { name: "Weekly quota by account" })).toBeInTheDocument();
    const legend = screen.getByRole("list", { name: "Series" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Personal account",
      "Work account",
      "Team account",
    ]);
    expect(screen.queryAllByRole("tab", { hidden: true })).toHaveLength(0);
    expect(screen.queryByRole("group", { name: "Time range", hidden: true })).not.toBeInTheDocument();
  });
});
