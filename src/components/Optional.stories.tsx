import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, userEvent, within } from "storybook/test";

import { CartesianChart, DistributionChart } from "../charts";
import { MatrixDataTable } from "../data-table";
import { StatusPanel } from "./StatusPanel";

const meta = {
  title: "Components/Optional",
  component: StatusPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof StatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const tableClasses =
  "[&_caption]:mb-3 [&_caption]:text-left [&_caption]:text-sm [&_caption]:font-semibold [&_td]:border-b [&_td]:border-ui-border [&_td]:p-2 [&_th]:border-b [&_th]:border-ui-border [&_th]:p-2 [&_th]:text-left";

const packageRows = Array.from({ length: 30 }, (_, index) => [
  `package-${index + 1}`,
  String((index + 1) * 128),
  index % 3 === 0 ? "Changed" : "Unchanged",
]);

const durationRecords = [8, 11, 12, 14, 14, 15, 18, 22, 35, 55].map((value, index) => ({
  label: `Run ${index + 1}`,
  value,
}));

const chartFrameClass =
  "h-72 rounded-xl border border-ui-border bg-ui-surface p-6 text-ui-surface-foreground shadow-sm [&_[data-ui-chart]]:h-full [&_[data-ui-distribution-svg]]:h-full [&_[data-ui-distribution-svg]]:w-full [&_[data-ui-distribution-svg]_line]:stroke-ui-accent [&_[data-ui-distribution-svg]_rect]:fill-ui-accent/20 [&_[data-ui-distribution-svg]_rect]:stroke-ui-accent";

const chartStyle = { "--ui-chart-accent": "var(--ui-accent)" } as CSSProperties;

export const StaticTable: Story = {
  args: { title: "Static table" },
  render: () => (
    <MatrixDataTable
      caption="Responsibility summary"
      headers={["Responsibility", "Files", "Risk"]}
      rows={[
        ["Execution", "12", "High"],
        ["Configuration", "8", "Medium"],
        ["Documentation", "5", "Low"],
      ]}
      className="text-ui-foreground"
      tableClassName={tableClasses}
    />
  ),
};

export const InteractiveTable: Story = {
  args: { title: "Interactive table" },
  render: () => (
    <MatrixDataTable
      caption="Package measurements"
      headers={["Package", "Bytes", "State"]}
      rows={packageRows}
      interactive
      initialPageSize={10}
      className="grid gap-4 text-ui-foreground"
      tableClassName={tableClasses}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Showing 1–10 of 30/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(canvas.getByText(/Showing 11–20 of 30/)).toBeVisible();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Filter rows" }), "package-29");
    await expect(canvas.getByText("package-29")).toBeVisible();
    await expect(canvas.queryByText("package-12")).not.toBeInTheDocument();
  },
};

export const CartesianCharts: Story = {
  args: { title: "Cartesian charts" },
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={chartFrameClass} style={chartStyle}>
        <CartesianChart
          type="bar"
          records={durationRecords}
          min={0}
          max={60}
          xLabel="Analysis run"
          yLabel="Duration"
          unit="ms"
          ariaLabel="Analysis duration bar chart"
        />
      </div>
      <div className={chartFrameClass} style={chartStyle}>
        <CartesianChart
          type="line"
          records={durationRecords}
          min={0}
          max={60}
          xLabel="Analysis run"
          yLabel="Duration"
          unit="ms"
          ariaLabel="Analysis duration line chart"
        />
      </div>
    </div>
  ),
};

export const DistributionCharts: Story = {
  args: { title: "Distribution charts" },
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["histogram", "box", "density", "violin"] as const).map((view) => (
        <figure key={view} className="m-0 grid gap-2">
          <figcaption className="text-sm font-semibold capitalize text-ui-foreground">
            {view}
          </figcaption>
          <div className={chartFrameClass} style={chartStyle}>
            <DistributionChart
              view={view}
              records={durationRecords}
              min={8}
              max={55}
              yLabel="Duration"
              unit="ms"
              ariaLabel={`${view} duration distribution`}
            />
          </div>
        </figure>
      ))}
    </div>
  ),
};
