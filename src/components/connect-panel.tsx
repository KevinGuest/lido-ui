"use client";

import { useEffect, useMemo, useState } from "react";
import { DoorOpen, HardHat } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
import { ModalOverlay } from "@/components/modal-overlay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STRATUM_V1_PORT, STRATUM_V2_PORT, withStratumPort } from "@/lib/stratum-url";
import { cn, hoverLabelBelowClassName, hoverLabelClassName } from "@/lib/utils";

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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 py-3 last:border-0">
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

type StratumProtocol = "sv1" | "sv2";

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
  const [protocol, setProtocol] = useState<StratumProtocol>("sv1");

  useEffect(() => {
    if (!open) return;
    setProtocol("sv1");
  }, [open]);

  const endpoint = useMemo(
    () =>
      withStratumPort(
        stratumUrl,
        protocol === "sv1" ? STRATUM_V1_PORT : STRATUM_V2_PORT,
      ),
    [protocol, stratumUrl],
  );

  return (
    <ModalOverlay open={open} onClose={onClose} label="Connect miners">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-background lido-dialog-shell">
        <DialogMarquees text="Connect · Stratum · Point your rig" tone="connect">
          <Card className="gap-4 border-0 py-4 shadow-none">
            <CardHeader>
              <CardTitle>Connect miners</CardTitle>
              <CardDescription>Point your miners to Lido.</CardDescription>
              <CardAction>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5"
                    role="tablist"
                    aria-label="Stratum protocol"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={protocol === "sv1"}
                      aria-label="Stratum V1"
                      onClick={() => setProtocol("sv1")}
                      className={cn(
                        "group relative flex h-8 items-center justify-center rounded-md border px-2.5 text-xs font-medium transition-colors",
                        protocol === "sv1"
                          ? "border-transparent bg-foreground text-background"
                          : "border-border bg-transparent text-foreground hover:bg-muted/40",
                      )}
                    >
                      SV1
                      <span
                        className={cn(
                          "pointer-events-none absolute top-full left-1/2 z-20 mt-3 -translate-x-1/2",
                          hoverLabelClassName,
                          hoverLabelBelowClassName,
                          "font-normal opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                        )}
                      >
                        Stratum V1
                      </span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={protocol === "sv2"}
                      aria-label="Stratum V2"
                      onClick={() => setProtocol("sv2")}
                      className={cn(
                        "group relative flex h-8 items-center justify-center rounded-md border px-2.5 text-xs font-medium transition-colors",
                        protocol === "sv2"
                          ? "border-transparent bg-foreground text-background"
                          : "border-border bg-transparent text-foreground hover:bg-muted/40",
                      )}
                    >
                      SV2
                      <span
                        className={cn(
                          "pointer-events-none absolute top-full left-1/2 z-20 mt-3 -translate-x-1/2",
                          hoverLabelClassName,
                          hoverLabelBelowClassName,
                          "font-normal opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                        )}
                      >
                        Stratum V2
                      </span>
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className={cn(
                      "group relative flex size-8 items-center justify-center rounded-md",
                      "text-foreground transition-colors hover:bg-muted/40",
                    )}
                  >
                    <DoorOpen
                      className="size-4 transition-colors group-hover:text-red-500 group-focus-visible:text-red-500"
                      strokeWidth={1.75}
                    />
                    <span
                      className={cn(
                        "pointer-events-none absolute top-full left-1/2 z-20 mt-3 -translate-x-1/2",
                        hoverLabelClassName,
                        hoverLabelBelowClassName,
                        "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                      )}
                    >
                      Close
                    </span>
                  </button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-border/40 px-3 dark:border-border/50">
                <CopyRow label="Stratum URL" value={endpoint} />
                <CopyRow label="Username" value={usernameHint} />
                <CopyRow label="Password" value="x" />
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/40 px-3 py-3 dark:border-border/50">
                <HardHat
                  className="mt-0.5 size-4 shrink-0 text-amber-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Workers appear automatically once they submit shares.
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </ModalOverlay>
  );
}
