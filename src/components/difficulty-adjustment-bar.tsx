import { Card, CardContent } from "@/components/ui/card";
import type { DifficultyAdjustment } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const EPOCH_BLOCKS = 2016;

function formatChange(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatAvgBlockTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "n/a";
  return `~${(ms / 60_000).toFixed(1)} minutes`;
}

function changeColor(value: number) {
  if (value > 0.05) return "text-emerald-400";
  if (value < -0.05) return "text-rose-400";
  return "text-muted-foreground";
}

export function DifficultyAdjustmentBar({
  data,
}: {
  data: DifficultyAdjustment | null;
}) {
  if (!data) return null;

  const progress = Math.min(100, Math.max(0, data.progressPercent));
  const minedBlocks = Math.max(0, EPOCH_BLOCKS - data.remainingBlocks);
  const expectedPct = Math.min(
    100,
    Math.max(0, (data.expectedBlocks / EPOCH_BLOCKS) * 100),
  );
  const ahead = minedBlocks - data.expectedBlocks;
  const isAhead = ahead >= 0;
  const sharedPct = Math.min(progress, expectedPct);

  return (
    <Card size="sm" className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-2.5">
        {/* Desktop header */}
        <div className="hidden flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm md:flex">
          <p className="text-muted-foreground">
            Average block time{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatAvgBlockTime(data.timeAvgMs)}
            </span>
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className={`font-medium tabular-nums ${changeColor(data.difficultyChange)}`}>
              {formatChange(data.difficultyChange)}
            </p>
            <p className="text-muted-foreground">
              Previous{" "}
              <span className={`font-medium tabular-nums ${changeColor(data.previousRetarget)}`}>
                {formatChange(data.previousRetarget)}
              </span>
            </p>
          </div>
        </div>

        {/* Mobile header — stacked, less wrap chaos */}
        <div className="flex flex-col gap-2 md:hidden">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-muted-foreground">Average block time</p>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {formatAvgBlockTime(data.timeAvgMs)}
            </p>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className={cn("font-medium tabular-nums", changeColor(data.difficultyChange))}>
              {formatChange(data.difficultyChange)}
            </p>
            <p className="text-muted-foreground">
              Prev{" "}
              <span className={cn("font-medium tabular-nums", changeColor(data.previousRetarget))}>
                {formatChange(data.previousRetarget)}
              </span>
            </p>
          </div>
        </div>

        <div className="relative h-1.5 overflow-hidden rounded-sm bg-muted">
          {/* Expected pace */}
          <div
            className="absolute inset-y-0 left-0 rounded-sm bg-[#89cff0]/40 transition-[width] duration-500"
            style={{ width: `${expectedPct}%` }}
          />
          {/* Behind schedule */}
          {!isAhead && expectedPct > progress ? (
            <div
              className="absolute inset-y-0 rounded-sm bg-rose-400/80 transition-[left,width] duration-500"
              style={{ left: `${progress}%`, width: `${expectedPct - progress}%` }}
            />
          ) : null}
          {/* Shared / on schedule */}
          <div
            className="absolute inset-y-0 left-0 rounded-sm bg-[#89cff0] transition-[width] duration-500"
            style={{ width: `${sharedPct}%` }}
          />
          {/* Ahead of schedule */}
          {isAhead && progress > expectedPct ? (
            <div
              className="absolute inset-y-0 rounded-sm bg-emerald-400/80 transition-[left,width] duration-500"
              style={{ left: `${expectedPct}%`, width: `${progress - expectedPct}%` }}
            />
          ) : null}
        </div>

        {/* Desktop footer */}
        <div className="hidden flex-wrap justify-between gap-x-4 gap-y-1 text-xs md:flex">
          <span className="tabular-nums">
            <span className="text-[#89cff0]">
              {data.expectedBlocks.toFixed(0)} blocks expected
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className={isAhead ? "text-emerald-400" : "text-rose-400"}>
              {Math.abs(ahead).toFixed(0)} blocks {isAhead ? "ahead" : "behind"}
            </span>
          </span>
          <span className="tabular-nums text-muted-foreground">
            {data.remainingBlocks.toLocaleString()} remaining →{" "}
            {data.nextRetargetHeight.toLocaleString()}
          </span>
        </div>

        {/* Mobile footer — two clear rows */}
        <div className="flex flex-col gap-1 text-xs md:hidden">
          <div className="flex justify-between gap-3 tabular-nums">
            <span className="text-[#89cff0]">
              {data.expectedBlocks.toFixed(0)} expected
            </span>
            <span className={isAhead ? "text-emerald-400" : "text-rose-400"}>
              {Math.abs(ahead).toFixed(0)} {isAhead ? "ahead" : "behind"}
            </span>
          </div>
          <div className="flex justify-between gap-3 tabular-nums text-muted-foreground">
            <span>{data.remainingBlocks.toLocaleString()} left</span>
            <span>→ {data.nextRetargetHeight.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
