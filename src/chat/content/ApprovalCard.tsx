import { Button } from "../../components/Button";
import { ShieldQuestion } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
export type ApprovalCardProps = {
  action: string;
  scope: string;
  description?: string;
  state?:
    | "pending"
    | "submitting"
    | "approved"
    | "rejected"
    | "cancelled"
    | "expired";
  error?: string;
  onDecision?: (decision: "approved" | "rejected") => void;
};
export function ApprovalCard(props: ApprovalCardProps) {
  return (
    <ApprovalForm
      key={JSON.stringify([props.action, props.scope])}
      {...props}
    />
  );
}
function ApprovalForm({
  action,
  scope,
  description,
  state = "pending",
  error,
  onDecision,
}: ApprovalCardProps) {
  const locked = state !== "pending" || !onDecision;
  return (
    <ChatBlock
      title="Approval required"
      icon={
        <ShieldQuestion
          size={18}
          className="text-ui-accent"
          aria-hidden="true"
        />
      }
      className="min-w-0 text-ui-foreground"
    >
      <div className="space-y-3 pt-6 px-4 pb-4">
        <p className="break-words font-medium">{action}</p>
        <p className="break-all text-xs text-ui-muted-foreground">{scope}</p>
        {description && (
          <p className="break-words text-sm text-ui-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-ui-danger">
            Decision not sent: {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={locked}
            onClick={() => {
              if (!locked) onDecision?.("approved");
            }}
          >
            Approve
          </Button>
          <Button
            variant="secondary"
            disabled={locked}
            onClick={() => {
              if (!locked) onDecision?.("rejected");
            }}
          >
            Reject
          </Button>
          <p aria-live="polite" className="text-xs text-ui-muted-foreground">
            {state === "approved"
              ? "Approved"
              : state === "rejected"
                ? "Rejected"
                : state === "cancelled"
                  ? "This approval request was cancelled"
                  : state === "expired"
                    ? "This approval request has expired"
                    : state === "submitting"
                      ? "Submitting decision…"
                      : ""}
          </p>
        </div>
      </div>
    </ChatBlock>
  );
}
