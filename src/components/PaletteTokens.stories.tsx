import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Badge } from "./Badge";
import { Button } from "./Button";

const rolePaints = [
  ["background", "bg-ui-background", "#f8fafc", "#000310"],
  ["foreground", "bg-ui-foreground", "#0f172a", "#e2e8f0"],
  ["surface", "bg-ui-surface", "#ffffff", "#0a111f"],
  ["surface-foreground", "bg-ui-surface-foreground", "#0f172a", "#e2e8f0"],
  ["muted", "bg-ui-muted", "#f1f5f9", "#1e293b"],
  ["muted-foreground", "bg-ui-muted-foreground", "#475569", "#94a3b8"],
  ["border", "bg-ui-border", "#cbd5e1", "#334155"],
  ["tooltip", "bg-ui-tooltip", "#f1f5f9", "#1e293b"],
  ["tooltip-foreground", "bg-ui-tooltip-foreground", "#0f172a", "#e2e8f0"],
  ["accent", "bg-ui-accent", "#50956f", "#50956f"],
  ["accent-hover", "bg-ui-accent-hover", "#6ba181", "#6ba181"],
  ["accent-link", "bg-ui-accent-link", "#3d7053", "#6ba181"],
  ["on-accent", "bg-ui-on-accent", "#0f172a", "#0f172a"],
  ["success", "bg-ui-success", "#3d7053", "#6ba181"],
  ["success-ink", "bg-ui-success-ink", "#3d7053", "#6ba181"],
  ["success-fill", "bg-ui-success-fill", "oklch(0.9813 0.012407 164.808)", "oklch(0.243201 0.033535 161.816)"],
  ["warning-ink", "bg-ui-warning-ink", "#7e5c31", "#b48a52"],
  ["warning-fill", "bg-ui-warning-fill", "oklch(0.9813 0.017508 81.333)", "oklch(0.243201 0.02511 74.276)"],
  ["info-ink", "bg-ui-info-ink", "#3d6793", "#6697c9"],
  ["info-fill", "bg-ui-info-fill", "oklch(0.9813 0.009149 250)", "oklch(0.243201 0.03 250)"],
  ["danger", "bg-ui-danger", "#b2403d", "#c04c48"],
  ["danger-hover", "bg-ui-danger-hover", "#a53332", "#b64340"],
  ["on-danger", "bg-ui-on-danger", "#ffffff", "#ffffff"],
  ["danger-ink", "bg-ui-danger-ink", "#b2403d", "#dc655f"],
  ["danger-fill", "bg-ui-danger-fill", "#fceae8", "#321a18"],
] as const;
const palettePaints = [
  ["blue-50", "bg-ui-palette-blue-50", "oklch(0.9813 0.009149 250)"],
  ["blue-600", "bg-ui-palette-blue-600", "#6697c9"],
  ["blue-650", "bg-ui-palette-blue-650", "#4c88c5"],
  ["blue-700", "bg-ui-palette-blue-700", "#397ab9"],
  ["blue-750", "bg-ui-palette-blue-750", "#3d6793"],
  ["blue-950", "bg-ui-palette-blue-950", "oklch(0.243201 0.03 250)"],
  ["amber-50", "bg-ui-palette-amber-50", "oklch(0.9813 0.017508 81.333)"],
  ["amber-600", "bg-ui-palette-amber-600", "#b48a52"],
  ["amber-650", "bg-ui-palette-amber-650", "#aa7a35"],
  ["amber-700", "bg-ui-palette-amber-700", "#9b6b29"],
  ["amber-750", "bg-ui-palette-amber-750", "#7e5c31"],
  ["amber-950", "bg-ui-palette-amber-950", "oklch(0.243201 0.02511 74.276)"],
  ["green-50", "bg-ui-palette-green-50", "oklch(0.9813 0.012407 164.808)"],
  ["green-600", "bg-ui-palette-green-600", "#6ba181"],
  ["green-650", "bg-ui-palette-green-650", "#50956f"],
  ["green-750", "bg-ui-palette-green-750", "#3d7053"],
  ["green-950", "bg-ui-palette-green-950", "oklch(0.243201 0.033535 161.816)"],
  ["violet-650", "bg-ui-palette-violet-650", "#8c74c0"],
  ["violet-700", "bg-ui-palette-violet-700", "#8066b1"],
  ["rose-650", "bg-ui-palette-rose-650", "#aa737b"],
  ["rose-700", "bg-ui-palette-rose-700", "#9b656d"],
  ["magenta-650", "bg-ui-palette-magenta-650", "#ae699f"],
  ["magenta-700", "bg-ui-palette-magenta-700", "#9f5a92"],
  ["olive-650", "bg-ui-palette-olive-650", "#828c34"],
  ["pearl-650", "bg-ui-palette-pearl-650", "#75869e"],
  ["pearl-700", "bg-ui-palette-pearl-700", "#657891"],
  ["copper-650", "bg-ui-palette-copper-650", "#be6a50"],
  ["copper-700", "bg-ui-palette-copper-700", "#b05b41"],
  ["cyan-650", "bg-ui-palette-cyan-650", "#49919f"],
] as const;
const seriesClasses = ["bg-ui-series-1", "bg-ui-series-2", "bg-ui-series-3", "bg-ui-series-4", "bg-ui-series-5", "bg-ui-series-6", "bg-ui-series-7", "bg-ui-series-8", "bg-ui-series-9", "bg-ui-series-10"] as const;
const lightSeries = ["#4c88c5", "#aa7a35", "#50956f", "#8c74c0", "#aa737b", "#828c34", "#49919f", "#ae699f", "#be6a50", "#75869e"] as const;
const darkSeries = ["#397ab9", "#9b6b29", "#50956f", "#8066b1", "#9b656d", "#828c34", "#49919f", "#9f5a92", "#b05b41", "#657891"] as const;
const statuses = ["success", "warning", "info", "danger"] as const;

function PaletteProbe() {
  return (
    <div data-testid="palette-probe">
      <Button>Primary action</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="danger" disabled>Delete disabled</Button>
      <span className="text-ui-accent" data-testid="accent-text">Accent text</span>
      <span className="text-ui-danger" data-testid="danger-text">Danger text</span>
      {statuses.map((status) => <Badge key={status} tone={status}>{status}</Badge>)}
      {rolePaints.map(([role, className]) => <ColorReaders key={role} token={`--color-ui-${role}`} className={className} />)}
      {palettePaints.map(([stop, className]) => <ColorReaders key={stop} token={`--color-ui-palette-${stop}`} className={className} />)}
      {seriesClasses.map((className, index) => <ColorReaders key={className} token={`--color-ui-series-${index + 1}`} className={className} />)}
    </div>
  );
}

function ColorReaders({ token, className }: { token: string; className: string }) {
  return (
    <span data-testid={token}>
      <i className={className} data-reader="utility" />
      <i style={{ backgroundColor: `var(${token})` }} data-reader="css" />
    </span>
  );
}

const meta = {
  title: "Foundations/Palette tokens contract",
  component: PaletteProbe,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PaletteProbe>;

export default meta;
type Story = StoryObj<typeof meta>;

function colorChannels(color: string): Uint8ClampedArray {
  expect(CSS.supports("color", color), `Expected a valid color: ${color}`).toBe(true);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data;
}

function sampledColor(color: string): string {
  const [red, green, blue] = colorChannels(color);
  return `rgb(${red}, ${green}, ${blue})`;
}

function colorValue(style: CSSStyleDeclaration, token: string): string {
  const value = style.getPropertyValue(token).trim();
  expect(value, `Expected ${token} to be present`).not.toBe("");
  return sampledColor(value);
}

function luminance(value: string): number {
  const channels = Array.from(colorChannels(value).slice(0, 3), (channel) => channel / 255);
  return channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

function hue(value: string): number {
  const channels = Array.from(colorChannels(value).slice(0, 3), (channel) => channel / 255);
  const [red, green, blue] = channels;
  const max = Math.max(red!, green!, blue!);
  const min = Math.min(red!, green!, blue!);
  const delta = max - min;
  if (delta === 0) return 0;
  const degrees = max === red ? 60 * (((green! - blue!) / delta) % 6) : max === green ? 60 * ((blue! - red!) / delta + 2) : 60 * ((red! - green!) / delta + 4);
  return (degrees + 360) % 360;
}

function expectRatio(foreground: string, background: string, minimum: number) {
  expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
}

function expectPaint(root: HTMLElement, token: string, expected: string) {
  const readers = within(root).getByTestId(token);
  for (const reader of readers.querySelectorAll<HTMLElement>("[data-reader]")) {
    expect(sampledColor(getComputedStyle(reader).backgroundColor), `${token} ${reader.dataset.reader}`).toBe(sampledColor(expected));
  }
}

export const ComputedBrowserTokens: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => <><section className="bg-ui-background text-ui-foreground" data-theme="light"><PaletteProbe /></section><section className="bg-ui-background text-ui-foreground" data-theme="dark"><PaletteProbe /></section></>,
  play: async ({ canvasElement }) => {
    for (const theme of ["light", "dark"] as const) {
      const section = canvasElement.querySelector<HTMLElement>(`[data-theme="${theme}"]`)!;
      const style = getComputedStyle(section);
      const root = section.querySelector<HTMLElement>("[data-testid='palette-probe']")!;
      const withinRoot = within(root);
      for (const [role, , light, dark] of rolePaints) {
        const token = `--color-ui-${role}`;
        const expected = theme === "light" ? light : dark;
        expect(colorValue(style, token), `${theme} ${token}`).toBe(sampledColor(expected));
        expectPaint(root, token, expected);
        expect(style.getPropertyValue(`--ui-${role}`).trim(), `Retired --ui-${role}`).toBe("");
      }
      for (const [stop, , expected] of palettePaints) {
        const token = `--color-ui-palette-${stop}`;
        expect(colorValue(style, token), `${theme} ${token}`).toBe(sampledColor(expected));
        expectPaint(root, token, expected);
        expect(style.getPropertyValue(`--ui-palette-${stop}`).trim()).toBe("");
      }
      for (let index = 1; index <= 10; index++) {
        const seriesColor = colorValue(style, `--color-ui-series-${index}`);
        const expected = (theme === "light" ? lightSeries : darkSeries)[index - 1]!;
        expect(seriesColor, `${theme} series ${index}`).toBe(sampledColor(expected));
        expectPaint(root, `--color-ui-series-${index}`, expected);
        expect(style.getPropertyValue(`--ui-series-${index}`).trim()).toBe("");
      }

      expect(colorValue(style, "--color-ui-accent")).toBe(sampledColor("#50956f"));
      expect(colorValue(style, "--color-ui-accent-hover")).toBe(sampledColor("#6ba181"));
      expect(colorValue(style, "--color-ui-accent-hover")).toBe(colorValue(style, "--color-ui-palette-green-600"));
      expect(colorValue(style, "--color-ui-accent-link")).toBe(colorValue(style, `--color-ui-palette-green-${theme === "light" ? "750" : "600"}`));
      if (theme === "light") expect(colorValue(style, "--color-ui-accent-link")).toBe(sampledColor("#3d7053"));
      for (const token of ["--color-ui-accent", "--color-ui-accent-hover", "--color-ui-accent-link"]) {
        expect(hue(colorValue(style, token)), `${theme} ${token} must not be cyan or teal`).toBeLessThan(165);
      }

      const background = colorValue(style, "--color-ui-background");
      const surface = colorValue(style, "--color-ui-surface");
      for (const status of statuses) {
        const ink = colorValue(style, `--color-ui-${status}-ink`);
        const fill = colorValue(style, `--color-ui-${status}-fill`);
        expectRatio(ink, fill, 4.5);
        expectRatio(ink, background, 4.5);
        expectRatio(ink, surface, 4.5);
        const badgeStyle = getComputedStyle(withinRoot.getByText(status));
        expect(sampledColor(badgeStyle.color)).toBe(ink);
        expect(sampledColor(badgeStyle.backgroundColor)).toBe(fill);
        expectRatio(sampledColor(badgeStyle.color), sampledColor(badgeStyle.backgroundColor), 4.5);
      }
      for (const status of ["success", "warning", "info"] as const) {
        const family = status === "success" ? "green" : status === "warning" ? "amber" : "blue";
        expect(colorValue(style, `--color-ui-${status}-ink`)).toBe(colorValue(style, `--color-ui-palette-${family}-${theme === "light" ? "750" : "600"}`));
        expect(colorValue(style, `--color-ui-${status}-fill`)).toBe(colorValue(style, `--color-ui-palette-${family}-${theme === "light" ? "50" : "950"}`));
      }
      expect(colorValue(style, "--color-ui-danger")).toBe(sampledColor(theme === "light" ? "#b2403d" : "#c04c48"));

      const primary = withinRoot.getByRole("button", { name: "Primary action" });
      expect(sampledColor(getComputedStyle(primary).backgroundColor)).toBe(colorValue(style, "--color-ui-accent"));
      const dangerStyle = getComputedStyle(withinRoot.getByRole("button", { name: "Delete" }));
      expect(["transparent", "rgba(0, 0, 0, 0)", surface]).toContain(dangerStyle.backgroundColor);
      expect(sampledColor(dangerStyle.borderColor)).toBe(colorValue(style, "--color-ui-danger-ink"));
      expect(sampledColor(dangerStyle.color)).toBe(colorValue(style, "--color-ui-danger-ink"));
      expect(withinRoot.getByRole("button", { name: "Delete disabled" })).toBeDisabled();
      expect(sampledColor(getComputedStyle(withinRoot.getByTestId("accent-text")).color)).toBe(colorValue(style, "--color-ui-accent-link"));
      expect(sampledColor(getComputedStyle(withinRoot.getByTestId("danger-text")).color)).toBe(colorValue(style, "--color-ui-danger-ink"));
    }
  },
};
