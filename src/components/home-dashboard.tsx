"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { BlocksFoundCard } from "@/components/blocks-found-card";
import { BootLogo } from "@/components/boot-logo";
import { DifficultyAdjustmentBar } from "@/components/difficulty-adjustment-bar";
import { HalvingCountdown } from "@/components/halving-countdown";
import { HashrateChart } from "@/components/hashrate-chart";
import { PublicDeviceTable } from "@/components/public-device-table";
import { UpdateNotifier } from "@/components/update-notifier";
import { WorkersTable } from "@/components/workers-table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useUpdateAvailability } from "@/hooks/use-update-availability";
import { useAddressSession } from "@/lib/address-session";
import { addressHasPoolWorkers } from "@/lib/address-auth";
import type { DeploymentKind } from "@/lib/app-meta";
import { shortenAddress } from "@/lib/bitcoin-address";
import { formatUptime, hashSuffix, numberSuffix } from "@/lib/format";
import { applyLiveChainSnapshot, fetchLiveChainSnapshot } from "@/lib/live-chain";
import type { ChartPoint, DashboardPayload, MinerChartSeries, Worker } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const CHAIN_POLL_MS = 60_000;
/** Cap miner series in Find-your-miners chart so stress mocks stay usable. */
const PERSONAL_CHART_LIMIT = 40;
/** Hold the find-miners bridge before revealing the personal dashboard. */
const AUTH_BRIDGE_MS = 1100;

function personalMinerChartSeries(
  workers: Worker[],
  minerCharts: MinerChartSeries[],
  totalChart: ChartPoint[],
): MinerChartSeries[] {
  const chartById = new Map(minerCharts.map((series) => [series.id, series]));
  const chartByName = new Map(
    minerCharts.map((series) => [series.name.trim().toLowerCase(), series]),
  );
  const timebase =
    minerCharts.find((series) => series.chart.length > 0)?.chart ?? totalChart;

  const ranked = [...workers]
    .sort((a, b) => {
      const aOnline = a.online !== false;
      const bOnline = b.online !== false;
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return b.hashrate - a.hashrate || a.name.localeCompare(b.name);
    })
    .slice(0, PERSONAL_CHART_LIMIT);

  return ranked.map((worker) => {
    const exact =
      chartById.get(worker.id) ??
      chartByName.get(worker.name.trim().toLowerCase());
    if (exact) {
      return { id: worker.id, name: worker.name, chart: exact.chart };
    }

    const baseName = worker.name.replace(/-\d+$/, "").trim().toLowerCase();
    const byBase = baseName ? chartByName.get(baseName) : undefined;
    if (byBase) {
      return { id: worker.id, name: worker.name, chart: byBase.chart };
    }

    const hashrate = worker.online === false ? 0 : worker.hashrate || 0;
    return {
      id: worker.id,
      name: worker.name,
      chart: timebase.map((point, index) => ({
        label: point.label,
        data:
          worker.online === false
            ? 0
            : index === timebase.length - 1
              ? hashrate
              : hashrate * (0.88 + ((index + worker.name.length) % 9) * 0.015),
      })),
    };
  });
}

/** Sum per-miner series into one total/weekly chart for an address view. */
function sumMinerCharts(series: MinerChartSeries[]): ChartPoint[] {
  if (series.length === 0) return [];
  const labels =
    series.find((entry) => entry.chart.length > 0)?.chart.map((point) => point.label) ??
    [];
  return labels.map((label, index) => ({
    label,
    data: series.reduce(
      (sum, entry) => sum + (Number(entry.chart[index]?.data) || 0),
      0,
    ),
  }));
}
/** Hold the splash long enough for the spin, then crossfade. */
const BOOT_MS = 1100;
const FADE_MS = 450;
const BOOT_SPLASH_SESSION_KEY = "lido-boot-splash-done";
const BOOT_SPLASH_STARTED_KEY = "lido-boot-splash-started";

/** Once per tab session — returning from Settings must not replay the boot splash. */
let bootSplashDone = false;
/** First splash start (ms) — survives remounts so the timer cannot be reset forever. */
let bootSplashStartedAt: number | null = null;

function readBootSplashDone() {
  if (bootSplashDone) return true;
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(BOOT_SPLASH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markBootSplashDone() {
  bootSplashDone = true;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BOOT_SPLASH_SESSION_KEY, "1");
    sessionStorage.removeItem(BOOT_SPLASH_STARTED_KEY);
  } catch {
    // Ignore quota / private mode.
  }
}

function ensureBootSplashStartedAt() {
  if (bootSplashStartedAt != null) return bootSplashStartedAt;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(BOOT_SPLASH_STARTED_KEY);
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed) && parsed > 0) {
        bootSplashStartedAt = parsed;
        return parsed;
      }
      const now = Date.now();
      sessionStorage.setItem(BOOT_SPLASH_STARTED_KEY, String(now));
      bootSplashStartedAt = now;
      return now;
    } catch {
      // fall through
    }
  }
  bootSplashStartedAt = Date.now();
  return bootSplashStartedAt;
}

export function HomeDashboard({
  initial,
  deployment,
  stratumConfigured = "",
}: {
  initial: DashboardPayload;
  deployment: DeploymentKind;
  stratumConfigured?: string;
}) {
  const [dashboard, setDashboard] = useState(initial);
  // Always start as splash on SSR + first client paint so hydration matches.
  // Session skip / timer run after mount; deadline is absolute across remounts.
  const [splashMounted, setSplashMounted] = useState(true);
  const [splashOpaque, setSplashOpaque] = useState(true);
  const liveChain = initial.source === "mock";
  const publicMode = deployment === "public";
  const session = useAddressSession();
  const [authBridge, setAuthBridge] = useState<{
    address: string;
    minerCount: number;
    opaque: boolean;
  } | null>(null);
  const update = useUpdateAvailability(deployment, {
    announce: !splashOpaque && !publicMode && !authBridge,
  });

  useEffect(() => {
    setDashboard(initial);
  }, [initial]);

  useLayoutEffect(() => {
    if (!readBootSplashDone()) return;
    markBootSplashDone();
    setSplashOpaque(false);
    setSplashMounted(false);
  }, []);

  useEffect(() => {
    if (readBootSplashDone()) {
      markBootSplashDone();
      setSplashOpaque(false);
      setSplashMounted(false);
      return;
    }

    let reduceMotion = false;
    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      reduceMotion = false;
    }
    if (reduceMotion) {
      markBootSplashDone();
      setSplashOpaque(false);
      setSplashMounted(false);
      return;
    }

    const startedAt = ensureBootSplashStartedAt();
    const remaining = Math.max(0, BOOT_MS - (Date.now() - startedAt));
    const bootId = window.setTimeout(() => {
      markBootSplashDone();
      setSplashOpaque(false);
    }, remaining);

    return () => window.clearTimeout(bootId);
  }, []);

  useEffect(() => {
    if (splashOpaque || !splashMounted) return;
    const fadeId = window.setTimeout(() => {
      markBootSplashDone();
      setSplashMounted(false);
    }, FADE_MS);
    return () => window.clearTimeout(fadeId);
  }, [splashOpaque, splashMounted]);

  // Leaving the dashboard after the splash has faded — skip it on the way back.
  useEffect(() => {
    return () => {
      if (!splashOpaque) {
        markBootSplashDone();
      }
    };
  }, [splashOpaque]);


  useEffect(() => {
    if (!liveChain) return;

    let cancelled = false;

    async function refreshChain() {
      try {
        const live = await fetchLiveChainSnapshot();
        if (cancelled) return;
        setDashboard((current) => {
          const next = applyLiveChainSnapshot(current, live);
          return {
            ...next,
            workers: next.workers.map((worker, index) => ({
              ...worker,
              lastSeen:
                worker.online === false
                  ? worker.lastSeen
                  : new Date(Date.now() - (3_000 + index * 1_500)).toISOString(),
            })),
          };
        });
      } catch {
        // Keep last good chain snapshot.
      }
    }

    void refreshChain();
    const id = window.setInterval(refreshChain, CHAIN_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [liveChain]);

  const {
    pool,
    chart,
    chartSince,
    minerCharts,
    workers,
    foundBlocks,
    network,
    difficultyAdjustment,
    uptimeSeconds,
    sv2AuthorityPublicKey,
  } = dashboard;

  const loggedInAddress = publicMode ? session.address : null;
  const personalWorkers =
    loggedInAddress == null
      ? workers
      : workers.filter(
          (worker) =>
            worker.address.trim().toLowerCase() ===
            loggedInAddress.trim().toLowerCase(),
        );

  const handleAddressLogin = useCallback(
    (address: string) => {
      const trimmed = address.trim();
      const needle = trimmed.toLowerCase();
      const minerCount = workers.filter(
        (worker) => worker.address.trim().toLowerCase() === needle,
      ).length;

      let reduceMotion = false;
      try {
        reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        reduceMotion = false;
      }

      if (reduceMotion) {
        session.login(trimmed);
        return;
      }

      window.scrollTo(0, 0);
      setAuthBridge({ address: trimmed, minerCount, opaque: true });
    },
    [session.login, workers],
  );

  useEffect(() => {
    if (!authBridge?.opaque) return;
    const address = authBridge.address;

    const holdId = window.setTimeout(() => {
      session.login(address);
      setAuthBridge((current) =>
        current ? { ...current, opaque: false } : null,
      );
    }, AUTH_BRIDGE_MS);

    return () => window.clearTimeout(holdId);
  }, [authBridge?.opaque, authBridge?.address, session.login]);

  useEffect(() => {
    if (!authBridge || authBridge.opaque) return;
    const fadeId = window.setTimeout(() => setAuthBridge(null), FADE_MS);
    return () => window.clearTimeout(fadeId);
  }, [authBridge]);

  // Drop stored sessions that no longer have a miner on the pool.
  useEffect(() => {
    if (!publicMode || !session.ready || !session.address) return;
    if (!addressHasPoolWorkers(session.address, workers)) {
      session.logout();
    }
  }, [publicMode, session.ready, session.address, session.logout, workers]);

  const personalMinerCharts = useMemo(() => {
    if (!publicMode || !loggedInAddress) return minerCharts;
    return personalMinerChartSeries(personalWorkers, minerCharts, chart);
  }, [publicMode, loggedInAddress, personalWorkers, minerCharts, chart]);

  const personalTotalChart = useMemo(() => {
    if (!publicMode || !loggedInAddress) return chart;
    const summed = sumMinerCharts(personalMinerCharts);
    return summed.length > 0 ? summed : chart;
  }, [publicMode, loggedInAddress, personalMinerCharts, chart]);

  const personalLiveHashrate = useMemo(
    () =>
      personalWorkers
        .filter((worker) => worker.online !== false)
        .reduce((sum, worker) => sum + worker.hashrate, 0),
    [personalWorkers],
  );

  const personalBestDifficulty = useMemo(
    () =>
      personalWorkers.reduce(
        (max, worker) => Math.max(max, worker.bestDifficulty || 0),
        0,
      ),
    [personalWorkers],
  );

  const personalFoundBlocks = useMemo(() => {
    if (!loggedInAddress) return foundBlocks;
    const needle = loggedInAddress.trim().toLowerCase();
    return foundBlocks.filter(
      (block) => block.address.trim().toLowerCase() === needle,
    );
  }, [foundBlocks, loggedInAddress]);

  const personalBlocksFoundCount = useMemo(() => {
    if (!loggedInAddress) return pool.blocksFound;
    if (personalFoundBlocks.length > 0) return personalFoundBlocks.length;
    return personalWorkers.reduce((sum, worker) => sum + (worker.blocksFound || 0), 0);
  }, [
    loggedInAddress,
    personalFoundBlocks.length,
    personalWorkers,
    pool.blocksFound,
  ]);

  const viewingPersonal = Boolean(publicMode && loggedInAddress);
  const displayHashrate = viewingPersonal ? personalLiveHashrate : pool.totalHashRate;
  const displayBestDifficulty = viewingPersonal
    ? personalBestDifficulty
    : pool.bestDifficulty;
  const displayFoundBlocks = viewingPersonal ? personalFoundBlocks : foundBlocks;
  const displayBlocksFound = viewingPersonal
    ? personalBlocksFoundCount
    : pool.blocksFound;

  const showMinerHashrateChart = !publicMode || Boolean(loggedInAddress);
  const autoSelectMinerIds = useMemo(
    () =>
      publicMode && loggedInAddress
        ? personalMinerCharts.map((series) => series.id)
        : undefined,
    [publicMode, loggedInAddress, personalMinerCharts],
  );

  const showApp = !splashOpaque;

  return (
    <div className="relative">
      {splashMounted ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background",
            "transition-opacity duration-[450ms] ease-out",
            splashOpaque ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          role="status"
          aria-live="polite"
          aria-label="Loading Lido"
          aria-hidden={!splashOpaque}
        >
          <BootLogo />
        </div>
      ) : null}

      {authBridge ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6",
            "transition-opacity duration-[450ms] ease-out",
            authBridge.opaque ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          role="status"
          aria-live="polite"
          aria-label="Loading your miners"
          aria-hidden={!authBridge.opaque}
        >
          <BootLogo subtitle="Finding your miners" />
          <div className="space-y-1 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              {shortenAddress(authBridge.address)}
            </p>
            <p className="text-sm text-muted-foreground">
              {authBridge.minerCount === 1
                ? "1 miner on this pool"
                : `${authBridge.minerCount.toLocaleString()} miners on this pool`}
            </p>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6",
          "transition-opacity duration-[450ms] ease-out",
          showApp && !authBridge?.opaque ? "opacity-100" : "opacity-0",
        )}
        aria-hidden={!showApp || Boolean(authBridge?.opaque)}
      >
        {showApp ? <AutoRefresh seconds={60} /> : null}
        {!publicMode ? (
          <UpdateNotifier
            dialogOpen={update.dialogOpen}
            onCloseDialog={update.closeDialog}
            release={update.release}
            currentVersion={update.currentVersion}
            deployment={deployment}
          />
        ) : null}
        <AppHeader
          network={network}
          stratumConfigured={stratumConfigured}
          sv2AuthorityPublicKey={sv2AuthorityPublicKey}
          showUpdate={!publicMode && update.hasUpdate}
          highlightUpdate={!publicMode && update.hintOpen}
          onUpdateClick={publicMode ? undefined : update.openDialog}
          deployment={deployment}
          loggedInAddress={loggedInAddress}
          onLogin={publicMode ? handleAddressLogin : undefined}
          onLogout={publicMode ? session.logout : undefined}
          loginWorkers={publicMode ? workers : undefined}
        />

        {publicMode && loggedInAddress ? (
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
            <p>
              Viewing miners for{" "}
              <span className="font-mono font-medium">{shortenAddress(loggedInAddress)}</span>
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Uptime</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {uptimeSeconds == null || uptimeSeconds <= 0
                  ? "—"
                  : formatUptime(uptimeSeconds)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total hashrate</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {hashSuffix(displayHashrate)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best difficulty</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {displayBestDifficulty ? numberSuffix(displayBestDifficulty) : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Network difficulty</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {network.difficulty ? numberSuffix(network.difficulty) : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <BlocksFoundCard count={displayBlocksFound} blocks={displayFoundBlocks} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <DifficultyAdjustmentBar data={difficultyAdjustment} network={network} />
          </div>
          <HalvingCountdown
            height={network.height}
            avgBlockMs={difficultyAdjustment?.timeAvgMs ?? 0}
            network={network}
          />
        </div>

        <HashrateChart
          data={viewingPersonal ? personalTotalChart : chart}
          minerCharts={showMinerHashrateChart ? personalMinerCharts : []}
          workers={showMinerHashrateChart ? personalWorkers : undefined}
          chartSince={chartSince}
          liveHashrate={
            viewingPersonal ? personalLiveHashrate : pool.totalHashRate
          }
          mode={showMinerHashrateChart ? "full" : "public"}
          autoSelectMinerIds={autoSelectMinerIds}
          initialPage={viewingPersonal ? "miners" : undefined}
        />

        {publicMode && !loggedInAddress ? (
          <PublicDeviceTable workers={workers} />
        ) : (
          <WorkersTable
            workers={publicMode ? personalWorkers : workers}
            totalMiners={
              publicMode ? personalWorkers.length : pool.totalMiners
            }
            persistRemovals={!publicMode && dashboard.source !== "mock"}
            allowRemove={!publicMode}
          />
        )}

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <p className="min-w-0 text-left">
            <span className="text-black dark:text-white">Lido</span> is a fully
            open-source solo Bitcoin mining pool — a fork of{" "}
            <a
              href="https://web.public-pool.io"
              target="_blank"
              rel="noreferrer"
              className="text-black transition-opacity hover:opacity-80 dark:text-white"
            >
              Public Pool
            </a>
            .
          </p>
          <Link
            href="/terms"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "shrink-0 self-start bg-transparent hover:bg-muted/40 sm:self-auto dark:bg-transparent dark:hover:bg-muted/40",
            )}
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
