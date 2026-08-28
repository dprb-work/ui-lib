import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { CartesianChart, DistributionChart, type DistributionView, type PlotRecord } from "../charts";

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
