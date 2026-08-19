"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "radix-ui";
import type { ComponentProps, HTMLAttributes } from "react";

export function Dialog(props: ComponentProps<typeof DialogPrimitive.Dialog.Root>) {
  return <DialogPrimitive.Dialog.Root {...props} />;
}

export function DialogTrigger(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Trigger>,
) {
  return <DialogPrimitive.Dialog.Trigger {...props} />;
}

export function DialogClose(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Close>,
) {
  return <DialogPrimitive.Dialog.Close {...props} />;
}

export function DialogPortal(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Portal>,
) {
  return <DialogPrimitive.Dialog.Portal {...props} />;
}

export function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Dialog.Overlay>) {
  return (
    <DialogPrimitive.Dialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-ink/40 animate-in fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Dialog.Content>) {
  return (
    <DialogPrimitive.Dialog.Portal>
      <DialogOverlay />
      <DialogPrimitive.Dialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-48px)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-overlay border bg-surface p-5 shadow-overlay animate-in fade-in-0 zoom-in-95 duration-200 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-150",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Dialog.Content>
    </DialogPrimitive.Dialog.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function DialogTitle(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Title>,
) {
  return (
    <DialogPrimitive.Dialog.Title
      className="font-display text-lg font-semibold text-ink"
      {...props}
    />
  );
}

export function DialogDescription(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Description>,
) {
  return (
    <DialogPrimitive.Dialog.Description
      className="mt-1 text-sm text-muted"
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-5 flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}
