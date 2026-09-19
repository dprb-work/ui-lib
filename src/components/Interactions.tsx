import { Dialog as RadixDialog, Tabs as RadixTabs, Tooltip as RadixTooltip } from "radix-ui";
import {
  Check,
  Copy,
  TriangleAlert,
} from "lucide-react";
import {
  createContext,
  type ComponentPropsWithRef,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cn } from "../cn";
import { tooltipSurfaceClassName } from "./tooltipStyles";
import { usePortalContainer } from "./portal-context";

export type OverlaySide = "top" | "right" | "bottom" | "left";
export type TabOption = { value: string; label: ReactNode; disabled?: boolean };

export type TabsProps = {
  id?: string;
  ariaLabel: string;
  tabs: readonly TabOption[];
  value: string;
  onValueChange: (value: string) => void;
  children: (tab: TabOption) => ReactNode;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  renderTabList?: (list: ReactElement) => ReactNode;
  forceMount?: boolean;
};

export function Tabs({
  id,
  ariaLabel,
  tabs,
  value,
  onValueChange,
  children,
  className,
  listClassName,
  triggerClassName,
  panelClassName,
  renderTabList,
  forceMount = false,
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabCount = tabs.length;
  const [indicator, setIndicator] = useState<{
    offset: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }

    const updateIndicator = () => {
      const activeTab = list.querySelector<HTMLElement>(
        '[role="tab"][data-state="active"]',
      );
      const nextIndicator = activeTab
        ? { offset: activeTab.offsetLeft, width: activeTab.offsetWidth }
        : null;
      setIndicator((currentIndicator) =>
        currentIndicator?.offset === nextIndicator?.offset &&
        currentIndicator?.width === nextIndicator?.width
          ? currentIndicator
          : nextIndicator,
      );
    };

    updateIndicator();
    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(list);
    for (const tab of list.querySelectorAll('[role="tab"]')) {
      resizeObserver.observe(tab);
    }
    return () => resizeObserver.disconnect();
  }, [tabCount, value]);

  const tabList = <RadixTabs.List
        ref={listRef}
        className={cn(
          "relative isolate mb-2 flex w-fit rounded-lg border border-ui-border bg-ui-muted",
          listClassName,
        )}
        aria-label={ariaLabel}
      >
        {indicator && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-[0.4375rem] bg-ui-surface transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.offset}px)`,
            }}
            data-ui-tabs-indicator=""
          />
        )}
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "relative z-10 rounded-[0.4375rem] px-3 py-2 text-sm text-ui-muted-foreground outline-hidden transition-colors duration-200 hover:text-ui-foreground focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ui-accent data-[state=active]:text-ui-foreground disabled:opacity-50 motion-reduce:transition-none",
              triggerClassName,
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>;

  return (
    <RadixTabs.Root id={id} className={className} value={value} onValueChange={onValueChange}>
      {renderTabList ? renderTabList(tabList) : tabList}
      {tabs.map((tab) => (
        <RadixTabs.Content
          key={tab.value}
          value={tab.value}
          forceMount={forceMount || undefined}
          className={cn(
            "outline-hidden data-[state=inactive]:hidden focus-visible:ring-2 focus-visible:ring-ui-accent",
            panelClassName,
          )}
          data-tab-label={typeof tab.label === "string" ? tab.label : undefined}
          tabIndex={0}
        >
          {children(tab)}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

type TooltipDefaults = {
  side: OverlaySide;
  sideOffset: number;
  collisionPadding: number;
  className?: string;
};

const TooltipContext = createContext<TooltipDefaults | null>(null);

export type TooltipProviderProps = ComponentPropsWithoutRef<typeof RadixTooltip.Provider> & {
  children: ReactNode;
  side?: OverlaySide;
  sideOffset?: number;
  collisionPadding?: number;
  className?: string;
};

export function TooltipProvider({
  children,
  side = "bottom",
  sideOffset = 7,
  collisionPadding = 8,
  className,
  delayDuration = 350,
  skipDelayDuration = 100,
  ...providerProps
}: TooltipProviderProps) {
  return (
    <TooltipContext.Provider value={{ side, sideOffset, collisionPadding, className }}>
      <RadixTooltip.Provider {...providerProps} delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
        {children}
      </RadixTooltip.Provider>
    </TooltipContext.Provider>
  );
}

export type TooltipProps = {
  label?: ReactNode | false;
  children: ReactElement;
  side?: OverlaySide;
  delayDuration?: number;
  className?: string;
  arrowClassName?: string;
};

export function Tooltip({
  label,
  children,
  side,
  delayDuration,
  className,
  arrowClassName,
}: TooltipProps) {
  const defaults = useContext(TooltipContext);
  const portalContainer = usePortalContainer();
  if (label === false || label == null) return children;

  const tooltip = (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal container={portalContainer}>
        <RadixTooltip.Content
          className={cn(tooltipSurfaceClassName, defaults?.className, className)}
          side={side ?? defaults?.side ?? "bottom"}
          sideOffset={defaults?.sideOffset ?? 7}
          collisionPadding={defaults?.collisionPadding ?? 8}
        >
          {label}
          {arrowClassName !== undefined && <RadixTooltip.Arrow className={arrowClassName} />}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );

  return defaults ? tooltip : (
    <RadixTooltip.Provider delayDuration={delayDuration ?? 350} skipDelayDuration={100}>
      {tooltip}
    </RadixTooltip.Provider>
  );
}

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAutoFocus?: ComponentPropsWithoutRef<typeof RadixDialog.Content>["onOpenAutoFocus"];
  title: ReactNode;
  trigger: ReactElement;
  children: ReactNode | ((close: () => void) => ReactNode);
  overlayClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  unstyled?: boolean;
};

export function Dialog({
  open,
  onOpenChange,
  onOpenAutoFocus,
  title,
  trigger,
  children,
  overlayClassName,
  contentClassName,
  titleClassName,
  unstyled = false,
}: DialogProps) {
  const portalContainer = usePortalContainer();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal container={portalContainer}>
        <RadixDialog.Overlay
          className={cn(!unstyled && "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", overlayClassName)}
        />
        <RadixDialog.Content
          onOpenAutoFocus={onOpenAutoFocus}
          className={cn(
            !unstyled && "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl bg-ui-surface p-5 text-ui-surface-foreground shadow-2xl outline-hidden",
            contentClassName,
          )}
          aria-describedby={undefined}
        >
          <RadixDialog.Title className={cn(!unstyled && "sr-only", titleClassName)}>{title}</RadixDialog.Title>
          {typeof children === "function" ? children(() => onOpenChange(false)) : children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}


async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    try {
      input.select();
      if (!document.execCommand("copy")) throw new Error("The browser rejected the clipboard operation.");
    } finally {
      input.remove();
      activeElement?.focus();
    }
  }
}

export type CopyButtonProps = Omit<ComponentPropsWithRef<"button">, "aria-label" | "children" | "title" | "type"> & {
  text: string;
  label?: string;
  copiedLabel?: string;
  failedLabel?: string;
  resetAfter?: number;
  tooltip?: ReactNode | false;
};

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  failedLabel = "Copy failed",
  resetAfter = 1600,
  tooltip,
  className,
  ref,
  onClick,
  ...buttonProps
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const accessibleLabel = status === "copied" ? copiedLabel : status === "failed" ? failedLabel : label;

  async function copy() {
    try {
      await copyText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), resetAfter);
  }

  const button = (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-ui-muted-foreground outline-hidden hover:bg-ui-muted hover:text-ui-foreground focus-visible:ring-2 focus-visible:ring-ui-accent",
        className,
      )}
      aria-label={accessibleLabel}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) void copy();
      }}
    >
      {status === "copied" ? <Check className="size-4 shrink-0" aria-hidden="true" /> : status === "failed" ? <TriangleAlert className="size-4 shrink-0" aria-hidden="true" /> : <Copy className="size-4 shrink-0" aria-hidden="true" />}
    </button>
  );

  return <Tooltip label={tooltip === undefined ? accessibleLabel : tooltip}>{button}</Tooltip>;
}
