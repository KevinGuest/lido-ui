"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Ignore clipboard errors.
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function ConnectDialog({
  open,
  onClose,
  stratumUrl,
  usernameHint = "<btc-address>.<worker-name>",
}: {
  open: boolean;
  onClose: () => void;
  stratumUrl: string;
  usernameHint?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect miners"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl">
        <DialogMarquees text="Connect · Stratum · Point your rig" tone="connect">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Connect miners</CardTitle>
              <CardDescription>
                Point Bitaxe / NerdQAxe at Lido. Workers appear automatically once they submit
                shares.
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Close"
                  onClick={onClose}
                >
                  <X />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border px-3">
                <CopyRow label="Stratum URL" value={stratumUrl} />
                <CopyRow label="Username" value={usernameHint} />
                <CopyRow label="Password" value="x" />
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </div>
  );
}
