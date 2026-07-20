"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, CircleHelp, Copy, Info } from "lucide-react";

import type { DeploymentKind } from "@/lib/app-meta";
import { formatUptime, numberSuffix } from "@/lib/format";
import {
  STRATUM_V1_PORT,
  STRATUM_V2_PORT,
  resolveStratumEndpoint,
  withStratumPort,
} from "@/lib/stratum-url";
import { cn, copyToClipboard, hoverLabelClassName } from "@/lib/utils";

const DEMO_SV2_KEY =
  "9bXiEd8boQVhq7WddEcERUL5tyyJVFYdU8th3HfbNXK3Yw6GRXh";

type InfoPane = "pool" | "sv1" | "sv2";

export type PoolLifetimeStats = {
  platform: string | null;
  sharesAccepted: number;
  sharesRejected: number;
  bestDifficulty: number;
  blocksFound: number;
  overallUptimeSeconds: number | null;
};

const DEMO_LIFETIME: PoolLifetimeStats = {
  platform: "Linux",
  sharesAccepted: 512_840,
  sharesRejected: 1_284,
  bestDifficulty: 4.2e12,
  blocksFound: 1,
  overallUptimeSeconds: 86_400 * 57,
};

function Tip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <CircleHelp
        className="size-3.5 text-muted-foreground/80"
        strokeWidth={1.75}
        aria-hidden
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2",
          "rounded-md border border-transparent bg-foreground px-2 py-1.5 text-left text-[11px] leading-snug",
          "whitespace-normal text-background shadow-lg",
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          "before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[5px]",
          "before:border-transparent before:border-t-foreground before:content-['']",
        )}
      >
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

function InfoRow({
  label,
  value,
  copyValue,
  mono,
  copyable = true,
  tip,
}: {
  label: string;
  value: string;
  copyValue?: string;
  mono?: boolean;
  copyable?: boolean;
  tip?: string;
}) {
  const [copied, setCopied] = useState(false);
  const payload = (copyValue ?? value).trim();
  const canCopy = copyable && Boolean(payload) && payload !== "—";

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
        <p className="text-xs text-muted-foreground">
          {label}
          {tip ? <Tip text={tip} /> : null}
        </p>
        <p className={cn("break-all text-sm leading-snug", mono && "font-mono")}>
          {value}
        </p>
      </div>
      {canCopy ? (
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy"}
          title={copied ? "Copied" : "Copy"}
          onClick={copy}
          className={cn(
            "mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors",
            "hover:text-neutral-950 focus-visible:text-neutral-950",
            "dark:hover:text-white dark:focus-visible:text-white",
            "focus-visible:outline-none",
          )}
        >
          {copied ? (
            <Check className="size-4" strokeWidth={1.75} />
          ) : (
            <Copy className="size-4" strokeWidth={1.75} />
          )}
        </button>
      ) : null}
    </div>
  );
}

function PaneIcon({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "group relative flex h-9 min-w-9 items-center justify-center rounded-md border px-2 transition-colors",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
          hoverLabelClassName,
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function rejectShareLabel(accepted: number, rejected: number): string {
  const total = accepted + rejected;
  if (total <= 0) return "0";
  const pct = (rejected / total) * 100;
  const pctText =
    pct >= 10 ? pct.toFixed(1) : pct >= 1 ? pct.toFixed(2) : pct.toFixed(3);
  return `${rejected.toLocaleString()} (${pctText}%)`;
}

export function SettingsInfoPanel({
  deployment,
  stratumConfigured = "",
  sv2AuthorityPublicKey = null,
  currentVersion,
  hasUpdate,
  latestTag,
  onOpenUpdate,
  lifetime,
}: {
  deployment: DeploymentKind;
  stratumConfigured?: string;
  sv2AuthorityPublicKey?: string | null;
  currentVersion: string;
  hasUpdate: boolean;
  latestTag?: string | null;
  onOpenUpdate?: () => void;
  lifetime?: PoolLifetimeStats | null;
}) {
  const [pane, setPane] = useState<InfoPane>("pool");
  const [hostEndpoint, setHostEndpoint] = useState("");
  const [serverAddress, setServerAddress] = useState("");
  const stats = lifetime ?? (deployment === "demo" ? DEMO_LIFETIME : null);

  useEffect(() => {
    setHostEndpoint(
      resolveStratumEndpoint(window.location.hostname, stratumConfigured),
    );
    setServerAddress(window.location.host || window.location.hostname || "—");
  }, [stratumConfigured]);

  const sv1Url = hostEndpoint
    ? withStratumPort(hostEndpoint, STRATUM_V1_PORT)
    : `…:${STRATUM_V1_PORT}`;
  const sv2Url = hostEndpoint
    ? withStratumPort(hostEndpoint, STRATUM_V2_PORT)
    : `…:${STRATUM_V2_PORT}`;

  const authority =
    sv2AuthorityPublicKey?.trim() ||
    (deployment === "demo" ? DEMO_SV2_KEY : "");

  const updateAvailableValue =
    deployment === "demo"
      ? "No"
      : hasUpdate
        ? latestTag
          ? `Yes (${latestTag})`
          : "Yes"
        : "No";

  const paneCopy =
    pane === "pool"
      ? {
          title: "Pool info",
          description: "Lifetime pool stats and how this Lido is running.",
        }
      : pane === "sv1"
        ? {
            title: "Stratum V1",
            description: "Endpoint and password for classic stratum miners.",
          }
        : {
            title: "Stratum V2",
            description: "Endpoint, password, and authority public key for SV2 miners.",
          };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">{paneCopy.title}</h2>
          <p className="text-sm text-muted-foreground">{paneCopy.description}</p>
        </div>

        {/* Desktop: icon tabs */}
        <div
          className="hidden items-center gap-1.5 md:flex"
          role="tablist"
          aria-label="Info sections"
        >
          <PaneIcon
            active={pane === "pool"}
            label="Pool info"
            onClick={() => setPane("pool")}
          >
            <Info className="size-4" strokeWidth={1.75} />
          </PaneIcon>
          <PaneIcon
            active={pane === "sv1"}
            label="Stratum V1"
            onClick={() => setPane("sv1")}
          >
            <span className="text-[11px] font-semibold tracking-wide">SV1</span>
          </PaneIcon>
          <PaneIcon
            active={pane === "sv2"}
            label="Stratum V2"
            onClick={() => setPane("sv2")}
          >
            <span className="text-[11px] font-semibold tracking-wide">SV2</span>
          </PaneIcon>
        </div>

        {/* Mobile: labeled segments */}
        <div
          className="grid w-full grid-cols-3 gap-1 md:hidden"
          role="tablist"
          aria-label="Info sections"
        >
          {(
            [
              { id: "pool" as const, label: "Pool" },
              { id: "sv1" as const, label: "SV1" },
              { id: "sv2" as const, label: "SV2" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={pane === item.id}
              onClick={() => setPane(item.id)}
              className={cn(
                "rounded-md border px-2 py-2.5 text-center text-xs font-medium transition-colors",
                pane === item.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {pane === "pool" ? (
        <section className="rounded-xl border border-border/40 px-3 dark:border-border/50">
          <InfoRow
            label="Server address"
            value={serverAddress || "—"}
            mono
          />
          <InfoRow
            label="Server platform"
            value={stats?.platform || "—"}
            copyable={false}
          />
          <InfoRow
            label="App version"
            value={currentVersion || "—"}
            mono
            copyable={false}
          />
          <div className="flex items-start gap-2 border-b border-border/40 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Update available</p>
              <p className="text-sm leading-snug">{updateAvailableValue}</p>
            </div>
            {hasUpdate && onOpenUpdate ? (
              <button
                type="button"
                onClick={onOpenUpdate}
                className="mt-0.5 shrink-0 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/40"
              >
                View update
              </button>
            ) : null}
          </div>
          <InfoRow
            label="Shares"
            value={
              stats ? stats.sharesAccepted.toLocaleString() : "—"
            }
            copyable={false}
            tip="All-time accepted shares across every miner."
          />
          <InfoRow
            label="Shares rejected"
            value={
              stats
                ? rejectShareLabel(stats.sharesAccepted, stats.sharesRejected)
                : "—"
            }
            copyable={false}
            tip="All-time rejected shares across every miner, with reject rate."
          />
          <InfoRow
            label="Best Difficulty"
            value={
              stats?.bestDifficulty
                ? numberSuffix(stats.bestDifficulty)
                : "—"
            }
            copyable={false}
            tip="Highest share difficulty ever achieved on this pool."
          />
          <InfoRow
            label="Blocks Found"
            value={stats ? String(stats.blocksFound) : "—"}
            copyable={false}
          />
          <InfoRow
            label="Overall Uptime"
            value={
              stats?.overallUptimeSeconds != null
                ? formatUptime(stats.overallUptimeSeconds)
                : "—"
            }
            copyable={false}
            tip="Combined running time across every Lido session. The dashboard uptime resets on restart; this one keeps counting."
          />
        </section>
      ) : null}

      {pane === "sv1" ? (
        <section className="rounded-xl border border-border/40 px-3 dark:border-border/50">
          <InfoRow label="Endpoint" value={sv1Url} mono />
          <InfoRow label="Port" value={String(STRATUM_V1_PORT)} mono />
          <InfoRow label="Password" value="x" mono />
        </section>
      ) : null}

      {pane === "sv2" ? (
        <section className="rounded-xl border border-border/40 px-3 dark:border-border/50">
          <InfoRow label="Endpoint" value={sv2Url} mono />
          <InfoRow label="Port" value={String(STRATUM_V2_PORT)} mono />
          <InfoRow label="Password" value="x" mono />
          <InfoRow
            label="Authority public key"
            value={authority || "Unavailable"}
            copyValue={authority || undefined}
            mono
          />
        </section>
      ) : null}
    </div>
  );
}
