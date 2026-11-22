import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { MultiSeriesLineChart, type ChartSeries } from "../charts";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weeklyUsage: ChartSeries[] = [
  { id: "api", label: "API calls", values: [58, 64, 69, 73, 82, 76, 91] },
  { id: "storage", label: "Storage", values: [35, 38, 42, 44, 48, 51, 55] },
  { id: "compute", label: "Compute", values: [72, 68, 75, 79, 71, 83, 88] },
];
const denseUsage: ChartSeries[] = [
  ...weeklyUsage,
  { id: "bandwidth", label: "Bandwidth", values: [24, 29, 31, 36, 42, 39, 47] },
  { id: "builds", label: "Build minutes", values: [12, 18, 15, 22, 26, 31, 28] },
];
const seriesTokens = Array.from({ length: 5 }, (_, index) => `--color-ui-series-${index + 1}`);

type ContractArgs = { width: 390 | 1440; dense: boolean };

const meta = {
  title: "Foundations/Multi-series line chart contract",
  tags: ["!dev", "!autodocs"],
  parameters: { layout: "fullscreen" },
  args: { width: 390, dense: false },
  render: ({ dense }) => (
    <section data-theme="light" aria-label="Multi-series chart contract" className="min-h-screen bg-ui-background p-4 text-ui-foreground">
      <div className="mx-auto w-full max-w-[1440px]">
        <button type="button" data-testid="focus-parking">Focus start</button>
        <MultiSeriesLineChart
          className="mt-4 w-full"
          labels={weekdays}
          series={dense ? denseUsage : weeklyUsage}
          xLabel="Day"
          yLabel="Allowance used"
          unit="%"
          min={0}
          max={100}
          tableCaption={dense ? "Dense weekly usage values" : "Weekly usage values"}
          ariaLabel={dense ? "Five weekly usage allowances" : "Three weekly usage allowances"}
        />
      </div>
    </section>
  ),
  play: async ({ canvasElement, args, globals }) => {
    // Vitest's browser platform is available only in browser-run story tests.
    const { page } = await import("@vitest/browser/context");
    const theme = globals.theme === "dark" ? "dark" : "light";
    const scope = within(canvasElement).getByRole("region", { name: "Multi-series chart contract" });
    scope.dataset.theme = theme;
    await page.viewport(args.width, 844);

    const doc = canvasElement.ownerDocument;
    expect(doc.documentElement.clientWidth).toBe(args.width);
    expect(doc.documentElement.scrollWidth, "The chart must not create page-level horizontal overflow").toBeLessThanOrEqual(args.width);
    const chart = within(scope);
    const count = args.dense ? 5 : 3;
    const tokens = seriesTokens.slice(0, count);
    const series = args.dense ? denseUsage : weeklyUsage;
    const tablist = chart.getByRole("tablist");
    const group = tablist.parentElement!;
    const groupStyle = getComputedStyle(group);
    const groupInnerWidth = group.clientWidth - Number.parseFloat(groupStyle.paddingLeft) - Number.parseFloat(groupStyle.paddingRight);
    expect(Math.abs(tablist.getBoundingClientRect().width - groupInnerWidth), "The tab group fills its content width").toBeLessThanOrEqual(1);

    const graphTab = chart.getByRole("tab", { name: "Graph" });
    const valuesTab = chart.getByRole("tab", { name: "Values" });
    expect(Math.abs(graphTab.getBoundingClientRect().width - valuesTab.getBoundingClientRect().width), "Tabs have equal widths").toBeLessThanOrEqual(1);
    expect(getComputedStyle(graphTab).borderBottomWidth, "Tabs have no selected underline").toBe("0px");
    expect(Number.parseInt(getComputedStyle(graphTab).fontWeight, 10), "The selected tab is bold").toBeGreaterThanOrEqual(600);

    const legend = chart.getByRole("list", { name: "Series" });
    const legendItems = within(legend).getAllByRole("listitem");
    expect(legendItems.map((item) => item.textContent)).toEqual(series.map((item) => item.label));
    const legendRect = legend.getBoundingClientRect();
    const scopeRect = scope.getBoundingClientRect();
    const itemRects = legendItems.map((item) => item.getBoundingClientRect());
    for (const rect of itemRects) {
      expect(rect.left).toBeGreaterThanOrEqual(scopeRect.left);
      expect(rect.right).toBeLessThanOrEqual(scopeRect.right);
      expect(rect.top).toBeGreaterThanOrEqual(legendRect.top);
      expect(rect.bottom).toBeLessThanOrEqual(legendRect.bottom);
    }
    for (let index = 0; index < itemRects.length; index++) {
      for (let otherIndex = index + 1; otherIndex < itemRects.length; otherIndex++) {
        const left = itemRects[index]!;
        const right = itemRects[otherIndex]!;
        const verticalOverlap = left.top < right.bottom && right.top < left.bottom;
        if (verticalOverlap) expect(left.right).toBeLessThanOrEqual(right.left);
      }
    }

    const colorCanvas = doc.createElement("canvas");
    const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
    if (!colorContext) throw new Error("Canvas color normalization is unavailable");
    const normalized = (value: string) => {
      colorContext.fillStyle = value;
      colorContext.fillRect(0, 0, 1, 1);
      return Array.from(colorContext.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const expectedColors = tokens.map((token) => {
      const value = getComputedStyle(scope).getPropertyValue(token).trim();
      expect(value, `The ${token} theme token is available`).not.toBe("");
      return normalized(value);
    });
    const foreground = normalized(getComputedStyle(scope).getPropertyValue("--color-ui-foreground").trim());
    for (let index = 0; index < count; index++) {
      const swatch = legendItems[index]!.querySelector<HTMLElement>("[data-ui-chart-series-swatch]")!;
      expect(normalized(getComputedStyle(swatch).backgroundColor), `${theme} legend color ${tokens[index]}`).toEqual(expectedColors[index]);
      expect(normalized(getComputedStyle(legendItems[index]!).color), `${theme} legend label foreground`).toEqual(foreground);
    }

    const parking = chart.getByTestId("focus-parking");
    parking.focus();
    await userEvent.tab();
    await expect(graphTab).toHaveFocus();
    expect(graphTab.matches(":focus-visible")).toBe(true);
    await waitFor(async () => {
      const animations = graphTab.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
      await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    });
    expectInsideTabFocus(graphTab, normalized(getComputedStyle(scope).getPropertyValue("--color-ui-on-accent").trim()));

    const chartCanvas = scope.querySelector<HTMLCanvasElement>("[data-ui-chart] canvas")!;
    const canvasBounds = chartCanvas.getBoundingClientRect();
    expect(canvasBounds.width).toBeGreaterThanOrEqual(200);
    expect(canvasBounds.height).toBeGreaterThanOrEqual(150);
    const context = chartCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("The chart canvas context is unavailable");
    const pixels = context.getImageData(0, 0, chartCanvas.width, chartCanvas.height).data;
    for (let index = 0; index < count; index++) {
      expect(hasColor(pixels, expectedColors[index]!), `Canvas pixels contain ${tokens[index]} (${theme})`).toBe(true);
    }

    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(valuesTab).toHaveAttribute("aria-selected", "true"));
    expect(Number.parseInt(getComputedStyle(valuesTab).fontWeight, 10), "The selected Values tab is bold").toBeGreaterThanOrEqual(600);
    const table = chart.getByRole("table");
    expect(within(table).getByText(args.dense ? "Dense weekly usage values" : "Weekly usage values")).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Day", ...series.map((item) => item.label)]);
    expect(within(table).getAllByRole("rowheader").map((header) => header.textContent)).toEqual(weekdays);
    for (let column = 0; column < count; column++) {
      const header = within(table).getAllByRole("columnheader")[column + 1]!;
      const swatch = header.querySelector<HTMLElement>("[data-ui-chart-series-swatch]")!;
      expect(normalized(getComputedStyle(swatch).backgroundColor), `${theme} table header color ${tokens[column]}`).toEqual(expectedColors[column]);
      const cells = within(table).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[column]!.textContent);
      expect(cells).toEqual(series[column]!.values.map((value) => `${value}%`));
    }

    if (args.dense && args.width === 390) {
      const scroll = scope.querySelector<HTMLElement>("[data-ui-chart-values-scroll]")!;
      expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    }
    expect(doc.documentElement.scrollWidth, "Scrollable table content stays inside its region").toBeLessThanOrEqual(args.width);
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(graphTab).toHaveAttribute("aria-selected", "true"));
    await expect(chartCanvas).toBeVisible();
    expect(chartCanvas.getBoundingClientRect().width).toBeGreaterThanOrEqual(200);
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

function expectInsideTabFocus(tab: HTMLElement, expectedAccent: number[]) {
  const style = getComputedStyle(tab);
  const insetShadow = style.boxShadow.split(/,(?![^()]*\))/).some((shadow) => {
    const lengths = (shadow.replace(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/g) ?? []).map(Number.parseFloat);
    return shadow.includes("inset") && lengths[0] === 0 && lengths[1] === 0 && lengths[2] === 0 && lengths[3] === 2;
  });
  const insideOutline = style.outlineWidth === "2px" && Number.parseFloat(style.outlineOffset) <= -2;
  expect(insetShadow || insideOutline, "Keyboard focus has a 2px inside accent edge").toBe(true);
  expect(style.outlineStyle === "none" || Number.parseFloat(style.outlineOffset) + Number.parseFloat(style.outlineWidth) <= 0, "No floating outside focus ring").toBe(true);
  const colorCanvas = document.createElement("canvas");
  const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
  if (!colorContext) throw new Error("Canvas color normalization is unavailable");
  const normalizedPaint = (paint: string) => {
    colorContext.fillStyle = paint;
    colorContext.fillRect(0, 0, 1, 1);
    return Array.from(colorContext.getImageData(0, 0, 1, 1).data.slice(0, 3));
  };
  const paintedColors = [
    style.borderTopColor,
    style.borderRightColor,
    style.borderBottomColor,
    style.borderLeftColor,
    style.outlineColor,
    ...Array.from(style.boxShadow.matchAll(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/g), (match) => match[0]),
  ];
  expect(paintedColors.some((paint) => normalizedPaint(paint).every((channel, index) => Math.abs(channel - expectedAccent[index]!) <= 4)), "The inside focus edge uses the accent color").toBe(true);
  for (const shadow of style.boxShadow.split(/,(?![^()]*\))/)) {
    if (!shadow || shadow === "none" || shadow.includes("inset")) continue;
    const lengths = (shadow.replace(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/g) ?? []).map(Number.parseFloat);
    expect(lengths.every((length) => length === 0), `No floating outer shadow: ${shadow}`).toBe(true);
  }
}

export const WeeklyPhoneLight: Story = { args: { width: 390, dense: false }, globals: { theme: "light" } };
export const WeeklyPhoneDark: Story = { ...WeeklyPhoneLight, globals: { theme: "dark" } };
export const WeeklyDesktopLight: Story = { args: { width: 1440, dense: false }, globals: { theme: "light" } };
export const WeeklyDesktopDark: Story = { ...WeeklyDesktopLight, globals: { theme: "dark" } };
export const DensePhoneLight: Story = { args: { width: 390, dense: true }, globals: { theme: "light" } };
export const DensePhoneDark: Story = { ...DensePhoneLight, globals: { theme: "dark" } };
export const DenseDesktopLight: Story = { args: { width: 1440, dense: true }, globals: { theme: "light" } };
export const DenseDesktopDark: Story = { ...DenseDesktopLight, globals: { theme: "dark" } };
