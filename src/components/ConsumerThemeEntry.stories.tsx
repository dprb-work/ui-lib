import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

const meta = {
  title: "Foundations/Consumer theme entry contract",
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
  const actualBytes = colorBytes(actual);
  const expectedBytes = colorBytes(expected);
  for (let channel = 0; channel < 4; channel++) {
    // Allow one byte for color-mix's color-space conversion and alpha rounding.
    expect(Math.abs(actualBytes[channel]! - expectedBytes[channel]!)).toBeLessThanOrEqual(1);
  }
}

function colorProbe(document: Document, className: string): HTMLDivElement {
  const probe = document.createElement("div");
  probe.className = className;
  probe.setAttribute("aria-hidden", "true");
  return probe;
}

export const GeneratesConsumerUtilitiesFromPackageReference: Story = {
  tags: ["!dev", "!autodocs"],
  render: () => <div data-testid="consumer-host" />,
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument;
    const root = document.documentElement;
    const previousStyle = root.style.cssText;
    const previousTheme = root.getAttribute("data-theme");
    const previousDark = root.classList.contains("dark");
    const host = within(canvasElement).getByTestId("consumer-host");
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    const surface = colorProbe(document, "bg-ui-surface/75");
    const palette = colorProbe(document, "bg-ui-palette-blue-650/60");
    const series = colorProbe(document, "bg-ui-series-1/80");
    const accentText = colorProbe(document, "text-ui-accent");
    const dangerText = colorProbe(document, "text-ui-danger");
    const variant = colorProbe(document, "bg-ui-surface/75 data-[consumer=selected]:bg-ui-series-2/50");
    const plainSurface = colorProbe(document, "");
    plainSurface.style.backgroundColor = "var(--color-ui-surface)";
    const plainAccent = colorProbe(document, "");
    plainAccent.style.color = "var(--color-ui-accent-link)";
    const gap = document.createElement("div");
    gap.className = "flex gap-ui-icon-text";
    const icon = document.createElement("span");
    icon.style.width = "16px";
    icon.style.height = "16px";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = "Consumer label";
    gap.append(icon, label);
    shadow.replaceChildren(surface, palette, series, accentText, dangerText, variant, plainSurface, plainAccent, gap);
    try {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      // Global library utilities must not supply this consumer's generated CSS.
      expectColor(getComputedStyle(surface).backgroundColor, "transparent");
      expect(getComputedStyle(gap).display).toBe("block");

      // Intentional module-loading test: a static import would prevent discovery
      // instead of reporting the missing public CSS export within this story.
      // Vite/Tailwind compiles the fixture without any copied theme mappings.
      const { default: consumerCss } = await import("../test/fixtures/consumer-theme.css?inline");
      const stylesheet = document.createElement("style");
      stylesheet.textContent = consumerCss;
      shadow.prepend(stylesheet);

      const rem = Number.parseFloat(getComputedStyle(root).fontSize);
      for (const theme of ["light", "dark", "light"]) {
        root.setAttribute("data-theme", theme);
        expectColor(getComputedStyle(surface).backgroundColor, theme === "light" ? "rgb(255 255 255 / 75%)" : "rgb(10 17 31 / 75%)");
        expectColor(getComputedStyle(palette).backgroundColor, "rgb(76 136 197 / 60%)");
        expectColor(getComputedStyle(series).backgroundColor, theme === "light" ? "rgb(76 136 197 / 80%)" : "rgb(57 122 185 / 80%)");
        expectColor(getComputedStyle(accentText).color, theme === "light" ? "#3d7053" : "#6ba181");
        expectColor(getComputedStyle(dangerText).color, theme === "light" ? "#b2403d" : "#dc655f");
        expectColor(getComputedStyle(plainSurface).backgroundColor, theme === "light" ? "#ffffff" : "#0a111f");
        expectColor(getComputedStyle(plainAccent).color, getComputedStyle(accentText).color);
        expect(getComputedStyle(gap).display).toBe("flex");
        expect(Math.abs(label.getBoundingClientRect().left - icon.getBoundingClientRect().right - rem * 0.375)).toBeLessThanOrEqual(0.5);
        expectColor(getComputedStyle(variant).backgroundColor, getComputedStyle(surface).backgroundColor);
        variant.setAttribute("data-consumer", "selected");
        expectColor(getComputedStyle(variant).backgroundColor, theme === "light" ? "rgb(170 122 53 / 50%)" : "rgb(155 107 41 / 50%)");
        variant.removeAttribute("data-consumer");
      }

      root.style.setProperty("--color-ui-surface", "#284c70");
      root.style.setProperty("--color-ui-accent-link", "#553080");
      root.style.setProperty("--color-ui-danger-ink", "#96354b");
      root.style.setProperty("--color-ui-palette-blue-650", "#2e7594");
      root.style.setProperty("--color-ui-series-1", "#3b758d");
      root.style.setProperty("--spacing-ui-icon-text", "11px");
      for (const theme of ["light", "dark"]) {
        root.setAttribute("data-theme", theme);
        expectColor(getComputedStyle(surface).backgroundColor, "rgb(40 76 112 / 75%)");
        expectColor(getComputedStyle(palette).backgroundColor, "rgb(46 117 148 / 60%)");
        expectColor(getComputedStyle(series).backgroundColor, "rgb(59 117 141 / 80%)");
        expectColor(getComputedStyle(accentText).color, "#553080");
        expectColor(getComputedStyle(dangerText).color, "#96354b");
        expectColor(getComputedStyle(plainSurface).backgroundColor, "#284c70");
        expectColor(getComputedStyle(plainAccent).color, getComputedStyle(accentText).color);
        expect(Math.abs(label.getBoundingClientRect().left - icon.getBoundingClientRect().right - 11)).toBeLessThanOrEqual(0.5);
      }
    } finally {
      shadow.replaceChildren();
      root.style.cssText = previousStyle;
      if (previousTheme === null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", previousTheme);
      root.classList.toggle("dark", previousDark);
    }
  },
};
