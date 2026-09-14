import { X } from "lucide-react";
import { type ReactElement, type ReactNode, useState } from "react";
import { cn } from "../cn";
import { IconButton } from "./IconButton";
import { Dialog } from "./Interactions";

export type FullscreenProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  trigger: ReactElement;
  children: ReactNode;
  closeLabel: string;
  className?: string | undefined;
  overlayClassName?: string | undefined;
  zoomable?: boolean | undefined;
};

export function Fullscreen({ open, onOpenChange, title, trigger, children, closeLabel, className, overlayClassName, zoomable = false }: FullscreenProps) {
  const [zoom, setZoom] = useState(1);
  return (
    <Dialog
      unstyled
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      trigger={trigger}
      overlayClassName={cn("fixed inset-0 z-40 bg-black/70 backdrop-blur-sm", overlayClassName)}
      contentClassName={cn("fixed inset-3 z-50 grid max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] place-items-center overflow-hidden rounded-lg bg-ui-surface p-3 text-ui-surface-foreground shadow-2xl outline-hidden sm:inset-6 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]", className)}
    >
      <>
        {zoomable ? (
          <div className="relative max-h-full max-w-full overflow-auto">
            <div className="absolute left-1 top-1 z-10 flex gap-1 rounded bg-ui-surface/90 p-1 shadow">
              <button type="button" aria-label="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.25))} className="size-8 rounded hover:bg-ui-muted disabled:opacity-40">−</button>
              <button type="button" aria-label="Reset zoom" onClick={() => setZoom(1)} className="min-w-8 rounded px-1 text-xs hover:bg-ui-muted">{Math.round(zoom * 100)}%</button>
              <button type="button" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + 0.25))} className="size-8 rounded hover:bg-ui-muted disabled:opacity-40">+</button>
            </div>
            <div style={{ width: `${zoom * 100}%` }}>{children}</div>
          </div>
        ) : <div className="max-h-full max-w-full overflow-auto">{children}</div>}
        <IconButton label={closeLabel} className="absolute right-3 top-3 z-20 bg-ui-surface/90" onClick={() => onOpenChange(false)}><X aria-hidden="true" /></IconButton>
      </>
    </Dialog>
  );
}
