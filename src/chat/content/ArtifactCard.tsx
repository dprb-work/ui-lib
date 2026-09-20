import { Button } from "../../components/Button";
import { Download, ExternalLink, FileText } from "lucide-react";
import { ChatBlock } from "./ChatBlock";
import { safeHref } from "./chat-links";
export type ArtifactCardProps = {
  name: string;
  kind?: string;
  size?: string;
  revision?: string;
  href?: string;
  downloadHref?: string;
  unavailableReason?: string;
  onOpen?: () => void;
  onDownload?: () => void;
};
const linkClassName =
  "inline-flex items-center gap-1 rounded border border-ui-border px-3 py-2 text-sm text-ui-accent underline focus:outline-hidden focus:ring-2 focus:ring-ui-accent";
export function ArtifactCard({
  name,
  kind = "Artifact",
  size,
  revision,
  href,
  downloadHref,
  unavailableReason,
  onOpen,
  onDownload,
}: ArtifactCardProps) {
  const openHref = safeHref(href);
  const safeDownload = safeHref(downloadHref);
  const unavailable = Boolean(unavailableReason) || (!openHref && !onOpen && !safeDownload && !onDownload);
  return (
    <ChatBlock
      title={name}
      icon={
        <FileText className="text-ui-accent" aria-hidden="true" size={18} />
      }
    >
      <div className="pt-5 px-3 pb-3">
        <p className="text-sm text-ui-muted-foreground">
          {[kind, size, revision].filter(Boolean).join(" · ")}
        </p>
        {unavailable ? (
          <p role="status" className="mt-2 text-sm text-ui-muted-foreground">
            {unavailableReason ?? "Artifact is unavailable."}
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {openHref ? (
              <a
                href={openHref}
                target="_blank"
                rel="noreferrer"
                className={linkClassName}
              >
                <ExternalLink size={14} />
                Open
              </a>
            ) : (
              onOpen && (
                <Button type="button" variant="secondary" onClick={onOpen}>
                  <ExternalLink size={14} />
                  Open
                </Button>
              )
            )}
            {safeDownload ? (
              <a href={safeDownload} download className={linkClassName}>
                <Download size={14} />
                Download
              </a>
            ) : (
              onDownload && (
                <Button type="button" variant="secondary" onClick={onDownload}>
                  <Download size={14} />
                  Download
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </ChatBlock>
  );
}
