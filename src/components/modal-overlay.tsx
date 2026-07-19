"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export const LIDO_APP_ROOT_ID = "lido-app";

let lockCount = 0;

function acquireModalLock() {
  lockCount += 1;
  if (lockCount !== 1) return;
  document.body.style.overflow = "hidden";
  document.getElementById(LIDO_APP_ROOT_ID)?.classList.add("lido-app-obscured");
}

function releaseModalLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount !== 0) return;
  document.body.style.overflow = "";
  document.getElementById(LIDO_APP_ROOT_ID)?.classList.remove("lido-app-obscured");
}

/**
 * Full-viewport modal shell: portaled to document.body so it is never trapped by
 * app stacking contexts, and pairs with #lido-app blur (backdrop-filter alone is flaky).
 */
export function ModalOverlay({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    acquireModalLock();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      releaseModalLock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] grid place-items-center p-4",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-lido-modal=""
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>,
    document.body,
  );
}
