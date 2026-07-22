"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/app-header";
import {
  SettingsInfoPanel,
  type PoolLifetimeStats,
} from "@/components/settings-info";
import { SettingsLogsPanel } from "@/components/settings-logs";
import { SettingsNotificationsPanel } from "@/components/settings-notifications";
import { UpdateNotifier } from "@/components/update-notifier";
import { useUpdateAvailability } from "@/hooks/use-update-availability";
import { browserPoolApiPath } from "@/lib/pool-browser-api";
import type { DeploymentKind } from "@/lib/app-meta";
import type { NetworkInfo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SettingsTab = "info" | "logs" | "notifications";

const EMPTY_NETWORK: NetworkInfo = {
  height: 0,
  nextHeight: null,
  difficulty: 0,
  networkHashrate: 0,
  chain: "main",
  minFeeBtcKvB: 0,
  currentBlockWeight: null,
  currentBlockTx: null,
  pooledTx: null,
  headers: null,
  verificationProgress: null,
};

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "info", label: "Info" },
  { id: "logs", label: "Logs" },
  { id: "notifications", label: "Notifications" },
];

export function SettingsPage({
  deployment,
  stratumConfigured = "",
  initialNetwork,
  sv2AuthorityPublicKey = null,
  lifetime = null,
  appVersion,
}: {
  deployment: DeploymentKind;
  stratumConfigured?: string;
  initialNetwork?: NetworkInfo | null;
  sv2AuthorityPublicKey?: string | null;
  lifetime?: PoolLifetimeStats | null;
  appVersion?: string;
}) {
  const [tab, setTab] = useState<SettingsTab>("info");
  const [network, setNetwork] = useState<NetworkInfo>(initialNetwork ?? EMPTY_NETWORK);
  const update = useUpdateAvailability(deployment, { currentVersion: appVersion });

  useEffect(() => {
    if (initialNetwork) setNetwork(initialNetwork);
  }, [initialNetwork]);

  useEffect(() => {
    if (deployment === "demo") return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(browserPoolApiPath("/api/network"), {
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as Partial<NetworkInfo> & {
          hashrate?: number;
          blocks?: number;
          networkhashps?: number;
          blockmintxfee?: number;
          currentblockweight?: number;
          currentblocktx?: number;
          pooledtx?: number;
          headers?: number | null;
          verificationprogress?: number | null;
          next?: { height?: number };
        };
        if (cancelled) return;
        const headersRaw = data.headers;
        const progressRaw = data.verificationProgress ?? data.verificationprogress;
        setNetwork({
          height: Number(data.height ?? data.blocks) || 0,
          nextHeight:
            data.nextHeight ??
            (data.next?.height != null ? Number(data.next.height) : null),
          difficulty: Number(data.difficulty) || 0,
          networkHashrate:
            Number(data.networkHashrate ?? data.hashrate ?? data.networkhashps) || 0,
          chain: data.chain || "main",
          minFeeBtcKvB: Number(data.minFeeBtcKvB ?? data.blockmintxfee) || 0,
          currentBlockWeight:
            data.currentBlockWeight ??
            (data.currentblockweight == null
              ? null
              : Number(data.currentblockweight)),
          currentBlockTx:
            data.currentBlockTx ??
            (data.currentblocktx == null ? null : Number(data.currentblocktx)),
          pooledTx:
            data.pooledTx ??
            (data.pooledtx == null ? null : Number(data.pooledtx)),
          headers:
            headersRaw == null || !Number.isFinite(Number(headersRaw))
              ? null
              : Number(headersRaw),
          verificationProgress:
            progressRaw == null || !Number.isFinite(Number(progressRaw))
              ? null
              : Number(progressRaw),
        });
      } catch {
        // keep last
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deployment]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <UpdateNotifier
        dialogOpen={update.dialogOpen}
        onCloseDialog={update.closeDialog}
        release={update.release}
        currentVersion={update.currentVersion}
        deployment={deployment}
      />
      <AppHeader
        network={network}
        stratumConfigured={stratumConfigured}
        sv2AuthorityPublicKey={sv2AuthorityPublicKey}
        showUpdate={update.hasUpdate}
        highlightUpdate={update.hintOpen}
        onUpdateClick={update.openDialog}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <div
          className="grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:items-center sm:gap-1.5"
          role="tablist"
          aria-label="Settings sections"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-md border px-2 py-2 text-center text-xs font-medium transition-colors sm:px-3 sm:py-1.5",
                tab === item.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-transparent text-foreground hover:bg-muted/40",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 p-4 sm:p-5">
        {tab === "info" ? (
          <SettingsInfoPanel
            deployment={deployment}
            stratumConfigured={stratumConfigured}
            sv2AuthorityPublicKey={sv2AuthorityPublicKey}
            currentVersion={update.currentVersion}
            hasUpdate={update.hasUpdate}
            onOpenUpdate={update.openDialog}
            lifetime={lifetime}
          />
        ) : null}
        {tab === "logs" ? <SettingsLogsPanel /> : null}
        {tab === "notifications" ? <SettingsNotificationsPanel /> : null}
      </div>
    </div>
  );
}
