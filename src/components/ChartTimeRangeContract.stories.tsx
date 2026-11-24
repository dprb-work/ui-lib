import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { StackedBarChart } from "../charts";
import { modelUsageLabels, modelUsageSeries, modelUsageTimestamps } from "../test/fixtures/model-usage";

type ContractArgs = { width: 390 | 1440 };

const seriesTokens = modelUsageSeries.map((_, index) => `--color-ui-series-${index + 1}`);

const meta = {
  title: "Foundations/Chart time range contract",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { width: 390 },
  render: () => (
    <section data-theme="light" aria-label="Chart time range contract" className="min-h-screen bg-ui-background p-4 text-ui-foreground">
      <div className="mx-auto w-full max-w-[1440px]">
        <StackedBarChart
          labels={modelUsageLabels}
          timestamps={modelUsageTimestamps}
          series={modelUsageSeries}
          xLabel="Day"
          yLabel="Model usage"
          unit="M tokens"
          tableCaption="Daily model usage values"
          ariaLabel="Daily model usage per account, stacked"
        />
      </div>
    </section>
  ),
  play: async ({ canvasElement, args, globals }) => {
    // Vitest's browser platform is available only in browser-run story tests.
    const { page } = await import("@vitest/browser/context");
    const theme = globals.theme === "dark" ? "dark" : "light";
    const scope = within(canvasElement).getByRole("region", { name: "Chart time range contract" });
    scope.dataset.theme = theme;
    await page.viewport(args.width, 844);

    const doc = canvasElement.ownerDocument;
    expect(doc.documentElement.scrollWidth, "The chart must not create page-level horizontal overflow").toBeLessThanOrEqual(args.width);
    const chart = within(scope);

    const rangeGroup = chart.getByRole("group", { name: "Time range" });
    const scopeRect = scope.getBoundingClientRect();
    const groupRect = rangeGroup.getBoundingClientRect();
    expect(groupRect.left, "The time-range switch stays inside the chart").toBeGreaterThanOrEqual(scopeRect.left);
    expect(groupRect.right, "The time-range switch stays inside the chart").toBeLessThanOrEqual(scopeRect.right);
    const presets = within(rangeGroup).getAllByRole("button");
    expect(presets.map((button) => button.textContent)).toEqual(["Last 24 hours", "Last week", "Last month", "All"]);
    for (const preset of presets) {
      expect(preset.scrollWidth, `"${preset.textContent}" fits on one line`).toBeLessThanOrEqual(preset.clientWidth);
      expect(preset.getBoundingClientRect().height).toBe(presets[0]!.getBoundingClientRect().height);
    }
    expect(within(rangeGroup).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");

    const colorCanvas = doc.createElement("canvas");
    const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
    if (!colorContext) throw new Error("Canvas color normalization is unavailable");
    const normalized = (value: string) => {
      colorContext.fillStyle = value;
      colorContext.fillRect(0, 0, 1, 1);
      return Array.from(colorContext.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const chartCanvas = scope.querySelector<HTMLCanvasElement>("[data-ui-chart] canvas")!;
    const context = chartCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("The chart canvas context is unavailable");
    const pixels = context.getImageData(0, 0, chartCanvas.width, chartCanvas.height).data;
    for (const token of seriesTokens) {
      const expected = normalized(getComputedStyle(scope).getPropertyValue(token).trim());
      expect(hasColor(pixels, expected), `Stacked bars paint ${token} (${theme})`).toBe(true);
    }

    const lastWeek = within(rangeGroup).getByRole("button", { name: "Last week" });
    lastWeek.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(lastWeek).toHaveAttribute("aria-pressed", "true"));
    await userEvent.click(chart.getByRole("tab", { name: "Values" }));
    const table = chart.getByRole("table");
    expect(within(table).getAllByRole("rowheader").map((header) => header.textContent)).toEqual(modelUsageLabels.slice(-7));
    expect(doc.documentElement.scrollWidth, "The values table stays inside its region").toBeLessThanOrEqual(args.width);
  },
} satisfies Meta<ContractArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function hasColor(pixels: Uint8ClampedArray, expected: number[]): boolean {
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3]! < 200) continue;
    if (expected.every((channel, offset) => Math.abs(pixels[index + offset]! - channel) <= 4)) return true;
  }
  return false;
}

export const PhoneLight: Story = { args: { width: 390 }, globals: { theme: "light" } };
export const PhoneDark: Story = { ...PhoneLight, globals: { theme: "dark" } };
export const DesktopLight: Story = { args: { width: 1440 }, globals: { theme: "light" } };
export const DesktopDark: Story = { ...DesktopLight, globals: { theme: "dark" } };
