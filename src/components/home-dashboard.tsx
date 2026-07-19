"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { BlocksFoundCard } from "@/components/blocks-found-card";
import { BootLogo } from "@/components/boot-logo";
import { DifficultyAdjustmentBar } from "@/components/difficulty-adjustment-bar";
import { HalvingCountdown } from "@/components/halving-countdown";
import { HashrateChart } from "@/components/hashrate-chart";
import { UpdateNotifier } from "@/components/update-notifier";
import { WorkersTable } from "@/components/workers-table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateAvailability } from "@/hooks/use-update-availability";
import type { DeploymentKind } from "@/lib/app-meta";
import { formatUptime, hashSuffix, numberSuffix } from "@/lib/format";
import { applyLiveChainSnapshot, fetchLiveChainSnapshot } from "@/lib/live-chain";
import type { DashboardPayload } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const CHAIN_POLL_MS = 60_000;
/** Hold the splash long enough for the spin, then crossfade. */
const BOOT_MS = 1100;
const FADE_MS = 450;

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
  const [splashMounted, setSplashMounted] = useState(true);
  const [splashOpaque, setSplashOpaque] = useState(true);
  const liveChain = initial.source === "mock";
  const update = useUpdateAvailability(deployment, { announce: !splashOpaque });

  useEffect(() => {
    setDashboard(initial);
  }, [initial]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setSplashOpaque(false);
      setSplashMounted(false);
      return;
    }

    const bootId = window.setTimeout(() => {
      setSplashOpaque(false);
    }, BOOT_MS);

    return () => window.clearTimeout(bootId);
  }, []);

  useEffect(() => {
    if (splashOpaque || !splashMounted) return;
    const fadeId = window.setTimeout(() => {
      setSplashMounted(false);
    }, FADE_MS);
    return () => window.clearTimeout(fadeId);
  }, [splashOpaque, splashMounted]);

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

      <div
        className={cn(
          "mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6",
          "transition-opacity duration-[450ms] ease-out",
          showApp ? "opacity-100" : "opacity-0",
        )}
        aria-hidden={!showApp}
      >
        <AutoRefresh seconds={60} />
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Uptime</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {uptimeSeconds == null ? "n/a" : formatUptime(uptimeSeconds)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total hashrate</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {hashSuffix(pool.totalHashRate)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Best difficulty</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {pool.bestDifficulty ? numberSuffix(pool.bestDifficulty) : "n/a"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Network difficulty</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {network.difficulty ? numberSuffix(network.difficulty) : "n/a"}
              </CardTitle>
            </CardHeader>
          </Card>
          <BlocksFoundCard count={pool.blocksFound} blocks={foundBlocks} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <DifficultyAdjustmentBar data={difficultyAdjustment} />
          </div>
          <HalvingCountdown
            height={network.height}
            avgBlockMs={difficultyAdjustment?.timeAvgMs ?? 0}
          />
        </div>

        <HashrateChart
          data={chart}
          minerCharts={minerCharts}
          workers={workers}
          chartSince={chartSince}
          liveHashrate={pool.totalHashRate}
        />

        <WorkersTable
          workers={workers}
          totalMiners={pool.totalMiners}
          persistRemovals={dashboard.source !== "mock"}
        />

        <p className="text-center text-sm text-muted-foreground">
          <span className="text-black dark:text-white">Lido</span> is a Fully
          Open Source Solo Bitcoin Mining Pool fork of{" "}
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
      </div>
    </div>
  );
}
