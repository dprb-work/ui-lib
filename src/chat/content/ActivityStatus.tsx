import { LoaderCircle, Square, X } from "lucide-react";
import { Tooltip } from "../../components/Interactions";
export type OperationState =
  | "idle"
  | "running"
  | "completed"
  | "error"
  | "stopped";
export function ActivityStatus({ state }: { state: OperationState }) {
  if (state === "completed") return null;
  const label =
    state === "running"
      ? "Running"
      : state === "error"
        ? "Failed"
        : state === "stopped"
          ? "Stopped"
          : "Recorded";
  return (
    <Tooltip label={label}>
      <span
        role="status"
        className={`grid place-items-center ${state === "error" ? "text-ui-danger" : "text-ui-muted-foreground"}`}
      >
        {state === "running" ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-3.5 animate-[spin_.8s_linear_infinite] motion-reduce:animate-none"
          />
        ) : state === "error" ? (
          <X aria-hidden="true" className="size-3.5" />
        ) : state === "stopped" ? (
          <Square aria-hidden="true" className="size-3.5" fill="currentColor" />
        ) : (
          <span
            aria-hidden="true"
            className="size-2 rounded-full border border-current"
          />
        )}
        <span className="sr-only">{label}</span>
      </span>
    </Tooltip>
  );
}
