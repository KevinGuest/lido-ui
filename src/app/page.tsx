import { AppHeader } from "@/components/app-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { BlocksFoundCard } from "@/components/blocks-found-card";
import { DifficultyAdjustmentBar } from "@/components/difficulty-adjustment-bar";
import { HalvingCountdown } from "@/components/halving-countdown";
import { HashrateChart } from "@/components/hashrate-chart";
import { WorkersTable } from "@/components/workers-table";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUptime, hashSuffix, numberSuffix } from "@/lib/format";
import { getDashboard } from "@/lib/pool";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboard = await getDashboard();
  const { pool, chart, workers, foundBlocks, network, difficultyAdjustment, uptimeSeconds } =
    dashboard;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AutoRefresh />
      <AppHeader network={network} />

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

      <HashrateChart data={chart} />

      <WorkersTable workers={workers} totalMiners={pool.totalMiners} />

      <p className="text-sm text-muted-foreground">
        Lido is a Fully Open Source Solo Bitcoin Mining Pool fork of Public Pool.
      </p>
    </div>
  );
}
