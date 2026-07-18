"use client";

import { useEffect, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { BlocksFoundCard } from "@/components/blocks-found-card";
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
import type { DeploymentKind } from "@/lib/app-meta";
import { formatUptime, hashSuffix, numberSuffix } from "@/lib/format";
import { applyLiveChainSnapshot, fetchLiveChainSnapshot } from "@/lib/live-chain";
import type { DashboardPayload } from "@/lib/mock-data";

const CHAIN_POLL_MS = 60_000;

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
  const liveChain = initial.source === "mock";

  useEffect(() => {
    setDashboard(initial);
  }, [initial]);

  useEffect(() => {
    if (!liveChain) return;

    let cancelled = false;

    async function refreshChain() {
      try {
        const live = await fetchLiveChainSnapshot();
        if (cancelled) return;
        setDashboard((current) => {
          const next = applyLiveChainSnapshot(current, live);
          // Keep demo "last seen" feeling live between static refreshes.
          return {
            ...next,
            workers: next.workers.map((worker, index) => ({
              ...worker,
              lastSeen: new Date(Date.now() - (3_000 + index * 1_500)).toISOString(),
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
  } = dashboard;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AutoRefresh seconds={60} />
      <UpdateNotifier deployment={deployment} />
      <AppHeader network={network} stratumConfigured={stratumConfigured} />

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

      <WorkersTable workers={workers} totalMiners={pool.totalMiners} />

      <p className="text-center text-sm text-muted-foreground">
        Lido is a Fully Open Source Solo Bitcoin Mining Pool fork of Public Pool.
      </p>
    </div>
  );
}
