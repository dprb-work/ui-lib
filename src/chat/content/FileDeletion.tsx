import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { FileExcerpt } from "./FileExcerpt";
import { RawRequest } from "./RawRequest";
export type FileDeletion = {
  path: string;
  removedContent?: string;
  state: "pending" | "confirmed" | "failed";
};
export type FileDeletionProps = { deletion: FileDeletion; rawInput: string };
export function FileDeletion({ deletion, rawInput }: FileDeletionProps) {
  const status =
    deletion.state === "confirmed"
      ? {
          label: "Deleted",
          icon: <CheckCircle2 aria-hidden="true" className="size-4" />,
          className: "text-ui-danger",
        }
      : deletion.state === "failed"
        ? {
            label: "Deletion failed",
            icon: <AlertCircle aria-hidden="true" className="size-4" />,
            className: "text-ui-danger",
          }
        : {
            label: "Deletion pending",
            icon: (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-[spin_.8s_linear_infinite] motion-reduce:animate-none"
              />
            ),
            className: "text-ui-muted-foreground",
          };
  return (
    <div className="space-y-2 p-3">
      <p
        role="status"
        className={`inline-flex items-center gap-1 text-sm ${status.className}`}
      >
        {status.icon}
        {status.label}
      </p>
      <p className="text-sm text-ui-muted-foreground">
        {deletion.state === "confirmed"
          ? "The supplied deletion record explicitly confirms this file deletion."
          : deletion.state === "failed"
            ? "The supplied deletion record reports a failure. The file may still exist."
            : "The supplied deletion record is pending. The file is not marked deleted."}
      </p>
      {deletion.removedContent !== undefined ? (
        <FileExcerpt path={deletion.path} excerpt={deletion.removedContent} />
      ) : (
        <p className="text-xs text-ui-muted-foreground">
          The supplied deletion record did not include removed file content.
        </p>
      )}
      <RawRequest input={rawInput} />
      <p className="text-xs text-ui-muted-foreground">
        Source: supplied deletion record. This renderer does not verify
        filesystem state.
      </p>
    </div>
  );
}
