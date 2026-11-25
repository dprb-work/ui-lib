import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";

import { cn } from "../cn";
import { IconButton } from "./IconButton";

// Scale 1 is the fitted view. The wheel multiplies the scale by exp(-deltaY * wheelRate),
// so one 100px notch is about 16 percent; keys step by keyStep, a click by clickStep.
const zoom = {
  minimum: 0.25,
  maximum: 8,
  wheelRate: 0.0015,
  wheelLinePixels: 16,
  keyStep: 1.25,
  clickStep: 2,
  dragThreshold: 3,
} as const;

export type ZoomView = { scale: number; x: number; y: number };
type Size = { width: number; height: number };
type Point = { x: number; y: number };

export const fittedView: ZoomView = { scale: 1, x: 0, y: 0 };

function isFitted(view: ZoomView) {
  return view.scale === fittedView.scale && view.x === fittedView.x && view.y === fittedView.y;
}

// Keep the scaled layer over the viewport's center so the content never leaves the view.
// A stricter bound (covering the viewport) would move the point under the pointer when zooming out.
function clampedView(view: ZoomView, size: Size): ZoomView {
  const scale = Math.min(zoom.maximum, Math.max(zoom.minimum, view.scale));
  const centerX = size.width / 2;
  const centerY = size.height / 2;
  return {
    scale,
    x: Math.min(centerX, Math.max(centerX - size.width * scale, view.x)),
    y: Math.min(centerY, Math.max(centerY - size.height * scale, view.y)),
  };
}

// Scale around a viewport point so the content under it stays in place.
function zoomedAt(view: ZoomView, factor: number, anchor: Point, size: Size): ZoomView {
  const scale = Math.min(zoom.maximum, Math.max(zoom.minimum, view.scale * factor));
  const ratio = scale / view.scale;
  return clampedView({ scale, x: anchor.x - (anchor.x - view.x) * ratio, y: anchor.y - (anchor.y - view.y) * ratio }, size);
}

function zoomedAtCenter(view: ZoomView, factor: number, viewport: HTMLElement): ZoomView {
  const box = viewport.getBoundingClientRect();
  return zoomedAt(view, factor, { x: box.width / 2, y: box.height / 2 }, box);
}

type ViewChange = (change: (view: ZoomView) => ZoomView) => void;

export type ZoomControlsProps = {
  view: ZoomView;
  onViewChange: ViewChange;
  zoomDirection: "in" | "out" | null;
  onZoomDirectionChange: (direction: "in" | "out" | null) => void;
  buttonClassName: string;
};

export function ZoomControls({ view, onViewChange, zoomDirection, onZoomDirectionChange, buttonClassName }: ZoomControlsProps) {
  const fitted = isFitted(view);
  return (
    <>
      <IconButton label="Zoom in" className={buttonClassName} aria-pressed={zoomDirection === "in"} onClick={() => onZoomDirectionChange(zoomDirection === "in" ? null : "in")}>
        <ZoomIn aria-hidden="true" />
      </IconButton>
      <IconButton label="Zoom out" className={buttonClassName} aria-pressed={zoomDirection === "out"} onClick={() => onZoomDirectionChange(zoomDirection === "out" ? null : "out")}>
        <ZoomOut aria-hidden="true" />
      </IconButton>
      <IconButton label="Reset view" className={buttonClassName} disabled={fitted} onClick={() => onViewChange(() => fittedView)}>
        <Scan aria-hidden="true" />
      </IconButton>
    </>
  );
}

type Gesture =
  | { kind: "pan"; origin: Point; view: ZoomView; dragged: boolean }
  | { kind: "pinch"; distance: number; midpoint: Point; view: ZoomView };

// Pointer-downs on these keep their normal click behavior; they never pan, pinch or click-zoom.
const interactiveSelector = "a, button, input, select, textarea, label, [role='button'], [role='tab'], [contenteditable='true']";

function isInteractive(target: EventTarget) {
  return target instanceof Element && target.closest(interactiveSelector) !== null;
}

function localPoint(event: { clientX: number; clientY: number; currentTarget: Element }): Point {
  const box = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function midpointOf(first: Point, second: Point): Point {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

export type ZoomViewportProps = {
  view: ZoomView;
  viewport: RefObject<HTMLDivElement | null>;
  onViewChange: ViewChange;
  zoomDirection: "in" | "out" | null;
  children: ReactNode;
};

export function ZoomViewport({ view, viewport, onViewChange, zoomDirection, children }: ZoomViewportProps) {
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  // A drag that panned must not also count as a click-to-zoom click.
  const suppressClick = useRef(false);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    // React registers wheel listeners as passive; zooming must cancel the page scroll and the browser zoom.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const box = element.getBoundingClientRect();
      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * zoom.wheelLinePixels : event.deltaY;
      onViewChange((current) => zoomedAt(current, Math.exp(-delta * zoom.wheelRate), { x: event.clientX - box.left, y: event.clientY - box.top }, box));
    };
    // Keys work anywhere in the expanded view; Escape stays with the dialog.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "+" || event.key === "=") onViewChange((current) => zoomedAtCenter(current, zoom.keyStep, element));
      else if (event.key === "-") onViewChange((current) => zoomedAtCenter(current, 1 / zoom.keyStep, element));
      else if (event.key === "0") onViewChange(() => fittedView);
      else return;
      event.preventDefault();
    };
    // Resizing and rotating keep the zoom and only pull the layer back into view.
    const resize = new ResizeObserver(() => onViewChange((current) => clampedView(current, element.getBoundingClientRect())));
    element.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    resize.observe(element);
    return () => {
      element.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      resize.disconnect();
    };
  }, [viewport, onViewChange]);

  function startGesture() {
    const [first, second] = [...pointers.current.values()];
    if (first && second) {
      gesture.current = { kind: "pinch", distance: Math.hypot(first.x - second.x, first.y - second.y), midpoint: midpointOf(first, second), view };
    } else if (first && !isFitted(view)) {
      gesture.current = { kind: "pan", origin: first, view, dragged: false };
    } else {
      gesture.current = null;
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (isInteractive(event.target)) return;
    suppressClick.current = false;
    pointers.current.set(event.pointerId, localPoint(event));
    startGesture();
    if (gesture.current) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, localPoint(event));
    const active = gesture.current;
    const box = event.currentTarget.getBoundingClientRect();
    const [first, second] = [...pointers.current.values()];
    if (active?.kind === "pinch" && first && second) {
      // Move the starting view with the fingers' midpoint, then scale around the current midpoint.
      const midpoint = midpointOf(first, second);
      const moved = { ...active.view, x: active.view.x + midpoint.x - active.midpoint.x, y: active.view.y + midpoint.y - active.midpoint.y };
      onViewChange(() => zoomedAt(moved, Math.hypot(first.x - second.x, first.y - second.y) / active.distance, midpoint, box));
    } else if (active?.kind === "pan" && first) {
      const offset = { x: first.x - active.origin.x, y: first.y - active.origin.y };
      if (Math.hypot(offset.x, offset.y) > zoom.dragThreshold) active.dragged = true;
      onViewChange(() => clampedView({ ...active.view, x: active.view.x + offset.x, y: active.view.y + offset.y }, box));
    }
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current?.kind === "pan" && gesture.current.dragged) suppressClick.current = true;
    pointers.current.delete(event.pointerId);
    startGesture();
  }

  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (zoomDirection === null || isInteractive(event.target)) return;
    const box = event.currentTarget.getBoundingClientRect();
    const anchor = { x: event.clientX - box.left, y: event.clientY - box.top };
    const factor = zoomDirection === "out" ? 1 / zoom.clickStep : zoom.clickStep;
    onViewChange((current) => zoomedAt(current, factor, anchor, box));
  }

  return (
    <div // NOSONAR(S6848,S1082): pointer gesture surface; keyboard zoom lives in the zoom buttons and the +, -, 0 keys
      ref={viewport}
      data-content-block-viewport="expanded"
      className={cn(
        "relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-ui-background",
        !isFitted(view) && "cursor-grab active:cursor-grabbing",
        zoomDirection === "in" && "cursor-zoom-in",
        zoomDirection === "out" && "cursor-zoom-out",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClick={onClick}
    >
      <div className="size-full origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <div className="grid size-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] [place-items:safe_center]">{children}</div>
      </div>
    </div>
  );
}
