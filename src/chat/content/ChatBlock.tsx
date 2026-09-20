import { ContentBlock } from "../../components/ContentBlock";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CodeLanguageIcon } from "./CodeLanguageIcon";
import { safeHref } from "./chat-links";
import { useChatPresentation } from "./ChatPresentation";

export type ChatBlockProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> & {
  title: string;
  href?: string;
  onTitleClick?: () => void;
  download?: string;
  metadata?: readonly ReactNode[];
  language?: string;
  busy?: boolean;
  icon?: ReactNode;
  corner?: ReactNode;
  children: ReactNode;
};
const titleLinkClassName =
  "cursor-pointer text-left underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ui-accent";
export function ChatBlock({
  title,
  href,
  onTitleClick,
  download,
  metadata,
  language,
  icon,
  busy = false,
  corner,
  children,
  className,
  ...props
}: ChatBlockProps) {
  const { density } = useChatPresentation();
  const destination = safeHref(href);
  const externalDestination = Boolean(
    destination &&
      typeof window !== "undefined" &&
      new URL(destination, window.location.href).origin !== window.location.origin,
  );
  return (
    <ContentBlock
      aria-label={title}
      aria-busy={busy}
      className={[
        "chat-operation",
        density === "compact" && "chat-block--compact",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={
        destination ? (
          <a
            href={destination}
            download={download}
            {...(externalDestination
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={titleLinkClassName}
          >
            {title}
          </a>
        ) : onTitleClick ? (
          <button
            type="button"
            onClick={onTitleClick}
            className={titleLinkClassName}
          >
            {title}
          </button>
        ) : (
          title
        )
      }
      icon={icon ?? (language && <CodeLanguageIcon language={language} />)}
      metadata={metadata}
      corner={corner}
      {...props}
    >
      {children}
    </ContentBlock>
  );
}
