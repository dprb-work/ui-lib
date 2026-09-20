import type { ReactNode } from "react";

import { cn } from "../../cn";
import { useChatPresentation } from "../content/ChatPresentation";

export type ComposerFrameProps = {
  running: boolean;
  onSubmit: () => void;
  children: ReactNode;
  context: ReactNode;
  controls: ReactNode;
  actions: ReactNode;
  notices?: ReactNode;
  className?: string;
};

export function ComposerFrame({
  running,
  onSubmit,
  children,
  context,
  controls,
  actions,
  notices,
  className,
}: ComposerFrameProps) {
  const { density } = useChatPresentation();
  return (
    <div
      className={cn(
        "composer-area",
        density === "compact" && "composer-area--compact",
        className,
      )}
      role="group"
      aria-label="Message composer"
      data-running={running}
    >
      {context}
      {notices}
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {children}
        <div className="composer-actions">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {controls}
          </div>
          {actions}
        </div>
      </form>
    </div>
  );
}
