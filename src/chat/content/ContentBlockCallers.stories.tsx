import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { ChartOutput } from "./ChartOutput";
import { ChatPresentationProvider } from "./ChatPresentation";
import { FileExcerpt } from "./FileExcerpt";

const meta = {
  title: "Chat/Content/ContentBlockCallers/Behavior",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Point = { x: number; y: number };

const desktop = { width: 1440, height: 900 };
// Upper bounds for frames and wheel notches spent bringing the last table row into view.
const maxSettleFrames = 30;
const maxWheelNotches = 40;
// One wheel notch in pixel delta mode; positive is wheel down.
const wheelNotch = 300;
// Rounding slack for comparing layout edges, in CSS pixels.
const edgeTolerance = 1;
const chartPoints = Array.from({ length: 40 }, (_, index) => ({ label: `Service ${index + 1}`, value: (index * 37) % 90 + 10 }));
const excerptPath = "src/chat/content/FileExcerpt.tsx";
const navigate = fn();

async function showViewport({ width, height }: { width: number; height: number }) {
  // Browser APIs exist only in Vitest's browser runner, not Storybook's ordinary story runtime.
  const { page } = await import("@vitest/browser/context");
  await page.viewport(width, height);
  await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([width, height]));
}

function pagePoint({ x, y }: Point): Point {
  // CDP input uses top-level page coordinates; the story runs in a possibly scaled iframe.
  let point = { x, y };
  let frameWindow: Window = window;
  while (frameWindow.frameElement) {
    const frame = frameWindow.frameElement as HTMLElement;
    const rect = frame.getBoundingClientRect();
    const scale = rect.width / frame.offsetWidth;
    point = { x: rect.left + (frame.clientLeft + point.x) * scale, y: rect.top + (frame.clientTop + point.y) * scale };
    frameWindow = frameWindow.parent;
  }
  return point;
}

async function wheelAt(at: Point, deltaY: number): Promise<WheelEvent> {
  // Trusted input through CDP exists only in Vitest's browser runner, not Storybook's ordinary story runtime.
  const { cdp } = await import("@vitest/browser/context");
  const { x, y } = pagePoint(at);
  // Observe the trusted event after every listener ran, to read its target and defaultPrevented.
  const seen: WheelEvent[] = [];
  const record = (event: WheelEvent) => seen.push(event);
  window.addEventListener("wheel", record, { capture: true, passive: true });
  try {
    await cdp().send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await cdp().send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY });
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
  } finally {
    window.removeEventListener("wheel", record, { capture: true });
  }
  return seen[0]!;
}

function nextFrame(): Promise<void> {
  // The project's ES2022 lib has no Promise.withResolvers.
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export const ExpandedChartTableScrolls: Story = {
  render: () => (
    <div style={{ maxWidth: 768 }}>
      <ChartOutput title="Latency by service" unit="ms" points={chartPoints} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show table" }));
    await userEvent.click(canvas.getByRole("button", { name: "Expand" }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
    const table = await within(dialog).findByRole("table");
    // Tables are not zoomed (D-053): no zoom section while the table is showing.
    expect(within(dialog).queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();

    const rows = within(table).getAllByRole("row");
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow).toHaveTextContent(chartPoints[chartPoints.length - 1]!.label);
    // The content area ends where the caption controls begin.
    const contentBottom = () => Math.min(...within(dialog).getAllByRole("button").map((control) => control.getBoundingClientRect().top));
    const lastRowShown = () => {
      const row = lastRow.getBoundingClientRect();
      const top = dialog.getBoundingClientRect().top;
      if (row.bottom > contentBottom() + edgeTolerance || row.top < top - edgeTolerance) return false;
      // The row must be painted there, not hidden behind the caption or clipped by a container.
      const hit = document.elementFromPoint(row.left + row.width / 2, row.top + row.height / 2);
      return hit !== null && lastRow.contains(hit);
    };
    expect(lastRowShown(), "a 40-row table needs scrolling to reach its last row").toBe(false);

    for (let notch = 0; notch < maxWheelNotches && !lastRowShown(); notch += 1) {
      const area = table.getBoundingClientRect();
      const top = Math.max(area.top, dialog.getBoundingClientRect().top);
      const bottom = Math.min(area.bottom, contentBottom());
      const wheel = await wheelAt({ x: area.left + area.width / 2, y: (top + bottom) / 2 }, wheelNotch);
      expect(table.contains(wheel.target as Node), "the wheel lands on the table").toBe(true);
      expect(wheel.defaultPrevented, "the wheel over the table is left to scroll").toBe(false);
      for (let frame = 0; frame < maxSettleFrames && !lastRowShown(); frame += 1) await nextFrame();
    }
    expect(lastRowShown(), "the last table row scrolls into the dialog's content area").toBe(true);
    expect(within(dialog).queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
  },
};

export const CompactTitleStaysReadable: Story = {
  render: () => (
    <ChatPresentationProvider wrapText={false} density="compact">
      <div style={{ maxWidth: 768 }}>
        <FileExcerpt path={excerptPath} excerpt={"export function FileExcerpt() {\n  return null;\n}"} onNavigate={navigate} />
      </div>
    </ChatPresentationProvider>
  ),
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const region = within(canvasElement).getByRole("region", { name: excerptPath });
    const title = within(region).getByRole("button", { name: excerptPath });

    expect(title.clientWidth).toBeGreaterThan(0);
    expect(title.scrollWidth, "the title shows its whole text").toBeLessThanOrEqual(title.clientWidth + edgeTolerance);
    const titleBox = title.getBoundingClientRect();
    // Every later caption element on the title's line starts right of the title.
    const following = Array.from(region.querySelectorAll<Element>("*")).filter((element) => {
      if (title.contains(element) || element.contains(title)) return false;
      if (!(title.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
      const box = element.getBoundingClientRect();
      // Skip visually hidden helpers, which are 1px boxes placed anywhere.
      return box.width > 1 && box.height > 1 && box.top < titleBox.bottom && box.bottom > titleBox.top;
    });
    expect(following.length, "the caption has controls after the title").toBeGreaterThan(0);
    for (const element of following) {
      const box = element.getBoundingClientRect();
      const name = element.getAttribute("aria-label") ?? element.tagName.toLowerCase();
      expect(box.left, `${name} does not overlap the title`).toBeGreaterThanOrEqual(titleBox.right - edgeTolerance);
    }

    navigate.mockClear();
    await userEvent.click(title);
    expect(navigate).toHaveBeenCalledWith({ path: excerptPath });
  },
};
