import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pin } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type {} from "@vitest/browser/providers/playwright";

import { ContentBlock } from "./ContentBlock";

const meta = {
  title: "Components/ContentBlock/Behavior",
  tags: ["!autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Box = { left: number; top: number; width: number; height: number };
type Point = { x: number; y: number };

const desktop = { width: 1440, height: 900 };
const narrow = { width: 390, height: 844 };
// The contract's tolerances, in CSS pixels.
const layoutTolerance = 1;
const anchorTolerance = 2;
// Upper bound for frames spent waiting on zoom or dialog transitions to come to rest.
const maxSettleFrames = 120;
const stableFrames = 3;
// Generous bound on wheel notches; the contract fixes the zoom limits, not the step size.
const maxZoomNotches = 64;
// One wheel notch in pixel delta mode; negative is wheel up.
const wheelNotch = 100;

function SitePlan({ reading }: { reading?: number }) {
  return (
    <svg role="img" aria-label="Site plan drawing" viewBox="0 0 640 360" width={640} height={360} style={{ display: "block" }}>
      <rect x="8" y="8" width="624" height="344" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="40" y="40" width="240" height="160" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="360" y="120" width="240" height="200" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="160" cy="280" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
      {reading !== undefined && <text x="380" y="80" fill="currentColor" fontSize="24">Reading {reading}</text>}
    </svg>
  );
}

function SitePlanBlock({ expansion = "zoom" }: { expansion?: "scroll" | "zoom" }) {
  return (
    <ContentBlock
      label="Site plan"
      title="Site plan"
      style={{ width: 720 }}
      expansion={expansion}
      actions={[
        { kind: "button", label: "Pin", icon: <Pin />, onSelect: () => {} },
        { kind: "copy", label: "Copy source", text: "site-plan.svg" },
      ]}
    >
      <SitePlan />
    </ContentBlock>
  );
}

function LiveSitePlanBlock() {
  const [reading, setReading] = useState(1);
  return (
    <ContentBlock label="Site plan" title="Site plan" style={{ width: 720 }} expansion="zoom">
      <div>
        <SitePlan reading={reading} />
        <button type="button" onClick={() => setReading((value) => value + 1)}>Next reading</button>
      </div>
    </ContentBlock>
  );
}

function box(element: Element): Box {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

function expectBox(actual: Box, expected: Box, tolerance: number) {
  expect(Math.abs(actual.left - expected.left)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.top - expected.top)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.width - expected.width)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.height - expected.height)).toBeLessThanOrEqual(tolerance);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settledBox(element: Element): Promise<Box> {
  // Zoom and dialog transitions may animate; read the rectangle once it holds still for a few frames.
  let previous = box(element);
  let still = 0;
  for (let frame = 0; frame < maxSettleFrames && still < stableFrames; frame += 1) {
    await nextFrame();
    const current = box(element);
    const moved = Math.abs(current.left - previous.left) + Math.abs(current.top - previous.top)
      + Math.abs(current.width - previous.width) + Math.abs(current.height - previous.height);
    still = moved < 0.01 ? still + 1 : 0;
    previous = current;
  }
  return previous;
}

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

async function mouse(type: "mouseMoved" | "mousePressed" | "mouseReleased" | "mouseWheel", at: Point, details: { button?: "left" | "none"; buttons?: number; clickCount?: number; deltaY?: number } = {}) {
  // Trusted input through CDP exists only in Vitest's browser runner, not Storybook's ordinary story runtime.
  const { cdp } = await import("@vitest/browser/context");
  const { x, y } = pagePoint(at);
  await cdp().send("Input.dispatchMouseEvent", { type, x, y, deltaX: 0, deltaY: 0, ...details });
}

async function captureEvent<Type extends "wheel" | "pointerdown">(type: Type, act: () => Promise<void>): Promise<WindowEventMap[Type]> {
  // Observe the trusted event after every listener ran, to read its target and defaultPrevented.
  const seen: WindowEventMap[Type][] = [];
  const record = (event: WindowEventMap[Type]) => seen.push(event);
  window.addEventListener(type, record, { capture: true, passive: true });
  try {
    await act();
    await waitFor(() => expect(seen.length).toBeGreaterThan(0));
  } finally {
    window.removeEventListener(type, record, { capture: true });
  }
  return seen[0]!;
}

async function wheelAt(at: Point, deltaY: number): Promise<WheelEvent> {
  return captureEvent("wheel", async () => {
    await mouse("mouseMoved", at);
    await mouse("mouseWheel", at, { deltaY });
  });
}

async function dragBy(from: Point, dx: number, dy: number): Promise<PointerEvent> {
  const steps = 6;
  const pressed = await captureEvent("pointerdown", async () => {
    await mouse("mouseMoved", from);
    await mouse("mousePressed", from, { button: "left", buttons: 1, clickCount: 1 });
  });
  for (let step = 1; step <= steps; step += 1) {
    await mouse("mouseMoved", { x: from.x + (dx * step) / steps, y: from.y + (dy * step) / steps }, { button: "left", buttons: 1 });
  }
  await mouse("mouseReleased", { x: from.x + dx, y: from.y + dy }, { button: "left", buttons: 0, clickCount: 1 });
  return pressed;
}

function pointIn(area: Box, fractionX: number, fractionY: number): Point {
  return { x: area.left + area.width * fractionX, y: area.top + area.height * fractionY };
}

function expectAnchored(before: Box, after: Box, pointer: Point) {
  // The content point that was under the pointer must still be under it.
  const anchor = pointIn(after, (pointer.x - before.left) / before.width, (pointer.y - before.top) / before.height);
  expect(Math.abs(anchor.x - pointer.x)).toBeLessThanOrEqual(anchorTolerance);
  expect(Math.abs(anchor.y - pointer.y)).toBeLessThanOrEqual(anchorTolerance);
}

async function expandSitePlan(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Expand" }));
  const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog", { name: "Site plan" });
  const drawing = within(dialog).getByRole("img", { name: "Site plan drawing" });
  return { dialog, drawing, fitted: await settledBox(drawing) };
}

function expectControlsBelow(container: HTMLElement, content: Box) {
  const controls = within(container).getAllByRole("button");
  for (const control of controls) {
    expect(box(control).top, `${control.getAttribute("aria-label") ?? control.textContent} lies below the content`).toBeGreaterThanOrEqual(content.top + content.height - 0.5);
  }
  return controls;
}

export const ControlsBelowContent: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const region = within(canvasElement).getByRole("region", { name: "Site plan" });
    const inline = await settledBox(within(region).getByRole("img", { name: "Site plan drawing" }));
    expect(expectControlsBelow(region, inline).length).toBeGreaterThanOrEqual(3);

    const { dialog, fitted } = await expandSitePlan(canvasElement);
    expect(expectControlsBelow(dialog, fitted).length).toBeGreaterThanOrEqual(6);
  },
};

export const InlineHeightFollowsContentUpToEightyPercent: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 24 }}>
      <ContentBlock label="Long log" title="Long log" expansion="scroll">
        <div style={{ height: 3000 }}>Long log output</div>
      </ContentBlock>
      <ContentBlock label="Short log" title="Short log" expansion="scroll">
        <div style={{ height: 120 }}>Short log output</div>
      </ContentBlock>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const cap = window.innerHeight * 0.8;
    const long = box(within(canvasElement).getByRole("region", { name: "Long log" }));
    const short = box(within(canvasElement).getByRole("region", { name: "Short log" }));
    expect(long.height).toBeLessThanOrEqual(cap + layoutTolerance);
    expect(short.height).toBeLessThan(long.height);
    expect(short.height).toBeLessThan(cap / 2);
  },
};

export const DesktopDialogIsAboutEightyPercent: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const { dialog } = await expandSitePlan(canvasElement);
    await waitFor(() => {
      const { width, height } = box(dialog);
      expect(width / window.innerWidth).toBeGreaterThanOrEqual(0.7);
      expect(width / window.innerWidth).toBeLessThanOrEqual(0.9);
      expect(height / window.innerHeight).toBeGreaterThanOrEqual(0.7);
      expect(height / window.innerHeight).toBeLessThanOrEqual(0.9);
    });
  },
};

export const NarrowDialogCoversViewport: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(narrow);
    const { dialog } = await expandSitePlan(canvasElement);
    await waitFor(() => expectBox(box(dialog), { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }, layoutTolerance));
  },
};

export const WheelZoomsAroundPointer: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const { drawing, fitted } = await expandSitePlan(canvasElement);

    const zoomInAt = pointIn(fitted, 0.3, 0.4);
    const up = await wheelAt(zoomInAt, -wheelNotch);
    expect(drawing.contains(up.target as Node), "the wheel lands on the content").toBe(true);
    expect(up.defaultPrevented).toBe(true);
    await waitFor(() => expect(box(drawing).width).toBeGreaterThan(fitted.width + layoutTolerance));
    const zoomed = await settledBox(drawing);
    expectAnchored(fitted, zoomed, zoomInAt);

    const zoomOutAt = pointIn(fitted, 0.7, 0.6);
    const down = await wheelAt(zoomOutAt, wheelNotch);
    expect(drawing.contains(down.target as Node), "the wheel lands on the content").toBe(true);
    expect(down.defaultPrevented).toBe(true);
    await waitFor(() => expect(box(drawing).width).toBeLessThan(zoomed.width - layoutTolerance));
    expectAnchored(zoomed, await settledBox(drawing), zoomOutAt);
  },
};

export const InlineWheelDoesNotZoom: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const drawing = within(canvasElement).getByRole("img", { name: "Site plan drawing" });
    const before = await settledBox(drawing);

    const wheel = await wheelAt(pointIn(before, 0.5, 0.5), -wheelNotch);
    expect(drawing.contains(wheel.target as Node), "the wheel lands on the content").toBe(true);
    expect(wheel.defaultPrevented).toBe(false);
    const after = await settledBox(drawing);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(layoutTolerance);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(layoutTolerance);
    expect(within(canvasElement).queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
  },
};

export const ZeroKeyResetsToFittedView: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const { dialog, drawing, fitted } = await expandSitePlan(canvasElement);

    await userEvent.keyboard("+");
    await userEvent.keyboard("+");
    await waitFor(() => expect(box(drawing).width).toBeGreaterThan(fitted.width + layoutTolerance));
    await userEvent.keyboard("0");
    await waitFor(() => expectBox(box(drawing), fitted, layoutTolerance));
    expect(within(dialog).getByRole("button", { name: "Reset view" })).toBeDisabled();
  },
};

export const DragPansZoomedContent: Story = {
  render: () => <SitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const { drawing, fitted } = await expandSitePlan(canvasElement);
    for (let notch = 0; notch < maxZoomNotches && box(drawing).width < fitted.width * 4; notch += 1) {
      await wheelAt(pointIn(fitted, 0.5, 0.5), -wheelNotch);
      await nextFrame();
    }
    const before = await settledBox(drawing);

    const drag = { x: -80, y: -60 };
    const pressed = await dragBy(pointIn(fitted, 0.5, 0.5), drag.x, drag.y);
    expect(drawing.contains(pressed.target as Node), "the drag starts on the content").toBe(true);
    const after = await settledBox(drawing);
    expect(after.left - before.left).toBeLessThanOrEqual(drag.x / 2);
    expect(after.top - before.top).toBeLessThanOrEqual(drag.y / 2);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(layoutTolerance);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(layoutTolerance);
  },
};

export const RerenderKeepsZoom: Story = {
  render: () => <LiveSitePlanBlock />,
  play: async ({ canvasElement }) => {
    await showViewport(desktop);
    const { dialog, drawing, fitted } = await expandSitePlan(canvasElement);
    await wheelAt(pointIn(fitted, 0.3, 0.4), -wheelNotch);
    await waitFor(() => expect(box(drawing).width).toBeGreaterThan(fitted.width + layoutTolerance));
    const zoomed = await settledBox(drawing);

    // A programmatic click only triggers the re-render; it is not a pointer gesture on the content.
    within(dialog).getByRole("button", { name: "Next reading" }).click();
    await within(dialog).findByText("Reading 2");
    const updated = within(dialog).getByRole("img", { name: "Site plan drawing" });
    expectBox(await settledBox(updated), zoomed, layoutTolerance);
  },
};
