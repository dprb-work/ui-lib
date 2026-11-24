import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import {
  CartesianChart,
  DistributionChart,
  MultiSeriesLineChart,
  StackedBarChart,
  type ChartSeries,
  type DistributionView,
  type PlotRecord,
} from "../charts";
import { modelUsageLabels, modelUsageSeries, modelUsageTimestamps } from "../test/fixtures/model-usage";

const meta = {
  title: "Components/Charts",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const deliveryRecords: PlotRecord[] = [
  { label: "Reporter", value: 100 },
  { label: "Dashboard", value: 84 },
  { label: "Notebook", value: 68 },
  { label: "Static export", value: 54 },
];

const trendRecords: PlotRecord[] = [
  { label: "Parse", value: 24 },
  { label: "Validate", value: 47 },
  { label: "Render", value: 76 },
  { label: "Review", value: 91 },
  { label: "Publish", value: 100 },
];

const distributionRecords: PlotRecord[] = [
  42, 45, 45, 47, 49, 50, 51, 51, 52, 53, 54, 55, 58, 61, 64, 68,
].map((value, index) => ({ label: `Observation ${index + 1}`, value }));

function ChartFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 rounded-xl border border-ui-border bg-ui-surface p-5 shadow-xs">
      <h2 className="text-sm font-semibold text-ui-surface-foreground">{title}</h2>
      <div className="h-72 min-w-0">{children}</div>
    </section>
  );
}

function StoryCanvas({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-ui-background p-6 text-ui-foreground sm:p-10">{children}</main>;
}

export const Cartesian: Story = {
  render: () => (
    <StoryCanvas>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <ChartFrame title="Delivery coverage">
          <CartesianChart
            className="h-full"
            type="bar"
            records={deliveryRecords}
            min={0}
            max={100}
            unit="%"
            xLabel="Approach"
            yLabel="Coverage"
            ariaLabel="Delivery coverage by approach"
          />
        </ChartFrame>
        <ChartFrame title="Pipeline completion">
          <CartesianChart
            className="h-full"
            type="line"
            records={trendRecords}
            min={0}
            max={100}
            unit="%"
            xLabel="Build stage"
            yLabel="Completion"
            ariaLabel="Cumulative pipeline completion by build stage"
          />
        </ChartFrame>
      </div>
    </StoryCanvas>
  ),
};

const distributionViews: DistributionView[] = ["histogram", "box", "density", "violin"];

export const Distributions: Story = {
  render: () => (
    <StoryCanvas>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        {distributionViews.map((view) => (
          <ChartFrame key={view} title={`${view[0].toUpperCase()}${view.slice(1)} distribution`}>
            <DistributionChart
              className="h-full"
              view={view}
              records={distributionRecords}
              min={40}
              max={70}
              unit="ms"
              yLabel="Latency"
              ariaLabel={`${view} distribution of request latency`}
            />
          </ChartFrame>
        ))}
      </div>
    </StoryCanvas>
  ),
};

const weeklyAllowanceDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const weeklyAllowanceSeries: ChartSeries[] = [
  { id: "five-hour", label: "Five-hour window", values: [28, 41, 63, 54, 72, 39, 46] },
  { id: "weekly-all", label: "Weekly all-models", values: [14, 29, 45, 58, 71, 79, 86] },
  { id: "weekly-sonnet", label: "Weekly Sonnet", values: [9, 18, 27, 34, 48, 52, 61] },
];

const fleetAllowanceSeries: ChartSeries[] = [
  ...weeklyAllowanceSeries,
  { id: "batch-workers", label: "Batch workers", values: [18, 24, 31, null, 44, 38, 42] },
  { id: "eval-runner", label: "Evaluation runner", values: [6, 12, 19, 25, 22, 16, 20] },
];

export const MultiSeriesLine: Story = {
  render: () => (
    <main className="min-h-screen bg-ui-background p-4 text-ui-foreground sm:p-8">
      <section className="mx-auto grid max-w-4xl min-w-0 gap-4">
        <h1 className="text-base font-semibold text-ui-foreground">
          Weekly usage allowances
        </h1>
        <MultiSeriesLineChart
          labels={weeklyAllowanceDays}
          series={weeklyAllowanceSeries}
          xLabel="Day"
          yLabel="Allowance used"
          unit="%"
          min={0}
          max={100}
          tabsAriaLabel="Weekly usage allowances views"
          tableCaption="Weekly usage allowances (%)"
          ariaLabel="Weekly usage allowances across three windows from Monday to Sunday"
        />
      </section>
    </main>
  ),
};

export const MultiSeriesLineFiveSeries: Story = {
  render: () => (
    <main className="min-h-screen bg-ui-background p-4 text-ui-foreground sm:p-8">
      <section className="mx-auto grid max-w-4xl min-w-0 gap-4">
        <h1 className="text-base font-semibold text-ui-foreground">
          Weekly usage allowances across five pools
        </h1>
        <MultiSeriesLineChart
          labels={weeklyAllowanceDays}
          series={fleetAllowanceSeries}
          xLabel="Day"
          yLabel="Allowance used"
          unit="%"
          min={0}
          max={100}
          tabsAriaLabel="Five-pool usage allowances views"
          tableCaption="Weekly usage allowances across five pools (%)"
          ariaLabel="Weekly usage allowances across five pools from Monday to Sunday"
        />
      </section>
    </main>
  ),
};

export const ModelUsageTimeRange: Story = {
  render: () => (
    <main className="min-h-screen bg-ui-background p-4 text-ui-foreground sm:p-8">
      <section className="mx-auto grid max-w-4xl min-w-0 gap-4">
        <h1 className="text-base font-semibold text-ui-foreground">Daily model usage per account</h1>
        <MultiSeriesLineChart
          labels={modelUsageLabels}
          timestamps={modelUsageTimestamps}
          series={modelUsageSeries}
          xLabel="Day"
          yLabel="Model usage"
          unit="M tokens"
          min={0}
          tabsAriaLabel="Daily model usage views"
          tableCaption="Daily model usage per account (M tokens)"
          ariaLabel="Daily model usage per account"
        />
      </section>
    </main>
  ),
};

export const StackedBar: Story = {
  render: () => (
    <main className="min-h-screen bg-ui-background p-4 text-ui-foreground sm:p-8">
      <section className="mx-auto grid max-w-4xl min-w-0 gap-4">
        <h1 className="text-base font-semibold text-ui-foreground">Daily model usage per account, stacked</h1>
        <StackedBarChart
          labels={modelUsageLabels}
          timestamps={modelUsageTimestamps}
          defaultTimeRange="month"
          series={modelUsageSeries}
          xLabel="Day"
          yLabel="Model usage"
          unit="M tokens"
          tabsAriaLabel="Stacked daily model usage views"
          tableCaption="Stacked daily model usage per account (M tokens)"
          ariaLabel="Daily model usage per account, stacked by account"
        />
      </section>
    </main>
  ),
};
