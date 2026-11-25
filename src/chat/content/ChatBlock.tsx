import { ContentBlock, type ContentBlockProps } from "../../components/ContentBlock";
import type { ReactNode } from "react";
import { CodeLanguageIcon } from "./CodeLanguageIcon";
import { safeHref } from "./chat-links";
import { useChatPresentation } from "./ChatPresentation";

export type ChatBlockProps = Omit<ContentBlockProps, "label" | "title" | "icon"> & {
  title: string;
  /** Accessible name when it should say more than the title; defaults to the title. */
  label?: string;
  href?: string;
  onTitleClick?: () => void;
  download?: string;
  language?: string;
  busy?: boolean;
  icon?: ReactNode;
};
const titleLinkClassName =
  "cursor-pointer text-left underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ui-accent";
export function ChatBlock({
  title,
  label = title,
  href,
  onTitleClick,
  download,
  language,
  icon,
  busy = false,
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
      {...props}
      label={label}
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
    >
      {children}
    </ContentBlock>
  );
}
