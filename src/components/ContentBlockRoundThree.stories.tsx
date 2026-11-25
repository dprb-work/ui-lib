import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { AttachmentViewer } from "../chat/content/AttachmentViewer";
import { ChartOutput } from "../chat/content/ChartOutput";
import attachmentImageUrl from "../test/fixtures/content-block-image.svg?no-inline";
import catalogMeta, { Chart, Code, Image, Table } from "./ContentBlock.stories";

const CatalogChart = composeStory(Chart, catalogMeta);
const CatalogCode = composeStory(Code, catalogMeta);
const CatalogImage = composeStory(Image, catalogMeta);
const CatalogTable = composeStory(Table, catalogMeta);
const desktop = { width: 1440, height: 900 };
const narrow = { width: 390, height: 844 };
const tolerance = 1;
const textClearance = 4;
const points = Array.from({ length: 40 }, (_, index) => ({ label: `Service ${index + 1}`, value: index + 1 }));

const meta = {
  title: "Components/ContentBlock/Round three contract",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
  globals: { theme: "light" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function CallerChart() {
  return <div style={{ maxWidth: 768 }}><ChartOutput title="Latency by service" unit="ms" points={points} /></div>;
}

function AttachmentImage() {
  return <AttachmentViewer attachment={{ name: "Pipeline image", mediaType: "image/svg+xml", href: new URL(attachmentImageUrl, location.href).href }} />;
}

async function viewport(size = desktop) {
  // Browser context is unavailable when this story is opened outside Vitest.
  const { page } = await import("@vitest/browser/context");
  await page.viewport(size.width, size.height);
  await waitFor(() => expect([innerWidth, innerHeight]).toEqual([size.width, size.height]));
}

async function settled(element: Element) {
  await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
  // The project's ES2022 library does not include Promise.withResolvers.
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

async function expand(container: HTMLElement) {
  await userEvent.click(within(container).getByRole("button", { name: "Expand" }));
  const dialog = await within(document.body).findByRole("dialog");
  await settled(dialog);
  return dialog;
}

function drawing(button: Element) {
  const svg = button.querySelector("svg");
  expect(svg, "the action has a visible icon").not.toBeNull();
  return svg!.innerHTML;
}

async function expectSwitch(container: HTMLElement, contract: "plain" | "icon") {
  const query = within(container);
  const showData = query.getByRole("button", { name: "Show table" });
  const dataIcon = drawing(showData);
  const caption = container.querySelector("[data-content-block-caption]")!;
  const chartIcon = Array.from(caption.querySelectorAll("svg")).find((icon) => !icon.closest("button"))!.innerHTML;
  if (contract === "plain") expect(showData, "changing renderers is an action, not a pressed toggle").not.toHaveAttribute("aria-pressed");
  await userEvent.click(showData);
  expect(query.getByRole("table")).toBeVisible();
  const showChart = query.getByRole("button", { name: "Show chart" });
  if (contract === "plain") expect(showChart).not.toHaveAttribute("aria-pressed");
  else {
    expect(drawing(showChart), "the data view offers the chart icon").toBe(chartIcon);
    expect(drawing(showChart), "the action icon changes with the available action").not.toBe(dataIcon);
  }
  await userEvent.click(showChart);
  expect(query.getByRole("img", { name: /chart$/ })).toBeVisible();
  expect(drawing(query.getByRole("button", { name: "Show table" })), "returning to the chart restores the data icon").toBe(dataIcon);
}

async function switchInlineAndExpanded(canvasElement: HTMLElement, contract: "plain" | "icon") {
  await viewport();
  await expectSwitch(within(canvasElement).getByRole("region"), contract);
  await expectSwitch(await expand(canvasElement), contract);
}

export const CatalogSwitchIsPlainAction: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => switchInlineAndExpanded(canvasElement, "plain"),
};
export const CatalogSwitchShowsNextActionIcon: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => switchInlineAndExpanded(canvasElement, "icon"),
};
export const CallerSwitchIsPlainAction: Story = {
  render: () => <CallerChart />,
  play: async ({ canvasElement }) => switchInlineAndExpanded(canvasElement, "plain"),
};
export const CallerSwitchShowsNextActionIcon: Story = {
  render: () => <CallerChart />,
  play: async ({ canvasElement }) => switchInlineAndExpanded(canvasElement, "icon"),
};

function expectNoContainerPadding(container: HTMLElement, selector: string) {
  const content = container.querySelector(selector);
  expect(content, "the actual content renderer is present").not.toBeNull();
  const viewportElement = content!.closest("[data-content-block-viewport]")!;
  expect(viewportElement).not.toBeNull();
  for (let element: Element | null = content; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.display !== "contents") {
      expect([style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft], `no container gutter on ${element.tagName.toLowerCase()}`).toEqual(["0px", "0px", "0px", "0px"]);
    }
    if (element === viewportElement) break;
  }
}

async function paddingInlineAndExpanded(canvasElement: HTMLElement, selector: string, data = false) {
  await viewport();
  if (data) await userEvent.click(within(canvasElement).getByRole("button", { name: "Show table" }));
  expectNoContainerPadding(canvasElement, selector);
  expectNoContainerPadding(await expand(canvasElement), selector);
}

export const ChartHasNoContentGutter: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, 'svg[role="img"]'),
};
export const ChartDataHasNoContentGutter: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, "table", true),
};
export const TableHasNoContentGutter: Story = {
  render: () => <CatalogTable />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, "table"),
};
export const CallerChartHasNoContentGutter: Story = {
  render: () => <CallerChart />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, 'svg[role="img"]'),
};
export const CallerDataHasNoContentGutter: Story = {
  render: () => <CallerChart />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, "table", true),
};
export const CodeHasNoContentGutter: Story = {
  render: () => <CatalogCode />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, "pre"),
};
export const ImageHasNoContentGutter: Story = {
  render: () => <CatalogImage />,
  play: async ({ canvasElement }) => paddingInlineAndExpanded(canvasElement, "img"),
};
export const AttachmentHasNoContentGutter: Story = {
  render: () => <AttachmentImage />,
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole("img", { name: "Pipeline image" });
    await paddingInlineAndExpanded(canvasElement, "img");
  },
};

function alpha(element: Element) {
  const context = document.createElement("canvas").getContext("2d")!;
  context.fillStyle = getComputedStyle(element).backgroundColor;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data[3];
}

function expectSolidInnerSurface(container: HTMLElement) {
  const table = within(container).getByRole("table");
  const inner = table.closest<HTMLElement>("[data-content-block-viewport]")!;
  const bounds = inner.getBoundingClientRect();
  const solid = [inner, ...inner.querySelectorAll("*")].some((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left <= bounds.left + tolerance && rect.top <= bounds.top + tolerance
      && rect.right >= bounds.right - tolerance && rect.bottom >= bounds.bottom - tolerance
      && alpha(element) === 255 && getComputedStyle(element).opacity === "1";
  });
  expect(solid, "the entire inner area owns an opaque background, not just the outer frame or alternating rows").toBe(true);
}

export const WeeklyDataOwnsSolidInnerBackground: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show table" }));
    expectSolidInnerSurface(canvasElement);
    expectSolidInnerSurface(await expand(canvasElement));
  },
};
export const WeeklyDataOwnsSolidInnerBackgroundDark: Story = { ...WeeklyDataOwnsSolidInnerBackground, globals: { theme: "dark" } };

function expectFullWidthRows(container: HTMLElement) {
  const table = within(container).getByRole("table");
  const body = table.querySelector<HTMLElement>("tbody")!;
  const right = body.getBoundingClientRect().left + body.clientLeft + body.clientWidth;
  const rows = within(body).getAllByRole("row");
  for (const row of rows) {
    const lastCell = within(row).getAllByRole("cell").at(-1)!;
    expect(Math.abs(row.getBoundingClientRect().right - right), "rows and their zebra paint reach the right scrollport edge without an empty strip").toBeLessThanOrEqual(tolerance);
    expect(Math.abs(lastCell.getBoundingClientRect().right - right), "the last column fills the row rather than leaving a blank strip").toBeLessThanOrEqual(tolerance);
    expect(parseFloat(getComputedStyle(lastCell).paddingRight), "every row's last column keeps text away from the scrollbar").toBeGreaterThanOrEqual(textClearance);
    const text = document.createRange();
    text.selectNodeContents(lastCell);
    expect(text.getBoundingClientRect().right, "the last column text stays clear of the scrollbar edge").toBeLessThanOrEqual(right - textClearance + tolerance);
  }
}

export const WeeklyDataRowsFillWidth: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show table" }));
    expectFullWidthRows(canvasElement);
    expectFullWidthRows(await expand(canvasElement));
  },
};
export const CallerDataRowsFillWidth: Story = {
  render: () => <CallerChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Show table" }));
    expectFullWidthRows(canvasElement);
    expectFullWidthRows(await expand(canvasElement));
  },
};
export const CatalogRowsFillWidth: Story = {
  render: () => <CatalogTable />,
  play: async ({ canvasElement }) => {
    await viewport();
    expectFullWidthRows(await expand(canvasElement));
  },
};
export const CatalogRowsFillWidthDark: Story = { ...CatalogRowsFillWidth, globals: { theme: "dark" } };

export const OuterHorizontalInnerVerticalScroll: Story = {
  render: () => <CatalogTable />,
  play: async ({ canvasElement }) => {
    await viewport(narrow);
    const table = within(canvasElement).getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    const firstCell = within(table).getAllByRole("cell")[0]!;
    const region = within(canvasElement).getByRole("region");
    const candidates = Array.from(region.querySelectorAll<HTMLElement>("*"));
    const horizontal = candidates.find((element) => /auto|scroll/.test(getComputedStyle(element).overflowX)
      && element.scrollWidth > element.clientWidth + tolerance && headers.every((header) => element.contains(header)) && element.contains(firstCell));
    expect(horizontal, "the outer horizontal scroller contains both headers and body cells").toBeDefined();
    const vertical = candidates.find((element) => /auto|scroll/.test(getComputedStyle(element).overflowY)
      && element.scrollHeight > element.clientHeight + tolerance && element.contains(firstCell) && headers.every((header) => !element.contains(header)));
    expect(vertical, "vertical scrolling belongs to the inner body, excluding the header").toBeDefined();
    expect(horizontal!.contains(vertical!)).toBe(true);
    expect(vertical!.getBoundingClientRect().top, "the vertical scroll track starts below the header").toBeGreaterThanOrEqual(Math.max(...headers.map((header) => header.getBoundingClientRect().bottom)) - tolerance);
    const before = { header: headers[0]!.getBoundingClientRect(), cell: firstCell.getBoundingClientRect() };
    // Browser context is unavailable when this story is opened outside Vitest.
    const { userEvent: browserUserEvent } = await import("@vitest/browser/context");
    horizontal!.focus();
    await browserUserEvent.keyboard("{ArrowRight>8/}");
    await waitFor(() => expect(horizontal!.scrollLeft, "native input scrolls the whole table sideways").toBeGreaterThan(0));
    await waitFor(() => {
      const shift = before.header.left - headers[0]!.getBoundingClientRect().left;
      expect(shift).toBeGreaterThan(tolerance);
      expect(Math.abs(shift - (before.cell.left - firstCell.getBoundingClientRect().left)), "headers and cells move sideways together").toBeLessThanOrEqual(tolerance);
    });
    expect(vertical!.scrollLeft, "the inner body does not own horizontal scrolling").toBe(0);
    const headerTop = headers[0]!.getBoundingClientRect().top;
    const cellTop = firstCell.getBoundingClientRect().top;
    vertical!.focus();
    await browserUserEvent.keyboard("{End}");
    await waitFor(() => expect(vertical!.scrollTop).toBeGreaterThan(0));
    expect(Math.abs(headers[0]!.getBoundingClientRect().top - headerTop), "vertical scrolling keeps the header fixed").toBeLessThanOrEqual(tolerance);
    expect(firstCell.getBoundingClientRect().top, "body rows actually move vertically").toBeLessThan(cellTop - tolerance);
  },
};

function sampleDialogOpacity(dialog: HTMLElement) {
  const animations = dialog.getAnimations();
  const samples: string[] = [];
  for (const animation of animations) {
    const duration = Number(animation.effect?.getTiming().duration);
    if (!Number.isFinite(duration) || duration <= 0) continue;
    animation.pause();
    for (const fraction of [0, 0.5, 1]) {
      animation.currentTime = duration * fraction;
      samples.push(getComputedStyle(dialog).opacity);
    }
    animation.finish();
  }
  if (animations.length === 0) samples.push(getComputedStyle(dialog).opacity);
  return samples;
}

export const InnerContentStaysOpaqueDuringOpenAndClose: Story = {
  render: () => <CatalogChart />,
  play: async ({ canvasElement }) => {
    await viewport();
    // CSS animation must be exercised even if the host requests reduced motion.
    const { cdp } = await import("@vitest/browser/context");
    await cdp().send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    try {
      await userEvent.click(within(canvasElement).getByRole("button", { name: "Show table" }));
      await userEvent.click(within(canvasElement).getByRole("button", { name: "Expand" }));
      const dialog = await within(document.body).findByRole("dialog");
      const opening = sampleDialogOpacity(dialog);
      await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
      const closing = dialog.isConnected ? sampleDialogOpacity(dialog) : [];
      expect([...opening, ...closing], "the inner background and its content never fade through to the black backdrop").toEqual([...opening, ...closing].map(() => "1"));
    } finally {
      await cdp().send("Emulation.setEmulatedMedia", { features: [] });
    }
  },
};
