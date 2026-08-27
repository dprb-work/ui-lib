import { Dialog as RadixDialog, Popover, Tabs as RadixTabs, Tooltip as RadixTooltip } from "radix-ui";
import {
  Check,
  Copy,
  Monitor,
  Moon,
  Sun,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "../cn";

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
        className={cn("flex gap-1 border-b border-slate-200 dark:border-slate-700", listClassName)}
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "border-b-2 border-transparent px-3 py-2 text-sm text-slate-600 outline-hidden hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ui-accent data-[state=active]:border-ui-accent data-[state=active]:font-semibold data-[state=active]:text-slate-950 disabled:opacity-50 dark:text-slate-300 dark:data-[state=active]:text-white",
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
          className={cn("outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent", panelClassName)}
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
            className={cn(
              "z-50 max-w-64 rounded-md bg-slate-950 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-950",
              className,
            )}
            side={side}
            sideOffset={7}
            collisionPadding={8}
          >
            {label}
            <RadixTooltip.Arrow
              className={cn("fill-slate-950 dark:fill-slate-100", arrowClassName)}
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
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={cn("fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", overlayClassName)}
        />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl bg-white p-5 text-slate-950 shadow-2xl outline-hidden dark:bg-slate-950 dark:text-white",
            contentClassName,
          )}
          aria-describedby={undefined}
        >
          <RadixDialog.Title className={cn("sr-only", titleClassName)}>{title}</RadixDialog.Title>
          {typeof children === "function" ? children(() => onOpenChange(false)) : children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type InfoPopoverProps = {
  label: string;
  description?: ReactNode;
  children: ReactNode;
  side?: OverlaySide;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  arrowClassName?: string;
  printLabelClassName?: string;
};

export function InfoPopover({
  label,
  description,
  children,
  side = "top",
  className,
  triggerClassName,
  contentClassName,
  arrowClassName,
  printLabelClassName,
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const pinned = useRef(false);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function show() {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function hideSoon() {
    window.clearTimeout(closeTimer.current);
    if (!pinned.current) closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) pinned.current = false;
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <span className={cn("inline-flex", className)} onMouseEnter={show} onMouseLeave={hideSoon} onFocus={show} onBlur={hideSoon}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn("inline-flex cursor-help items-center rounded outline-hidden focus-visible:ring-2 focus-visible:ring-ui-accent", triggerClassName)}
            aria-label={label}
            onClick={(event) => {
              if (!open) {
                pinned.current = true;
                return;
              }
              event.preventDefault();
              if (pinned.current) {
                pinned.current = false;
                setOpen(false);
              } else {
                pinned.current = true;
              }
            }}
          >
            {children}
          </button>
        </Popover.Trigger>
        {printLabelClassName && <span className={printLabelClassName}>{label}</span>}
        <Popover.Portal>
          <Popover.Content
            className={cn(
              "z-50 max-w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
              contentClassName,
            )}
            side={side}
            sideOffset={8}
            collisionPadding={10}
            onMouseEnter={show}
            onMouseLeave={hideSoon}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <strong className="block text-slate-950 dark:text-white">{label}</strong>
            {description && <span>{description}</span>}
            <Popover.Arrow className={cn("fill-white dark:fill-slate-900", arrowClassName)} width={12} height={6} />
          </Popover.Content>
        </Popover.Portal>
      </span>
    </Popover.Root>
  );
}

export type ThemeMode = "system" | "light" | "dark";

export type ThemeSelectorProps = {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  label?: string;
  hideLabel?: boolean;
  className?: string;
  groupClassName?: string;
  buttonClassName?: string;
};

const themeOptions: ReadonlyArray<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeSelector({
  mode,
  onChange,
  label = "Theme",
  hideLabel = false,
  className,
  groupClassName,
  buttonClassName,
}: ThemeSelectorProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      {!hideLabel && <span className="text-sm font-medium">{label}</span>}
      <div
        className={cn("inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800", groupClassName)}
        role="group"
        aria-label={label}
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-slate-600 outline-hidden hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ui-accent aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-slate-950 aria-pressed:shadow-sm dark:text-slate-300 dark:hover:text-white dark:aria-pressed:bg-slate-950 dark:aria-pressed:text-white",
                buttonClassName,
              )}
              onClick={() => onChange(option.value)}
            >
              <Icon aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
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
        "inline-flex size-8 items-center justify-center rounded-md text-slate-600 outline-hidden hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ui-accent dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
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
