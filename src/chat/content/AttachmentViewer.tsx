import { useState } from "react";
import { Button } from "../../components/Button";
import { Image } from "../../components/Image";
import {
  Download,
  ExternalLink,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { ChatBlock } from "./ChatBlock";
import { isSameOriginHref, safeHref } from "./chat-links";
export type Attachment = {
  name: string;
  href?: string;
  downloadHref?: string;
  mediaType?: string;
  size?: string;
  trustedImageHref?: string;
};
export type AttachmentViewerProps = {
  attachment: Attachment;
  uploadState?: "idle" | "uploading" | "error" | "complete";
  uploadMessage?: string;
  onLoadImage?: () => void;
  onDownload?: () => void;
};
type ImageState =
  | { href: string; status: "loading" | "loaded" | "error" }
  | undefined;
const linkClassName =
  "inline-flex items-center gap-ui-icon-text rounded border border-ui-border px-3 py-2 text-sm text-ui-accent underline focus:outline-hidden focus:ring-2 focus:ring-ui-accent";
function isTrustedBlobUrl(value: string) {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(value);
    return url.protocol === "blob:" && url.origin === window.location.origin;
  } catch {
    return false;
  }
}
export function AttachmentViewer({
  attachment,
  uploadState = "complete",
  uploadMessage,
  onLoadImage,
  onDownload,
}: AttachmentViewerProps) {
  const [imageState, setImageState] = useState<ImageState>();
  const safeAttachmentHref = safeHref(attachment.href);
  const localAttachmentHref =
    safeAttachmentHref && isSameOriginHref(safeAttachmentHref)
      ? safeAttachmentHref
      : undefined;
  const externalImageHref =
    safeAttachmentHref &&
    /^https?:\/\//.test(safeAttachmentHref) &&
    !localAttachmentHref
      ? safeAttachmentHref
      : undefined;
  const trustedImageHref =
    attachment.trustedImageHref && isTrustedBlobUrl(attachment.trustedImageHref)
      ? attachment.trustedImageHref
      : undefined;
  const imageHref = trustedImageHref ?? localAttachmentHref;
  const safeDownloadHref = safeHref(attachment.downloadHref);
  const localDownloadHref =
    safeDownloadHref && isSameOriginHref(safeDownloadHref)
      ? safeDownloadHref
      : undefined;
  const image = attachment.mediaType?.startsWith("image/");
  const imageStatus =
    imageState && imageState.href === imageHref ? imageState.status : undefined;
  const upload = uploadState !== "complete" && (
    <p
      role={uploadState === "error" ? "alert" : "status"}
      className="mt-2 text-sm text-ui-muted-foreground"
    >
      {uploadMessage ??
        (uploadState === "uploading"
          ? "Uploading attachment…"
          : "Waiting to upload attachment.")}
    </p>
  );
  if (image)
    return (
      <ChatBlock
        title={attachment.name}
        icon={<ImageIcon aria-hidden="true" size={16} />}
        href={localDownloadHref}
        onTitleClick={onDownload}
        download={localDownloadHref ? attachment.name : undefined}
        expansion={imageHref ? "zoom" : undefined}
      >
        <div className="in-data-[content-block-viewport=expanded]:contents">
          {imageHref && (
            <Image
              src={imageHref}
              alt={attachment.name}
              className="mx-auto block h-auto max-w-full in-data-[content-block-viewport=expanded]:max-h-full in-data-[content-block-viewport=expanded]:object-contain"
              onLoad={() =>
                setImageState({ href: imageHref, status: "loaded" })
              }
              onError={() =>
                setImageState({ href: imageHref, status: "error" })
              }
            />
          )}
          <div className="in-data-[content-block-viewport=expanded]:hidden">
          {imageStatus === "error" && (
            <p className="mt-3 text-sm text-ui-muted-foreground" role="alert">
              Image failed to load. Try again.
            </p>
          )}
          {upload}
          <p className="mt-2 text-sm text-ui-muted-foreground">
            {[attachment.mediaType, attachment.size]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {externalImageHref ? (
            <div className="mt-3">
              <a
                href={externalImageHref}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                <ExternalLink size={14} />
                Open image in new tab
              </a>
            </div>
          ) : (
            (!imageHref || imageStatus === "error") && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    (!imageHref && !onLoadImage) || uploadState !== "complete"
                  }
                  onClick={() => {
                    if (!imageHref && !onLoadImage) return;
                    if (imageHref)
                      setImageState({ href: imageHref, status: "loading" });
                    onLoadImage?.();
                  }}
                >
                  {imageStatus === "error" ? "Retry image" : "Load image"}
                </Button>
              </div>
            )
          )}
          {(localDownloadHref ?? trustedImageHref) && (
            <div className="mt-3">
              <a
                href={localDownloadHref ?? trustedImageHref}
                download={attachment.name}
                className={linkClassName}
              >
                <Download size={14} />
                Download
              </a>
            </div>
          )}
          </div>
        </div>
      </ChatBlock>
    );
  return (
    <ChatBlock
      title={attachment.name}
      icon={<File aria-hidden="true" className="text-ui-accent" />}
    >
      <div className="p-3">
        <p className="text-sm text-ui-muted-foreground">
          {[attachment.mediaType, attachment.size]
            .filter(Boolean)
            .join(" · ") || "Attachment"}
        </p>
        {upload}
        <div className="mt-3 flex flex-wrap gap-2">
          {localDownloadHref ? (
            <a href={localDownloadHref} download className={linkClassName}>
              <Download size={14} />
              Download
            </a>
          ) : safeDownloadHref ? (
            <a
              href={safeDownloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              <ExternalLink size={14} />
              Open attachment
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
      </div>
    </ChatBlock>
  );
}
