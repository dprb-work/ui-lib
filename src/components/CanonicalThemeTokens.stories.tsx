import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { CartesianChart } from "../charts";

const readers = [
  ["surface", "bg-ui-surface", "backgroundColor"],
  ["foreground", "text-ui-foreground", "color"],
  ["border", "border border-ui-border", "borderTopColor"],
  ["accent", "bg-ui-accent", "backgroundColor"],
  ["accent-link", "text-ui-accent", "color"],
  ["danger-ink", "text-ui-danger", "color"],
  ["series-1", "bg-ui-series-1", "backgroundColor"],
] as const;
const lightColors = ["#ffffff", "#0f172a", "#cbd5e1", "#50956f", "#3d7053", "#b2403d", "#4c88c5"] as const;
const darkColors = ["#0a111f", "#e2e8f0", "#334155", "#50956f", "#6ba181", "#dc655f", "#397ab9"] as const;
const rootColors = ["#e3e8ed", "#172b4d", "#62748a", "#7247a8", "#532780", "#941d40", "#456a9b"] as const;
const scopedColors = ["#232f45", "#f2e8db", "#8396b1", "#cc85dc", "#e2b5ed", "#fb9cb3", "#82b7d4"] as const;
const records = [{ label: "Sample", value: 75 }];

function TokenReaders() {
  return (
    <>
      {readers.map(([role, className, property]) => (
        <span key={role} data-testid={role} aria-hidden="true">
          <i data-reader="utility" className={className} />
          <i data-reader="css" style={{ [property]: `var(--color-ui-${role})` }} />
        </span>
      ))}
    </>
  );
}

const meta = {
  title: "Foundations/Canonical theme tokens contract",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function colorBytes(color: string): Uint8ClampedArray {
  expect(CSS.supports("color", color), `Expected a valid color: ${color}`).toBe(true);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data;
}

function expectColor(actual: string, expected: string) {
  expect(Array.from(colorBytes(actual))).toEqual(Array.from(colorBytes(expected)));
}

function expectReaders(container: HTMLElement, colors: readonly string[]) {
  for (const [index, [role, , property]] of readers.entries()) {
    const fixture = within(container).getByTestId(role);
    for (const kind of ["utility", "css"]) {
      const reader = fixture.querySelector<HTMLElement>(`[data-reader="${kind}"]`)!;
      expectColor(getComputedStyle(reader)[property], colors[index]!);
    }
  }
}

function restoreRoot(root: HTMLElement, style: string, theme: string | null, dark: boolean) {
  root.style.cssText = style;
  if (theme === null) root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", dark);
}

export const RuntimeRootAndScopedRoles: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => (
    <>
      <div data-testid="root-readers"><TokenReaders /></div>
      <section data-testid="scoped-readers" data-theme="dark"><TokenReaders /></section>
    </>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const previousStyle = root.style.cssText;
    const previousTheme = root.getAttribute("data-theme");
    const previousDark = root.classList.contains("dark");
    const unscoped = within(canvasElement).getByTestId("root-readers");
    const scoped = within(canvasElement).getByTestId("scoped-readers");
    try {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      expectReaders(unscoped, lightColors);
      expectReaders(scoped, darkColors);
      for (const [index, [role]] of readers.entries()) {
        root.style.setProperty(`--color-ui-${role}`, rootColors[index]!);
        scoped.style.setProperty(`--color-ui-${role}`, scopedColors[index]!);
      }
      for (const theme of ["light", "dark", "light"]) {
        root.setAttribute("data-theme", theme);
        expectReaders(unscoped, rootColors);
        expectReaders(scoped, scopedColors);
      }
      // Palette relationships are tested at their definition scope, not below it.
      root.style.removeProperty("--color-ui-accent");
      root.style.removeProperty("--color-ui-series-1");
      root.style.setProperty("--color-ui-palette-green-650", "#704baa");
      root.style.setProperty("--color-ui-palette-blue-650", "#537cac");
      root.style.setProperty("--color-ui-palette-blue-700", "#3d5f89");
      for (const theme of ["light", "dark"]) {
        root.setAttribute("data-theme", theme);
        expectReaders(unscoped, [
          ...rootColors.slice(0, 3), "#704baa", rootColors[4], rootColors[5], theme === "light" ? "#537cac" : "#3d5f89",
        ]);
        expectReaders(scoped, scopedColors);
      }
    } finally {
      scoped.removeAttribute("style");
      restoreRoot(root, previousStyle, previousTheme, previousDark);
    }
  },
};

export const RuntimeThemeSwitching: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => <div data-testid="theme-readers"><TokenReaders /></div>,
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const previousStyle = root.style.cssText;
    const previousTheme = root.getAttribute("data-theme");
    const previousDark = root.classList.contains("dark");
    const fixture = within(canvasElement).getByTestId("theme-readers");
    try {
      root.classList.remove("dark");
      for (const theme of ["light", "dark", "light"]) {
        root.setAttribute("data-theme", theme);
        expectReaders(fixture, theme === "light" ? lightColors : darkColors);
      }
      root.removeAttribute("data-theme");
      for (const dark of [false, true, false]) {
        root.classList.toggle("dark", dark);
        expectReaders(fixture, dark ? darkColors : lightColors);
      }
    } finally {
      restoreRoot(root, previousStyle, previousTheme, previousDark);
    }
  },
};

function matchingPixels(canvas: HTMLCanvasElement, color: string): number {
  const expected = colorBytes(color);
  const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset] === expected[0] && pixels[offset + 1] === expected[1] && pixels[offset + 2] === expected[2] && pixels[offset + 3] === 255) count++;
  }
  return count;
}

export const RootChartDefaultsAndNamedPalette: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => (
    <>
      <CartesianChart type="bar" records={records} min={0} max={100} xLabel="Sample" yLabel="Value" ariaLabel="Default palette" className="h-48 w-80" />
      <CartesianChart type="bar" records={records} min={0} max={100} xLabel="Sample" yLabel="Value" ariaLabel="Named palette" className="h-48 w-80" palette={{ accent: "--color-ui-series-1", grid: "--color-ui-series-2" }} />
    </>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    const previousStyle = root.style.cssText;
    const previousTheme = root.getAttribute("data-theme");
    const previousDark = root.classList.contains("dark");
    const defaultCanvas = within(canvasElement).getByRole("img", { name: "Default palette" }).querySelector("canvas")!;
    const namedCanvas = within(canvasElement).getByRole("img", { name: "Named palette" }).querySelector("canvas")!;
    try {
      root.classList.remove("dark");
      for (const theme of ["light", "dark", "light"]) {
        root.setAttribute("data-theme", theme);
        const style = getComputedStyle(root);
        for (const [chartRole, canonicalRole] of [["accent", "accent"], ["surface", "surface"], ["muted", "muted-foreground"], ["foreground", "foreground"]]) {
          expectColor(style.getPropertyValue(`--ui-chart-${chartRole}`).trim(), style.getPropertyValue(`--color-ui-${canonicalRole}`).trim());
        }
        await waitFor(() => {
          expect(matchingPixels(defaultCanvas, "#50956f")).toBeGreaterThan(100);
          expect(matchingPixels(defaultCanvas, theme === "light" ? "#cbd5e1" : "#334155")).toBeGreaterThan(0);
          expect(matchingPixels(namedCanvas, theme === "light" ? "#4c88c5" : "#397ab9")).toBeGreaterThan(100);
          expect(matchingPixels(namedCanvas, theme === "light" ? "#aa7a35" : "#9b6b29")).toBeGreaterThan(0);
        });
      }
      root.style.setProperty("--color-ui-accent", "#7648a3");
      root.style.setProperty("--color-ui-border", "#a24779");
      root.style.setProperty("--color-ui-series-1", "#3b7f8e");
      root.style.setProperty("--color-ui-series-2", "#b4763b");
      expectColor(getComputedStyle(root).getPropertyValue("--ui-chart-accent").trim(), "#7648a3");
      await waitFor(() => {
        expect(matchingPixels(defaultCanvas, "#7648a3")).toBeGreaterThan(100);
        expect(matchingPixels(defaultCanvas, "#a24779")).toBeGreaterThan(0);
        expect(matchingPixels(namedCanvas, "#3b7f8e")).toBeGreaterThan(100);
        expect(matchingPixels(namedCanvas, "#b4763b")).toBeGreaterThan(0);
      });
    } finally {
      restoreRoot(root, previousStyle, previousTheme, previousDark);
    }
  },
};
