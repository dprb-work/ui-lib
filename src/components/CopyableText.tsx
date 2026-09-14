import type { ReactNode } from "react";

import { cn } from "../cn";
import { CopyButton } from "./Interactions";

export type CopyableTextProps = {
  text: string;
  copyLabel: string;
  label?: ReactNode;
  className?: string;
  copyButtonClassName?: string;
};

export function CopyableText({
  text,
  copyLabel,
  label,
  className,
  copyButtonClassName,
}: CopyableTextProps) {
  return (
    <div className={cn("flex min-w-0 items-start gap-2", className)}>
      <div className="min-w-0 flex-1">
        {label}
        <code className="block break-all text-sm text-ui-muted-foreground">{text}</code>
      </div>
      <CopyButton
        className={cn("min-h-11 shrink-0", copyButtonClassName)}
        text={text}
        label={copyLabel}
      />
    </div>
  );
}
