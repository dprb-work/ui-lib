import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { Switch } from "./BinaryControls";
import { ColorSelector } from "./ColorSelector";

const themes = ["light", "dark"] as const;
const palettes = ["light", "dark"] as const;
const widths = [390, 1440] as const;
const swatchColors = ["#4c88c5", "#aa7a35"] as const;

type Theme = (typeof themes)[number];

type ProbeProps = { theme: Theme };

function SwitchProbe({ theme }: ProbeProps) {
  const [enabled, setEnabled] = useState(false);
  return (
    <section data-theme={theme} aria-label={`${theme} switch forced colors`} className="grid w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <button type="button">Keyboard start</button>
      <Switch label={`${theme} feature`} checked={enabled} onCheckedChange={setEnabled} />
    </section>
  );
}

function SwatchProbe({ theme }: ProbeProps) {
  const [colors, setColors] = useState<string[]>([...swatchColors]);
  return (
    <section data-theme={theme} aria-label={`${theme} swatches forced colors`} className="grid w-full gap-4 bg-ui-background p-4 text-sm text-ui-foreground">
      <button type="button">Keyboard start</button>
      <ColorSelector
        label={`${theme} data color`}
        colors={colors}
        onValueChange={(index, value) => setColors((current) => current.map((color, slot) => slot === index ? value : color))}
      />
    </section>
  );
}

function BothThemes({ kind }: { kind: "switch" | "swatches" }) {
  return <>{themes.map((theme) => kind === "switch" ? <SwitchProbe key={theme} theme={theme} /> : <SwatchProbe key={theme} theme={theme} />)}</>;
}

const meta = {
  title: "Foundations/Forced colors contract",
  component: BothThemes,
  args: { kind: "switch" },
  tags: ["!dev", "!autodocs"],
  globals: { theme: "light" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof BothThemes>;

export default meta;
type Story = StoryObj<typeof meta>;

async function emulateForcedPalette(palette: (typeof palettes)[number]) {
  // Browser APIs exist only in Vitest's browser runner, not Storybook's ordinary story runtime.
  const { cdp } = await import("@vitest/browser/context");
  await cdp().send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-color-scheme", value: palette },
    ],
  });
}
async function clearForcedPalette() {
  // CDP media emulation applies to the shared page, beyond the isolated Storybook test iframe.
  const { cdp } = await import("@vitest/browser/context");
  await cdp().send("Emulation.setEmulatedMedia", { media: "", features: [] });
}

async function viewport(width: (typeof widths)[number]) {
  // Browser APIs exist only in Vitest's browser runner, not Storybook's ordinary story runtime.
  const { page } = await import("@vitest/browser/context");
  await page.viewport(width, 844);
}

function rgba(value: string): number[] {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas color normalization is unavailable");
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data);
}

function paint(element: Element, property: "backgroundColor" | "color" = "backgroundColor"): number[] {
  return rgba(getComputedStyle(element)[property]);
}

function paintDistance(left: number[], right: number[]): number {
  return Math.hypot(...left.slice(0, 3).map((channel, index) => channel - right[index]!));
}

function luminance(channels: number[]): number {
  return channels.slice(0, 3).map((channel) => {
    const linear = channel / 255;
    return linear <= 0.04045 ? linear / 12.92 : ((linear + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrast(left: number[], right: number[]): number {
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

type FocusPaint = {
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  outlineOffset: string;
  boxShadow: string;
  borders: { width: string; color: string }[];
};

function focusPaint(control: HTMLElement): FocusPaint {
  const style = getComputedStyle(control);
  return {
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth,
    outlineColor: style.outlineColor,
    outlineOffset: style.outlineOffset,
    boxShadow: style.boxShadow,
    borders: ["top", "right", "bottom", "left"].map((side) => ({
      width: style.getPropertyValue(`border-${side}-width`),
      color: style.getPropertyValue(`border-${side}-color`),
    })),
  };
}

function hasVisibleFocusCue(control: HTMLElement, resting: FocusPaint) {
  const focused = focusPaint(control);
  const fill = paint(control);
  const restingOutline = [resting.outlineStyle, resting.outlineWidth, resting.outlineColor, resting.outlineOffset].join("|");
  const focusedOutline = [focused.outlineStyle, focused.outlineWidth, focused.outlineColor, focused.outlineOffset].join("|");
  const outline = focused.outlineStyle !== "none"
    && Number.parseFloat(focused.outlineWidth) > 0
    && rgba(focused.outlineColor)[3]! > 0
    && contrast(rgba(focused.outlineColor), fill) >= 3
    && focusedOutline !== restingOutline;
  const border = focused.borders.some((edge, index) => {
    const old = resting.borders[index]!;
    return Number.parseFloat(edge.width) > 0 && edge.width !== old.width && edge.color !== old.color
      && rgba(edge.color)[3]! > 0 && contrast(rgba(edge.color), fill) >= 3;
  });
  const shadow = focused.boxShadow !== "none" && focused.boxShadow !== resting.boxShadow
    && focused.boxShadow.split(/,(?![^()]*\))/).some((value) => {
      const color = value.match(/(?:rgba?|oklch|oklab|color|hsl|lab|lch)\([^)]*\)/)?.[0];
      return color !== undefined && rgba(color)[3]! > 0 && contrast(rgba(color), fill) >= 3;
    });
  expect(outline || border || shadow, "Keyboard focus must retain a visible cue against the rendered control").toBe(true);
}

async function keyboardFocus(element: HTMLElement, tabSteps = 1) {
  // Browser APIs exist only in Vitest's browser runner, not Storybook's ordinary story runtime.
  const { userEvent } = await import("@vitest/browser/context");
  const scope = element.closest<HTMLElement>("section");
  if (!scope) throw new Error("Keyboard focus probe must have a theme section");
  within(scope).getByRole("button", { name: "Keyboard start" }).focus();
  for (let step = 0; step < tabSteps; step += 1) await userEvent.tab();
  await expect(element).toHaveFocus();
  expect(element.matches(":focus-visible"), "The focus cue must be keyboard-visible").toBe(true);
}

function themeScope(canvasElement: HTMLElement, theme: Theme, kind: "switch" | "swatches"): HTMLElement {
  return within(canvasElement).getByRole("region", { name: `${theme} ${kind} forced colors` });
}

export const SwitchForcedColors: Story = {
  args: { kind: "switch" },
  play: async ({ canvasElement }) => {
    // Linux Chromium emulates the forced-colors media feature and its default system palette; it is not native Windows High Contrast.
    // Browser APIs exist only in Vitest's browser runner, not Storybook's ordinary story runtime.
    const { userEvent } = await import("@vitest/browser/context");
    try {
      for (const palette of palettes) {
        await emulateForcedPalette(palette);
        for (const width of widths) {
          await viewport(width);
          for (const theme of themes) {
            const control = within(themeScope(canvasElement, theme, "switch")).getByRole("switch", { name: `${theme} feature` });
            const thumb = control.firstElementChild;
            expect(thumb).not.toBeNull();
            control.blur();
            const resting = focusPaint(control);
            await keyboardFocus(control);
            for (const checked of [false, true, false]) {
              if (checked !== (control.getAttribute("aria-checked") === "true")) {
                await userEvent.keyboard(" ");
              }
              await expect(control).toHaveAttribute("aria-checked", String(checked));
              const trackPaint = paint(control);
              const thumbPaint = paint(thumb!);
              expect(paintDistance(trackPaint, thumbPaint), `Switch track and thumb remain visibly distinct (${palette} forced palette, ${theme} theme, ${width}px)`).toBeGreaterThan(1);
              await expect(control).toHaveFocus();
              expect(control.matches(":focus-visible")).toBe(true);
              hasVisibleFocusCue(control, resting);
              const bounds = thumb!.getBoundingClientRect();
              expect(bounds.width).toBeGreaterThan(0);
              expect(bounds.height).toBeGreaterThan(0);
            }
          }
        }
      }
    } finally {
      await clearForcedPalette();
    }
  },
};

export const SwatchesForcedColors: Story = {
  args: { kind: "swatches" },
  play: async ({ canvasElement }) => {
    // Linux Chromium emulates the forced-colors media feature and its default system palette; it is not native Windows High Contrast.
    // Browser APIs exist only in Vitest's browser runner, not Storybook's ordinary story runtime.
    const { userEvent } = await import("@vitest/browser/context");
    try {
      for (const palette of palettes) {
        await emulateForcedPalette(palette);
        for (const width of widths) {
          await viewport(width);
          for (const theme of themes) {
            const canvas = within(themeScope(canvasElement, theme, "swatches"));
            const controls = swatchColors.map((_, index) => canvas.getByRole("button", { name: `${theme} data color ${index + 1}` }));
            const paints = controls.map((control) => paint(control));
            expect(paintDistance(paints[0]!, paints[1]!), `Data swatches remain distinct (${palette} forced palette, ${theme} theme, ${width}px)`).toBeGreaterThan(1);
            for (const [index, control] of controls.entries()) {
              const resting = focusPaint(control);
              await keyboardFocus(control, index + 1);
              await expect(control).toHaveFocus();
              expect(control.matches(":focus-visible")).toBe(true);
              hasVisibleFocusCue(control, resting);
              expect(paint(control)).toEqual(rgba(swatchColors[index]!));
              await userEvent.click(control);
              const dialog = await within(document.body).findByRole("dialog", { name: `${theme} data color ${index + 1} picker` });
              await expect(dialog).toBeVisible();
              await userEvent.keyboard("{Escape}");
              await waitFor(() => expect(control).toHaveFocus());
              await expect(dialog).not.toBeInTheDocument();
              expect(paint(control)).toEqual(rgba(swatchColors[index]!));
            }
          }
        }
      }
    } finally {
      await clearForcedPalette();
    }
  },
};
