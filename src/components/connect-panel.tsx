"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, DoorOpen, HardHat, RefreshCw } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
import { ModalOverlay } from "@/components/modal-overlay";
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
  trailing,
}: {
  label: string;
  value: string;
  /** Text copied when different from display (e.g. loading placeholder). */
  copyValue?: string;
  trailing?: ReactNode;
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
    <div className="flex items-start gap-2 border-b border-border/40 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-sm leading-snug">{value}</p>
      </div>
      <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
        {trailing}
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy"}
          title={copied ? "Copied" : "Copy"}
          onClick={copy}
          disabled={!canCopy}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors",
            "hover:text-neutral-950 focus-visible:text-neutral-950",
            "dark:hover:text-white dark:focus-visible:text-white",
            "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30",
          )}
        >
          {copied ? (
            <Check className="size-4" strokeWidth={1.75} />
          ) : (
            <Copy className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}

type StratumProtocol = "sv1" | "sv2";

type Sv2InfoResponse = {
  enabled?: boolean;
  authorityPublicKey?: string;
  configured?: boolean;
  source?: string | null;
  rotatable?: boolean;
};

async function fetchSv2Info(): Promise<Sv2InfoResponse> {
  if (IS_DEMO) {
    return {
      enabled: true,
      authorityPublicKey: DEMO_SV2_AUTHORITY_PUBLIC_KEY,
      configured: true,
      source: "demo",
      rotatable: false,
    };
  }

  const response = await fetch("/api/info/sv2", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`SV2 info failed (${response.status})`);
  }
  return (await response.json()) as Sv2InfoResponse;
}

async function rotateSv2AuthorityKey(): Promise<string> {
  if (IS_DEMO) {
    throw new Error("Authority refresh is disabled in demo mode");
  }
  const response = await fetch("/api/info/sv2/authority/rotate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: "rotate" }),
  });
  const data = (await response.json().catch(() => ({}))) as Sv2InfoResponse & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || `Rotate failed (${response.status})`;
    throw new Error(message);
  }
  if (!data.authorityPublicKey) {
    throw new Error("Rotate succeeded but no public key returned");
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
  const [authorityRotatable, setAuthorityRotatable] = useState(!IS_DEMO);
  const [authorityRotating, setAuthorityRotating] = useState(false);

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
        const info = await fetchSv2Info();
        if (cancelled) return;
        if (info.authorityPublicKey) setAuthorityPublicKey(info.authorityPublicKey);
        setAuthorityRotatable(Boolean(info.rotatable));
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

  async function onRefreshAuthority() {
    if (!authorityRotatable || authorityRotating || IS_DEMO) return;
    const ok = window.confirm(
      "Generate a new SV2 authority key?\n\n"
        + "This stays fixed across Lido updates until you refresh again. "
        + "You will need to paste the new key into every miner.",
    );
    if (!ok) return;

    setAuthorityRotating(true);
    try {
      const next = await rotateSv2AuthorityKey();
      setAuthorityPublicKey(next);
      setAuthorityRotatable(true);
    } catch (error) {
      window.alert((error as Error).message || "Could not refresh authority key");
    } finally {
      setAuthorityRotating(false);
    }
  }

  return (
    <ModalOverlay open={open} onClose={onClose} label="Connect miners">
      <div className="flex w-full min-w-0 max-w-lg flex-col overflow-hidden rounded-2xl bg-background lido-dialog-shell">
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
                    trailing={
                      authorityRotatable ? (
                        <button
                          type="button"
                          aria-label="Refresh authority key"
                          title="Refresh authority key"
                          onClick={onRefreshAuthority}
                          disabled={authorityRotating || authorityLoading}
                          className={cn(
                            "rounded-md p-1.5 text-muted-foreground transition-colors",
                            "hover:text-neutral-950 focus-visible:text-neutral-950",
                            "dark:hover:text-white dark:focus-visible:text-white",
                            "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30",
                          )}
                        >
                          <RefreshCw
                            className={cn("size-4", authorityRotating && "animate-spin")}
                            strokeWidth={1.75}
                          />
                        </button>
                      ) : null
                    }
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
                    ? "Use host:2302 plus this authority public key in your miner’s SV2 settings. The key stays the same across Lido updates unless you refresh it."
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
