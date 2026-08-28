import { Dialog as RadixDialog, Tabs as RadixTabs, Tooltip as RadixTooltip } from "radix-ui";
import {
  Check,
  Copy,
  TriangleAlert,
} from "lucide-react";
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "../cn";
import { tooltipSurfaceClassName } from "./tooltipStyles";

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
  forceMount = false,
}: TabsProps) {
  return (
    <RadixTabs.Root id={id} className={className} value={value} onValueChange={onValueChange}>
      <RadixTabs.List
        className={cn("flex gap-1 border-b border-ui-border", listClassName)}
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm text-ui-muted-foreground outline-hidden hover:text-ui-foreground focus-visible:ring-2 focus-visible:ring-ui-accent data-[state=active]:border-ui-accent data-[state=active]:font-semibold data-[state=active]:text-ui-foreground disabled:opacity-50",
              triggerClassName,
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content
          key={tab.value}
          value={tab.value}
          forceMount={forceMount || undefined}
          className={cn("outline-hidden data-[state=inactive]:hidden focus-visible:ring-2 focus-visible:ring-ui-accent", panelClassName)}
          data-tab-label={typeof tab.label === "string" ? tab.label : undefined}
          tabIndex={0}
        >
          {children(tab)}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

export type TooltipProps = {
  label: ReactNode;
  children: ReactElement;
  side?: OverlaySide;
  delayDuration?: number;
  className?: string;
  arrowClassName?: string;
};

export function Tooltip({
  label,
  children,
  side = "top",
  delayDuration = 350,
  className,
  arrowClassName,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={100}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className={cn(tooltipSurfaceClassName, className)}
            side={side}
            sideOffset={7}
            collisionPadding={8}
          >
            {label}
            <RadixTooltip.Arrow
              className={cn("fill-ui-tooltip", arrowClassName)}
              width={10}
              height={5}
            />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  title,
  trigger,
  children,
  overlayClassName,
  contentClassName,
  titleClassName,
  unstyled = false,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={cn(!unstyled && "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", overlayClassName)}
        />
        <RadixDialog.Content
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

export type CopyButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  failedLabel?: string;
  resetAfter?: number;
  className?: string;
};

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  failedLabel = "Copy failed",
  resetAfter = 1600,
  className,
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

  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-ui-muted-foreground outline-hidden hover:bg-ui-muted hover:text-ui-foreground focus-visible:ring-2 focus-visible:ring-ui-accent",
        className,
      )}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onClick={() => void copy()}
    >
      {status === "copied" ? <Check aria-hidden="true" /> : status === "failed" ? <TriangleAlert aria-hidden="true" /> : <Copy aria-hidden="true" />}
    </button>
  );
}
