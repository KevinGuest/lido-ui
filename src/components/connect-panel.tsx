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
import {
  cn,
  copyToClipboard,
  hoverLabelBelowClassName,
  hoverLabelClassName,
} from "@/lib/utils";

/** Spec test vector — demo/Pages only so the Connect UI stays complete. */
const DEMO_SV2_AUTHORITY_PUBLIC_KEY =
  "9bXiEd8boQVhq7WddEcERUL5tyyJVFYdU8th3HfbNXK3Yw6GRXh";

const IS_DEMO = process.env.NEXT_PUBLIC_LIDO_DEMO === "true";

function CopyRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  /** Text copied when different from display (e.g. loading placeholder). */
  copyValue?: string;
}) {
  const [copied, setCopied] = useState(false);
  const payload = (copyValue ?? value).trim();
  const canCopy = Boolean(payload);

  async function copy() {
    if (!canCopy) return;
    const ok = await copyToClipboard(payload);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-sm">{value}</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={copy} disabled={!canCopy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

type StratumProtocol = "sv1" | "sv2";

type Sv2InfoResponse = {
  enabled?: boolean;
  authorityPublicKey?: string;
  configured?: boolean;
};

async function fetchSv2AuthorityPublicKey(): Promise<string> {
  if (IS_DEMO) return DEMO_SV2_AUTHORITY_PUBLIC_KEY;

  const response = await fetch("/api/info/sv2", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`SV2 info failed (${response.status})`);
  }
  const data = (await response.json()) as Sv2InfoResponse;
  if (!data.enabled || !data.authorityPublicKey) {
    return "";
  }
  return data.authorityPublicKey;
}

export function ConnectDialog({
  open,
  onClose,
  stratumUrl,
  usernameHint = "<btc-address>.<worker-name>",
  initialAuthorityPublicKey = null,
}: {
  open: boolean;
  onClose: () => void;
  stratumUrl: string;
  usernameHint?: string;
  initialAuthorityPublicKey?: string | null;
}) {
  const [protocol, setProtocol] = useState<StratumProtocol>("sv1");
  const [authorityPublicKey, setAuthorityPublicKey] = useState(
    () => initialAuthorityPublicKey?.trim() || (IS_DEMO ? DEMO_SV2_AUTHORITY_PUBLIC_KEY : ""),
  );
  const [authorityLoading, setAuthorityLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProtocol("sv1");
  }, [open]);

  useEffect(() => {
    const seeded = initialAuthorityPublicKey?.trim();
    if (seeded) setAuthorityPublicKey(seeded);
  }, [initialAuthorityPublicKey]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const hasSeed = Boolean(authorityPublicKey || initialAuthorityPublicKey?.trim());
    if (!hasSeed) setAuthorityLoading(true);

    void (async () => {
      try {
        const key = await fetchSv2AuthorityPublicKey();
        if (cancelled) return;
        if (key) setAuthorityPublicKey(key);
      } catch {
        if (cancelled) return;
        if (IS_DEMO && !authorityPublicKey) {
          setAuthorityPublicKey(DEMO_SV2_AUTHORITY_PUBLIC_KEY);
        }
      } finally {
        if (!cancelled) setAuthorityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Refresh when dialog opens; seed covers first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-only refresh
  }, [open]);

  const endpoint = useMemo(
    () =>
      withStratumPort(
        stratumUrl,
        protocol === "sv1" ? STRATUM_V1_PORT : STRATUM_V2_PORT,
      ),
    [protocol, stratumUrl],
  );

  const authorityDisplay = authorityLoading && !authorityPublicKey
    ? "Loading…"
    : authorityPublicKey || "Unavailable — update Lido / check pool logs";

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
                {protocol === "sv2" ? (
                  <CopyRow
                    label="SV2 Authority Public Key"
                    value={authorityDisplay}
                    copyValue={authorityPublicKey || undefined}
                  />
                ) : null}
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/40 px-3 py-3 dark:border-border/50">
                <HardHat
                  className="mt-0.5 size-4 shrink-0 text-amber-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  {protocol === "sv2"
                    ? "Use host:4444 plus this authority public key in your miner’s SV2 settings. Workers appear once they submit shares."
                    : "Workers appear automatically once they submit shares."}
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </ModalOverlay>
  );
}
