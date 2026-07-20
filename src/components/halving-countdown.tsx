"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FileText, History, Info, X } from "lucide-react";

import { ModalOverlay } from "@/components/modal-overlay";
import { Card, CardContent } from "@/components/ui/card";
import { cn, hoverLabelClassName } from "@/lib/utils";

const HALVING_INTERVAL = 210_000;
const INITIAL_SUBSIDY_BTC = 50;
const TARGET_BLOCK_MS = 600_000;

type Pane = "about" | "history";

const PREVIOUS_HALVINGS = [
  { height: 210_000, date: "2012-11-28", rewardBtc: 25 },
  { height: 420_000, date: "2016-07-09", rewardBtc: 12.5 },
  { height: 630_000, date: "2020-05-11", rewardBtc: 6.25 },
  { height: 840_000, date: "2024-04-19", rewardBtc: 3.125 },
] as const;

function formatSubsidy(btc: number) {
  if (btc >= 1) return `${btc.toFixed(btc % 1 === 0 ? 0 : 4)} BTC`;
  if (btc >= 0.01) return `${btc.toFixed(4)} BTC`;
  return `${btc.toFixed(8)} BTC`;
}

function formatHalvingDate(ms: number) {
  // Pin locale so SSR (Node) and the browser agree (e.g. "AM" vs "a.m.").
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatHistoryDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function HalvingCountdown({
  height,
  avgBlockMs = 0,
}: {
  height: number;
  avgBlockMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<Pane>("about");
  // Date.now() during SSR vs hydrate drifts by a minute — set after mount.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  if (!height || height < 0) return null;

  const blocksIntoEpoch = height % HALVING_INTERVAL;
  const blocksRemaining = HALVING_INTERVAL - blocksIntoEpoch;
  const epoch = Math.floor(height / HALVING_INTERVAL);
  const newSubsidy = INITIAL_SUBSIDY_BTC / 2 ** (epoch + 1);
  const blockMs = avgBlockMs > 0 ? avgBlockMs : TARGET_BLOCK_MS;
  const progress = Math.min(100, Math.max(0, (blocksIntoEpoch / HALVING_INTERVAL) * 100));
  const etaLabel =
    nowMs == null ? "—" : formatHalvingDate(nowMs + blocksRemaining * blockMs);

  function openModal(next: Pane = "about") {
    setPane(next);
    setOpen(true);
  }

  return (
    <>
      <Card size="sm" className="h-full overflow-visible">
        <CardContent className="flex h-full flex-col justify-between gap-2.5 overflow-visible">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              Halving
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="What is a Bitcoin halving?"
                onClick={() => openModal("about")}
              >
                <Info className="size-3.5" strokeWidth={1.75} />
              </button>
            </p>
            <p className="font-medium tabular-nums text-foreground">
              {formatSubsidy(newSubsidy)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">new subsidy</span>
            </p>
          </div>

          <div className="group/bar relative h-1.5 cursor-default overflow-visible rounded-sm bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-sm bg-foreground/80 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
            <span
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 px-2 py-0.5",
                hoverLabelClassName,
                "tabular-nums opacity-0 transition-opacity group-hover/bar:opacity-100",
              )}
            >
              {progress.toFixed(2)}%
            </span>
          </div>

          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {blocksRemaining.toLocaleString("en-US")} blocks remaining
            </span>
            <span className="tabular-nums">{etaLabel}</span>
          </div>
        </CardContent>
      </Card>

      <ModalOverlay
        open={open}
        onClose={() => setOpen(false)}
        label={pane === "about" ? "About Bitcoin halvings" : "Previous halvings"}
      >
        <div className="w-[min(100%,32rem)] min-w-0 overflow-hidden rounded-xl bg-background px-6 pt-6 pb-6 lido-dialog-shell sm:px-8 sm:pt-8 sm:pb-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <h2 className="text-lg font-medium text-foreground">
                  {pane === "about" ? "What is a Bitcoin halving?" : "Previous halvings"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {pane === "about"
                    ? "How miner rewards and supply issuance change over time."
                    : "Historical subsidy cuts at each 210,000-block epoch."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ToolbarButton
                  active={pane === "about"}
                  label="About halvings"
                  onClick={() => setPane("about")}
                >
                  <FileText className="size-4" strokeWidth={1.75} />
                </ToolbarButton>
                <ToolbarButton
                  active={pane === "history"}
                  label="Previous halvings"
                  onClick={() => setPane("history")}
                >
                  <History className="size-4" strokeWidth={1.75} />
                </ToolbarButton>
                <ToolbarButton label="Close" onClick={() => setOpen(false)}>
                  <X className="size-4" strokeWidth={1.75} />
                </ToolbarButton>
              </div>
            </div>

            {pane === "about" ? (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Every 210,000 blocks (~4 years), Bitcoin cuts the block subsidy in half. That
                  reward is the new bitcoin miners earn for finding a block, on top of transaction
                  fees.
                </p>
                <p>
                  Halvings keep issuance predictable and scarce: the schedule started at 50 BTC per
                  block, then 25, 12.5, 6.25, 3.125, and so on, until the subsidy eventually reaches
                  zero.
                </p>
                <p>
                  This panel shows the next subsidy after the upcoming halving, how many blocks are
                  left, and an ETA based on recent average block time.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Block</th>
                      <th className="px-3 py-2.5 font-medium">Date</th>
                      <th className="px-3 py-2.5 font-medium text-right">New reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...PREVIOUS_HALVINGS].reverse().map((row) => (
                      <tr key={row.height}>
                        <td className="px-3 py-2.5 font-mono tabular-nums text-foreground">
                          {row.height.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {formatHistoryDate(row.date)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums text-foreground">
                          {formatSubsidy(row.rewardBtc)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </ModalOverlay>
    </>
  );
}
