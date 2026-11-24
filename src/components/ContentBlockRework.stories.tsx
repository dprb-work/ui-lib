import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { ChartOutput } from "../chat/content/ChartOutput";
import { CodeBlock } from "../chat/content/CodeBlock";
import catalogMeta, { Chart, Code, Table, UntitledShort } from "./ContentBlock.stories";

const CatalogChart = composeStory(Chart, catalogMeta);
const CatalogCode = composeStory(Code, catalogMeta);
const CatalogTable = composeStory(Table, catalogMeta);
const CatalogLog = composeStory(UntitledShort, catalogMeta);

const meta = {
  title: "Components/ContentBlock/Rework contract",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
  globals: { theme: "light" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const desktop = { width: 1440, height: 900 };
const narrow = { width: 390, height: 844 };
const edgeTolerance = 1;
const source = "alpha\nbeta\ngamma";
const manyPoints = Array.from({ length: 40 }, (_, index) => ({ label: `Service ${index + 1}`, value: index + 1 }));

async function viewport(size = desktop) {
  // Vitest browser APIs are unavailable in the ordinary Storybook runtime.
  const { page } = await import("@vitest/browser/context");
  await page.viewport(size.width, size.height);
  await waitFor(() => expect([innerWidth, innerHeight]).toEqual([size.width, size.height]));
}

async function settled(element: Element) {
  await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
  // A resize observer can update a fitted drawing after the dialog animation.
  // ES2022 has no Promise.withResolvers; wait for layout without a fixed sleep.
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function expand(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Expand" }));
  const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
  await settled(dialog);
  return dialog;
}

function rgba(color: string): number[] {
  // Let the browser resolve theme colors, including oklch, rather than parsing token syntax.
  const context = document.createElement("canvas").getContext("2d")!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data);
}

function luminance(color: string) {
  const channels = rgba(color).slice(0, 3).map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

function background(element: Element): string {
  for (let current: Element | null = element; current; current = current.parentElement) {
    const color = getComputedStyle(current).backgroundColor;
    if (rgba(color)[3] === 255) return color;
  }
  throw new Error("The code example needs an opaque theme background");
}

async function paintedNumbers(code: HTMLElement) {
  // DOMSnapshot reports the text Chromium actually lays out, including generated
  // counters and pseudo-elements. textContent deliberately cannot see those.
  const { cdp } = await import("@vitest/browser/context");
  const snapshot = await cdp().send("DOMSnapshot.captureSnapshot", { computedStyles: ["color"] });
  const bounds = code.getBoundingClientRect();
  const result: { text: string; color: string; top: number; left: number }[] = [];
  for (const doc of snapshot.documents) {
    if (snapshot.strings[doc.documentURL] !== document.URL) continue;
    for (let index = 0; index < doc.layout.text.length; index += 1) {
      const text = snapshot.strings[doc.layout.text[index]!]!;
      const rect = doc.layout.bounds[index]!;
      if (!/^\d+$/.test(text) || rect[2]! <= 0 || rect[3]! <= 0) continue;
      const left = rect[0]! - scrollX;
      const top = rect[1]! - scrollY;
      if (left < bounds.left - edgeTolerance || left > bounds.right || top < bounds.top - edgeTolerance || top >= bounds.bottom) continue;
      result.push({ text, left, top, color: snapshot.strings[doc.layout.styles[index]![0]!]! });
    }
  }
  return result.sort((first, second) => first.top - second.top || first.left - second.left);
}

async function expectNumberedCode(container: HTMLElement, expected: string, startLine = 1) {
  const code = container.querySelector<HTMLElement>("pre code");
  expect(code, "the shipped code/log path renders semantic code").not.toBeNull();
  expect(code!.textContent, "line numbers are not DOM text").toBe(expected);
  const numbers = await paintedNumbers(code!);
  expect(numbers.map((number) => number.text), "CSS paints every line number without an opt-in").toEqual(
    expected.split("\n").map((_, index) => String(startLine + index)),
  );
  const ink = getComputedStyle(code!).color;
  const paper = background(code!);
  for (const number of numbers) {
    expect(contrast(number.color, paper), "numbers have lower contrast than ordinary code").toBeLessThan(contrast(ink, paper));
  }
  const selection = container.ownerDocument.getSelection()!;
  const range = container.ownerDocument.createRange();
  range.selectNodeContents(code!);
  selection.removeAllRanges();
  selection.addRange(range);
  expect(selection.toString(), "selecting source excludes generated numbers").toBe(expected);
  selection.removeAllRanges();
}

async function expectCopied(container: HTMLElement, name: string, expected: string) {
  // Vitest browser APIs are unavailable in the ordinary Storybook runtime.
  const { cdp } = await import("@vitest/browser/context");
  await cdp().send("Browser.grantPermissions", { origin: location.origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
  await userEvent.click(within(container).getByRole("button", { name }));
  await within(container).findByRole("button", { name: "Copied" });
  expect(await navigator.clipboard.readText(), "copying source excludes line numbers").toBe(expected);
}

export const CodeNumbersDefaultAndOffset: Story = {
  render: () => <div><CodeBlock filename="default.txt" code={source} /><CodeBlock filename="offset.txt" code={source} startLine={41} /></div>,
  play: async ({ canvasElement }) => {
    await viewport();
    const regions = within(canvasElement).getAllByRole("region");
    await expectNumberedCode(regions[0]!, source);
    await expectCopied(regions[0]!, "Copy code", source);
    await expectNumberedCode(regions[1]!, source, 41);
    await expectCopied(regions[1]!, "Copy code", source);
  },
};

export const CodeNumbersDark: Story = { ...CodeNumbersDefaultAndOffset, globals: { theme: "dark" } };

export const CatalogCodeNumbers: Story = {
  render: () => <CatalogCode />,
  play: async ({ canvasElement }) => {
    await viewport();
    const expected = Array.from({ length: 30 }, (_, index) => `Record ${index + 1}: a deliberately long line to exercise horizontal and vertical scrolling inside the content viewport.`).join("\n");
    await expectNumberedCode(canvasElement, expected);
    await expectCopied(canvasElement, "Copy records", expected);
    const dialog = await expand(canvasElement);
    await expectNumberedCode(dialog, expected);
  },
};

export const CatalogLogNumbers: Story = {
  render: () => <CatalogLog />,
  play: async ({ canvasElement }) => {
    await viewport(narrow);
    await expectNumberedCode(canvasElement, "ok");
    await expectCopied(canvasElement, "Copy output", "ok");
  },
};

export const CatalogChartKeepsHeight: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    const region = within(canvasElement).getByRole("region");
    const original = region.getBoundingClientRect().height;
    await userEvent.click(within(region).getByRole("button", { name: "Show table" }));
    expect(Math.abs(region.getBoundingClientRect().height - original), "inline data and chart retain the same block height").toBeLessThanOrEqual(edgeTolerance);
    await userEvent.click(within(region).getByRole("button", { name: "Show chart" }));
    expect(Math.abs(region.getBoundingClientRect().height - original)).toBeLessThanOrEqual(edgeTolerance);
    const dialog = await expand(canvasElement);
    const expanded = dialog.getBoundingClientRect().height;
    await userEvent.click(within(dialog).getByRole("button", { name: "Show table" }));
    expect(Math.abs(dialog.getBoundingClientRect().height - expanded), "fullscreen height also stays fixed").toBeLessThanOrEqual(edgeTolerance);
    await userEvent.click(within(dialog).getByRole("button", { name: "Show chart" }));
    expect(Math.abs(dialog.getBoundingClientRect().height - expanded)).toBeLessThanOrEqual(edgeTolerance);
  },
};

export const CallerChartKeepsHeight: Story = {
  render: () => <div style={{ maxWidth: 768 }}><ChartOutput title="Latency by service" unit="ms" points={manyPoints} /></div>,
  play: async ({ canvasElement }) => {
    await viewport(narrow);
    const region = within(canvasElement).getByRole("region");
    const original = region.getBoundingClientRect().height;
    await userEvent.click(within(region).getByRole("button", { name: "Show table" }));
    expect(Math.abs(region.getBoundingClientRect().height - original), "a long caller table does not enlarge the block").toBeLessThanOrEqual(edgeTolerance);
    await userEvent.click(within(region).getByRole("button", { name: "Show chart" }));
    expect(Math.abs(region.getBoundingClientRect().height - original)).toBeLessThanOrEqual(edgeTolerance);
  },
};

export const FullscreenFooterGroups: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    const dialog = await expand(canvasElement);
    const query = within(dialog);
    expect(query.queryByRole("button", { name: "Click to zoom" })).not.toBeInTheDocument();
    const zoom = ["Zoom in", "Zoom out", "Reset view"].map((name) => query.getByRole("button", { name }));
    const normal = ["Show table", "Copy CSV", "Close"].map((name) => query.getByRole("button", { name }));
    const area = dialog.getBoundingClientRect();
    const midpoint = area.left + area.width / 2;
    for (const button of zoom) expect(button.getBoundingClientRect().right, "zoom controls belong on the left").toBeLessThan(midpoint);
    for (const button of normal) expect(button.getBoundingClientRect().left, "normal controls belong on the right").toBeGreaterThan(midpoint);
    for (const group of [zoom, normal]) {
      for (let index = 1; index < group.length; index += 1) {
        expect(group[index]!.getBoundingClientRect().left).toBeGreaterThanOrEqual(group[index - 1]!.getBoundingClientRect().right);
      }
    }
  },
};

export const FullscreenZoomDirection: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    const dialog = await expand(canvasElement);
    const query = within(dialog);
    const drawing = query.getByRole("img", { name: "Weekly runs chart" });
    const zoomIn = query.getByRole("button", { name: "Zoom in" });
    const zoomOut = query.getByRole("button", { name: "Zoom out" });
    const reset = query.getByRole("button", { name: "Reset view" });
    const fitted = drawing.getBoundingClientRect().width;
    if (zoomIn.getAttribute("aria-pressed") !== "true") await userEvent.click(zoomIn);
    expect(zoomIn).toHaveAttribute("aria-pressed", "true");
    expect(zoomOut).toHaveAttribute("aria-pressed", "false");
    expect(Math.abs(drawing.getBoundingClientRect().width - fitted), "selecting a direction does not itself zoom").toBeLessThanOrEqual(edgeTolerance);
    await userEvent.click(drawing);
    await waitFor(() => expect(drawing.getBoundingClientRect().width).toBeGreaterThan(fitted + edgeTolerance));
    const enlarged = drawing.getBoundingClientRect().width;
    await userEvent.click(zoomOut);
    expect(zoomOut).toHaveAttribute("aria-pressed", "true");
    expect(zoomIn).toHaveAttribute("aria-pressed", "false");
    expect(Math.abs(drawing.getBoundingClientRect().width - enlarged)).toBeLessThanOrEqual(edgeTolerance);
    await userEvent.click(drawing);
    await waitFor(() => expect(drawing.getBoundingClientRect().width).toBeLessThan(enlarged - edgeTolerance));
    // Select and use + again so Reset is exercised from a definitely changed view.
    await userEvent.click(zoomIn);
    await userEvent.click(drawing);
    expect(reset).toBeEnabled();
    await userEvent.click(reset);
    await waitFor(() => expect(Math.abs(drawing.getBoundingClientRect().width - fitted)).toBeLessThanOrEqual(edgeTolerance));
    expect(reset).toBeDisabled();
  },
};

export const StrongerTranslucentBackdrop: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    const dialog = await expand(canvasElement);
    const overlay = document.elementFromPoint(2, 2)!;
    expect(dialog.contains(overlay), "sample outside the desktop dialog").toBe(false);
    const style = getComputedStyle(overlay);
    const alpha = rgba(style.backgroundColor)[3]! / 255 * Number(style.opacity);
    // D-20261124-035 supersedes the original opaque-backdrop instruction.
    expect(alpha, "backdrop is stronger than the original half-opacity").toBeGreaterThan(0.5);
    expect(alpha, "backdrop remains translucent, not solid").toBeLessThan(1);
  },
};

function textBox(element: Element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect();
}

async function expectTableScrollLayout(container: HTMLElement) {
  const headers = within(container).getAllByRole("columnheader");
  for (const header of headers) {
    const cell = header.getBoundingClientRect();
    const text = textBox(header);
    expect(Math.abs((text.left + text.right) / 2 - (cell.left + cell.right) / 2), "column headers are centered").toBeLessThanOrEqual(edgeTolerance);
  }
  const scrollers = Array.from(container.querySelectorAll<HTMLElement>("*")).filter((element) => {
    const style = getComputedStyle(element);
    return /auto|scroll/.test(style.overflowY) && element.scrollHeight > element.clientHeight + edgeTolerance;
  });
  expect(scrollers.length, "the long table has a vertical scrollbar").toBeGreaterThan(0);
  const headerBottom = Math.max(...headers.map((header) => header.getBoundingClientRect().bottom));
  const captionTop = within(container).getByRole("button", { name: /^(Expand|Close)$/ }).getBoundingClientRect().top;
  const area = container.getBoundingClientRect();
  for (const scroller of scrollers) {
    const rect = scroller.getBoundingClientRect();
    expect(rect.top, "vertical scrollbar begins below the header").toBeGreaterThanOrEqual(headerBottom - edgeTolerance);
    expect(rect.right, "scrollbar is inset from the block edge").toBeLessThan(area.right - edgeTolerance);
    expect(rect.bottom, "scrollbar stays inset above the footer").toBeLessThan(captionTop - edgeTolerance);
    const style = getComputedStyle(scroller);
    const reservedRight = scroller.offsetWidth - scroller.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth) + parseFloat(style.paddingRight);
    expect(reservedRight, "space is reserved beside text even with overlay scrollbars").toBeGreaterThan(0);
    if (scroller.scrollWidth > scroller.clientWidth + edgeTolerance) {
      const reservedBottom = scroller.offsetHeight - scroller.clientHeight - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) + parseFloat(style.paddingBottom);
      expect(reservedBottom, "horizontal scrollbar also has reserved space").toBeGreaterThan(0);
    }
    const originalHeader = headers.map((header) => header.getBoundingClientRect().top);
    scroller.focus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(scroller.scrollTop, "the table body can actually scroll").toBeGreaterThan(0));
    headers.forEach((header, index) => expect(Math.abs(header.getBoundingClientRect().top - originalHeader[index]!)).toBeLessThanOrEqual(edgeTolerance));
    const cells = within(scroller).getAllByRole("cell");
    const rightmostText = Math.max(...cells.map((cell) => textBox(cell).right));
    if (scroller.scrollWidth <= scroller.clientWidth + edgeTolerance) {
      expect(rightmostText, "cell text stops before the reserved scrollbar strip").toBeLessThanOrEqual(rect.right - reservedRight + edgeTolerance);
    }
  }
}

export const CatalogTableScrollLayout: Story = {
  render: () => <CatalogTable />,
  play: async ({ canvasElement }) => {
    await viewport(narrow);
    await expectTableScrollLayout(within(canvasElement).getByRole("region"));
    const dialog = await expand(canvasElement);
    await expectTableScrollLayout(dialog);
  },
};

export const CatalogTableScrollLayoutDark: Story = { ...CatalogTableScrollLayout, globals: { theme: "dark" } };

export const CallerTableScrollLayout: Story = {
  render: () => <div style={{ maxWidth: 768 }}><ChartOutput title="Latency by service" unit="ms" points={manyPoints} /></div>,
  play: async ({ canvasElement }) => {
    await viewport();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show table" }));
    await expectTableScrollLayout(within(canvasElement).getByRole("region"));
    const dialog = await expand(canvasElement);
    await expectTableScrollLayout(dialog);
  },
};
