"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "radix-ui";
import type { ComponentProps, HTMLAttributes } from "react";

export function Sheet(props: ComponentProps<typeof DialogPrimitive.Dialog.Root>) {
  return <DialogPrimitive.Dialog.Root {...props} />;
}

export function SheetTrigger(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Trigger>,
) {
  return <DialogPrimitive.Dialog.Trigger {...props} />;
}

export function SheetClose(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Close>,
) {
  return <DialogPrimitive.Dialog.Close {...props} />;
}

export function SheetPortal(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Portal>,
) {
  return <DialogPrimitive.Dialog.Portal {...props} />;
}

export function SheetOverlay({
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

export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Dialog.Content>) {
  return (
    <DialogPrimitive.Dialog.Portal>
      <SheetOverlay />
      <DialogPrimitive.Dialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[600px] rounded-t-overlay border bg-surface shadow-overlay animate-in slide-in-from-bottom duration-200 data-closed:animate-out data-closed:slide-out-to-bottom data-closed:duration-150",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Dialog.Content>
    </DialogPrimitive.Dialog.Portal>
  );
}

export function SheetHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-5 pt-4",
        className,
      )}
      {...props}
    />
  );
}

export function SheetTitle(
  props: ComponentProps<typeof DialogPrimitive.Dialog.Title>,
) {
  return (
    <DialogPrimitive.Dialog.Title
      className="font-display text-lg font-semibold text-ink"
      {...props}
    />
  );
}

export function SheetBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function SheetFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2",
        className,
      )}
      {...props}
    />
  );
}
