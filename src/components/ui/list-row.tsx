import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function List({
  className,
  ...props
}: HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("divide-y divide-border", className)} {...props} />;
}

interface ListRowProps extends Omit<HTMLAttributes<HTMLLIElement>, "title"> {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  interactive?: boolean;
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  chevron = false,
  interactive = false,
  className,
  ...props
}: ListRowProps) {
  return (
    <li
      className={cn(
        "flex min-h-14 items-center gap-3 px-4 py-3",
        interactive && "cursor-pointer transition-colors hover:bg-surface-sunken",
        className,
      )}
      {...props}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-3">{trailing}</div>
      ) : null}
      {chevron ? (
        <span
          aria-hidden
          className="material-symbols-outlined shrink-0 text-base text-faint"
        >
          chevron_right
        </span>
      ) : null}
    </li>
  );
}
