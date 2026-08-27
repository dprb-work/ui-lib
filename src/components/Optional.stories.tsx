import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";

import { DistributionChart } from "../charts";
import { MatrixDataTable } from "../data-table";
import { StatusPanel } from "./StatusPanel";

const meta = {
  title: "Components/Optional",
  component: StatusPanel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof StatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DataTable: Story = {
  args: { title: "Optional data table" },
  render: () => (
    <MatrixDataTable
      caption="Package measurements"
      headers={["Package", "Bytes"]}
      rows={Array.from({ length: 30 }, (_, index) => [`package-${index + 1}`, String((index + 1) * 128)])}
      interactive
      className="grid gap-4 text-slate-950 dark:text-white"
      tableClassName="[&_caption]:sr-only [&_td]:border-b [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border-b [&_th]:border-slate-300 [&_th]:p-2 dark:[&_td]:border-slate-700 dark:[&_th]:border-slate-600"
    />
  ),
};

export const BoxPlot: Story = {
  args: { title: "Optional chart" },
  render: () => (
    <div
      className="h-72 rounded-xl bg-white p-6 text-slate-950 dark:bg-slate-950 dark:text-white [&_[data-ui-chart]]:h-full [&_[data-ui-distribution-svg]]:h-full [&_[data-ui-distribution-svg]]:w-full [&_[data-ui-distribution-svg]_line]:stroke-ui-accent [&_[data-ui-distribution-svg]_rect]:fill-ui-accent/20 [&_[data-ui-distribution-svg]_rect]:stroke-ui-accent"
      style={{ "--ui-chart-accent": "var(--ui-accent)" } as CSSProperties}
    >
      <DistributionChart
        view="box"
        records={[1, 2, 3, 5, 8, 13, 21].map((value) => ({ label: String(value), value }))}
        min={1}
        max={21}
        yLabel="Duration"
        unit="ms"
        ariaLabel="Duration distribution"
      />
    </div>
  ),
};
