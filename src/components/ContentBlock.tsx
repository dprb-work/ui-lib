import { Maximize2, X } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  Fragment,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "../cn";
import { fittedView, ZoomControls, type ZoomView, ZoomViewport } from "./ContentZoom";
import { IconButton } from "./IconButton";
import { CopyButton, Dialog } from "./Interactions";

export type ContentBlockAction =
  | { kind: "button"; label: string; icon: ReactNode; onSelect: () => void; pressed?: boolean; disabled?: boolean }
  | { kind: "copy"; label: string; text: string };

export type ContentBlockExpansion = "scroll" | "zoom";

export type ContentBlockProps = Omit<ComponentPropsWithoutRef<"section">, "title" | "children" | "aria-label"> & {
  label: string;
  title?: ReactNode;
  icon?: ReactNode;
  metadata?: readonly ReactNode[] | undefined;
  actions?: readonly ContentBlockAction[];
  expansion?: ContentBlockExpansion;
  children: ReactNode;
};

// Touch screens get 44px targets; the icons stay the same size.
const controlClassName = "pointer-coarse:size-11";

type CaptionBarProps = {
  icon: ReactNode;
  title: ReactNode;
  metadata: readonly ReactNode[] | undefined;
  actions: readonly ContentBlockAction[];
  zoom: ReactNode;
  toggle: ReactNode;
};

function CaptionBar({ icon, title, metadata, actions, zoom, toggle }: CaptionBarProps) {
  const segments = metadata?.filter((segment) => segment != null && segment !== false) ?? [];
  return (
    <div
      data-content-block-caption
      className="flex min-h-10 shrink-0 items-center gap-2 border-t border-ui-border bg-ui-surface py-1 pr-2 pl-3 pb-[calc(0.25rem+env(safe-area-inset-bottom))] text-[.8125rem] text-ui-muted-foreground"
    >
      {zoom && <div className="flex shrink-0 items-center gap-0.5">{zoom}</div>}
      <div className="flex min-w-0 flex-1 items-center gap-ui-icon-text [&>svg]:size-4 [&>svg]:shrink-0">
        {icon}
        <span className="min-w-0 truncate">
          {title != null && <span className="font-medium text-ui-foreground">{title}</span>}
          {segments.map((segment, index) => (
            <Fragment key={index}>{/* NOSONAR(S6479): segments are positional and never reordered */}
              {(index > 0 || title != null) && <span aria-hidden="true" className="mx-1.5">·</span>}
              {segment}
            </Fragment>
          ))}
        </span>
      </div>
      <div data-content-block-controls className="flex shrink-0 items-center gap-0.5">
        {/* Keyed by position: a toggle may rename itself and must keep focus. */}
        {actions.map((action, index) =>
          action.kind === "copy" ? (
            <CopyButton key={index} text={action.text} label={action.label} className={controlClassName} /> // NOSONAR(S6479): actions are positional
          ) : (
            <IconButton
              key={index} // NOSONAR(S6479): actions are positional; a label change must keep the button and its focus
              label={action.label}
              className={controlClassName}
              aria-pressed={action.pressed}
              disabled={action.disabled}
              onClick={action.onSelect}
            >
              {action.icon}
            </IconButton>
          ),
        )}
        {toggle}
      </div>
    </div>
  );
}

type ExpandedBodyProps = Omit<CaptionBarProps, "zoom" | "toggle"> & {
  expansion: ContentBlockExpansion;
  onClose: () => void;
  children: ReactNode;
};

function ExpandedBody({ expansion, onClose, children, ...caption }: ExpandedBodyProps) {
  const [view, setView] = useState<ZoomView>(fittedView);
  const [zoomDirection, setZoomDirection] = useState<"in" | "out" | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const zoomable = expansion === "zoom";
  const close = (
    <IconButton label="Close" className={controlClassName} onClick={onClose}>
      <X aria-hidden="true" />
    </IconButton>
  );
  return (
    <>
      {zoomable ? (
        <ZoomViewport view={view} viewport={viewport} onViewChange={setView} zoomDirection={zoomDirection}>
          {children}
        </ZoomViewport>
      ) : (
        <div
          data-content-block-viewport="expanded"
          tabIndex={0} // NOSONAR(S6845): the expanded scroll area must be keyboard-focusable to scroll without a pointer
          className="flex min-h-0 flex-1 flex-col overflow-auto outline-hidden focus-visible:shadow-[inset_0_0_0_2px_var(--color-ui-accent-link)]"
        >
          {children}
        </div>
      )}
      <CaptionBar
        {...caption}
        zoom={zoomable && (
          <ZoomControls
            view={view}
            onViewChange={setView}
            zoomDirection={zoomDirection}
            onZoomDirectionChange={setZoomDirection}
            buttonClassName={controlClassName}
          />
        )}
        toggle={close}
      />
    </>
  );
}

const historyMarker = "ui-content-block-expanded";

export function ContentBlock({
  label,
  title,
  icon,
  metadata,
  actions = [],
  expansion,
  children,
  className,
  ...props
}: ContentBlockProps) {
  // While expanded, the inline viewport keeps its height so the page does not jump.
  const [expandedFrom, setExpandedFrom] = useState<number | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const expanded = expandedFrom !== null;

  // The back gesture or button closes the expanded view instead of leaving the page.
  useEffect(() => {
    if (!expanded) return;
    const onPopState = () => setExpandedFrom(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [expanded]);

  function onExpandedChange(open: boolean) {
    if (open) {
      // Keep the router's state; the marker tells Close whether the current entry is still ours.
      window.history.pushState({ ...window.history.state, [historyMarker]: true }, "");
      setExpandedFrom(viewport.current?.offsetHeight ?? 0);
      return;
    }
    setExpandedFrom(null);
    if (window.history.state?.[historyMarker] === true) window.history.back();
  }

  const caption = { icon, title, metadata, actions };
  const expand = expansion && (
    <Dialog
      unstyled
      open={expanded}
      onOpenChange={onExpandedChange}
      title={label}
      titleClassName="sr-only"
      onOpenAutoFocus={(event) => {
        // Focus the surface, not the first control, so no tooltip covers the content on open
        // and one Escape closes the view.
        event.preventDefault();
        if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
      }}
      trigger={
        <IconButton label="Expand" className={controlClassName}>
          <Maximize2 aria-hidden="true" />
        </IconButton>
      }
      overlayClassName="fixed inset-0 z-40 bg-black/80"
      contentClassName="ui-content-block-motion fixed inset-0 z-50 flex flex-col overflow-hidden bg-ui-background text-sm text-ui-foreground shadow-2xl outline-hidden sm:inset-auto sm:top-[10dvh] sm:left-[10vw] sm:h-[80dvh] sm:w-[80vw] sm:rounded-lg sm:border sm:border-ui-border"
    >
      <ExpandedBody {...caption} expansion={expansion} onClose={() => onExpandedChange(false)}>
        {children}
      </ExpandedBody>
    </Dialog>
  );

  return (
    <section
      {...props}
      aria-label={label}
      data-content-block
      className={cn(
        "flex max-h-[80dvh] min-w-0 flex-col overflow-hidden rounded-lg border border-ui-border bg-ui-background text-sm text-ui-foreground",
        className,
      )}
    >
      {/* A flex column, so content with its own scroller (min-h-0 overflow-auto) shrinks to the cap and owns its scrollbars. */}
      <div ref={viewport} data-content-block-viewport="inline" className="flex min-h-0 min-w-0 flex-col overflow-auto">
        {expanded ? <div style={{ height: expandedFrom }} /> : children}
      </div>
      <CaptionBar {...caption} zoom={null} toggle={expand} />
    </section>
  );
}
