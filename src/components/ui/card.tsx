import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border bg-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 pt-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardAction({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        "-mx-2 -my-3.5 ml-1 px-2 py-3.5 text-xs font-semibold text-primary",
        className,
      )}
      {...props}
    />
  );
}
