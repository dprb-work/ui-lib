import type { ReactNode } from "react";


export type BreadcrumbItem = {
  key: string;
  label: ReactNode;
  onClick?: () => void;
  href?: string;
  current?: boolean;
};

export type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
  "aria-label": string;
  className?: string;
};

export function Breadcrumbs({ items, "aria-label": ariaLabel, className }: BreadcrumbsProps) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ui-muted-foreground">
        {items.map((item, index) => {
          const current = item.current ?? index === items.length - 1;
          const content = current ? (
            <span aria-current="page" className="min-w-0 max-w-full [overflow-wrap:anywhere] text-ui-foreground">
              {item.label}
            </span>
          ) : item.href ? (
            <a className="min-w-0 max-w-full [overflow-wrap:anywhere] rounded-xs outline-hidden hover:text-ui-foreground focus-visible:ring-2 focus-visible:ring-ui-accent" href={item.href} onClick={item.onClick}>
              {item.label}
            </a>
          ) : item.onClick ? (
            <button
              type="button"
              className="min-w-0 max-w-full [overflow-wrap:anywhere] rounded-xs outline-hidden hover:text-ui-foreground focus-visible:ring-2 focus-visible:ring-ui-accent"
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ) : (
            <span className="min-w-0 max-w-full [overflow-wrap:anywhere]">{item.label}</span>
          );

          return (
            <li key={item.key} className="flex min-w-0 max-w-full items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {content}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
