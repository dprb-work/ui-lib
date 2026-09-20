import { ArrowUp, LoaderCircle, Square } from "lucide-react";

import { cn } from "../../cn";
import { IconButton } from "../../components/IconButton";

export type ComposerSubmitButtonProps = {
  running: boolean;
  hasText: boolean;
  canSend: boolean;
  canStop: boolean;
  onStop: () => void;
  pendingLabel?: string;
  className?: string;
};

export function ComposerSubmitButton({
  running,
  hasText,
  canSend,
  canStop,
  onStop,
  pendingLabel,
  className,
}: ComposerSubmitButtonProps) {
  const stopping = running && !hasText;
  const label = stopping
    ? "Stop response"
    : (pendingLabel ?? (running ? "Queue message" : "Send"));

  return (
    <IconButton
      type={stopping ? "button" : "submit"}
      variant="primary"
      label={label}
      aria-busy={running}
      disabled={stopping ? !canStop : !canSend}
      onClick={stopping ? onStop : undefined}
      className={cn("composer-submit", className)}
      data-running={running}
    >
      {running && (
        <LoaderCircle
          aria-hidden="true"
          className="composer-submit-spinner size-4"
        />
      )}
      <span className="composer-submit-action">
        {stopping ? (
          <Square aria-hidden="true" className="size-4" />
        ) : (
          <ArrowUp aria-hidden="true" className="size-4" />
        )}
      </span>
    </IconButton>
  );
}
