import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Badge } from "./Badge";
import { Button } from "./Button";

const families = ["blue", "amber", "green", "violet", "rose", "olive", "cyan", "magenta", "copper", "pearl"] as const;
const dark700Families = ["blue", "amber", "violet", "rose", "magenta", "pearl", "copper"] as const;
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
      {families.map((family) => <i key={family} data-testid={`family-${family}`} />)}
      {Array.from({ length: 10 }, (_, index) => <i key={index} data-testid={`series-${index + 1}`} />)}
    </div>
  );
}

const meta = {
  title: "Foundations/Palette tokens contract",
  component: PaletteProbe,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PaletteProbe>;

export default meta;
type Story = StoryObj<typeof meta>;

function sampledColor(color: string): string {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${red}, ${green}, ${blue})`;
}

function colorValue(style: CSSStyleDeclaration, token: string): string {
  const value = style.getPropertyValue(token).trim();
  expect(value, `Expected ${token} to be present`).not.toBe("");
  return sampledColor(value);
}

function luminance(value: string): number {
  const channels = value.match(/\d+/g)!.slice(0, 3).map((channel) => Number(channel) / 255);
  return channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

function hue(value: string): number {
  const channels = value.match(/\d+/g)!.slice(0, 3).map((channel) => Number(channel) / 255);
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

export const ComputedBrowserTokens: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => <><section className="bg-ui-background text-ui-foreground" data-theme="light"><PaletteProbe /></section><section className="bg-ui-background text-ui-foreground" data-theme="dark"><PaletteProbe /></section></>,
  play: async ({ canvasElement }) => {
    for (const theme of ["light", "dark"] as const) {
      const section = canvasElement.querySelector<HTMLElement>(`[data-theme="${theme}"]`)!;
      const style = getComputedStyle(section);
      const root = section.querySelector<HTMLElement>("[data-testid='palette-probe']")!;
      const withinRoot = within(root);
      for (const family of families) expect(colorValue(style, `--ui-palette-${family}-650`), `${theme} ${family}-650`).not.toBe("");
      for (const family of dark700Families) expect(colorValue(style, `--ui-palette-${family}-700`), `${theme} ${family}-700`).not.toBe("");
      for (let index = 1; index <= 10; index++) {
        const seriesColor = colorValue(style, `--ui-series-${index}`);
        expect(seriesColor, `${theme} series ${index}`).not.toBe("");
        expect(seriesColor).toBe(sampledColor((theme === "light" ? lightSeries : darkSeries)[index - 1]!));
      }

      expect(colorValue(style, "--ui-accent")).toBe(sampledColor("#50956f"));
      expect(colorValue(style, "--ui-accent-hover")).toBe(sampledColor("#6ba181"));
      expect(colorValue(style, "--ui-accent-hover")).toBe(colorValue(style, "--ui-palette-green-600"));
      expect(colorValue(style, "--ui-accent-link")).toBe(colorValue(style, `--ui-palette-green-${theme === "light" ? "750" : "600"}`));
      if (theme === "light") expect(colorValue(style, "--ui-accent-link")).toBe(sampledColor("#3d7053"));
      for (const token of ["--ui-accent", "--ui-accent-hover", "--ui-accent-link"]) {
        expect(hue(colorValue(style, token)), `${theme} ${token} must not be cyan or teal`).toBeLessThan(165);
      }

      const background = colorValue(style, "--ui-background");
      const surface = colorValue(style, "--ui-surface");
      for (const status of statuses) {
        const ink = colorValue(style, `--ui-${status}-ink`);
        const fill = colorValue(style, `--ui-${status}-fill`);
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
        expect(colorValue(style, `--ui-${status}-ink`)).toBe(colorValue(style, `--ui-palette-${family}-${theme === "light" ? "750" : "600"}`));
        expect(colorValue(style, `--ui-${status}-fill`)).toBe(colorValue(style, `--ui-palette-${family}-${theme === "light" ? "50" : "950"}`));
      }
      expect(colorValue(style, "--ui-danger")).toBe(sampledColor(theme === "light" ? "#b2403d" : "#c04c48"));

      const primary = withinRoot.getByRole("button", { name: "Primary action" });
      expect(sampledColor(getComputedStyle(primary).backgroundColor)).toBe(colorValue(style, "--ui-accent"));
      const dangerStyle = getComputedStyle(withinRoot.getByRole("button", { name: "Delete" }));
      expect(["transparent", "rgba(0, 0, 0, 0)", surface]).toContain(dangerStyle.backgroundColor);
      expect(sampledColor(dangerStyle.borderColor)).toBe(colorValue(style, "--ui-danger-ink"));
      expect(sampledColor(dangerStyle.color)).toBe(colorValue(style, "--ui-danger-ink"));
      expect(withinRoot.getByRole("button", { name: "Delete disabled" })).toBeDisabled();
      expect(sampledColor(getComputedStyle(withinRoot.getByTestId("accent-text")).color)).toBe(colorValue(style, "--ui-accent-link"));
      expect(sampledColor(getComputedStyle(withinRoot.getByTestId("danger-text")).color)).toBe(colorValue(style, "--ui-danger-ink"));
    }
  },
};
