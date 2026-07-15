"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Flame, Thermometer, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUptime, hashSuffix, numberSuffix, timeAgo } from "@/lib/format";
import type { Worker } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SortKey = "name" | "hashrate" | "shares" | "bestDifficulty" | "uptime" | "blocks";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "hashrate", label: "Hashrate" },
  { key: "shares", label: "Shares" },
  { key: "bestDifficulty", label: "Best diff" },
  { key: "uptime", label: "Uptime" },
  { key: "blocks", label: "Blocks" },
];

function compareWorkers(a: Worker, b: Worker, sort: SortKey) {
  switch (sort) {
    case "hashrate":
      return b.hashrate - a.hashrate || a.name.localeCompare(b.name);
    case "shares":
      return b.shares - a.shares || a.name.localeCompare(b.name);
    case "bestDifficulty":
      return b.bestDifficulty - a.bestDifficulty || a.name.localeCompare(b.name);
    case "uptime":
      return (b.uptimeSeconds ?? -1) - (a.uptimeSeconds ?? -1) || a.name.localeCompare(b.name);
    case "blocks":
      return b.blocksFound - a.blocksFound || a.name.localeCompare(b.name);
    case "name":
    default:
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  }
}

function rankByBestDiff(workers: Worker[]) {
  const ranked = [...workers].sort(
    (a, b) => b.bestDifficulty - a.bestDifficulty || a.name.localeCompare(b.name),
  );
  const ranks = new Map<string, number>();
  ranked.forEach((worker, index) => {
    ranks.set(worker.id, index + 1);
  });
  return ranks;
}

function DetailValue({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-sm tabular-nums text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function WorkerDialog({
  worker,
  rank,
  onClose,
}: {
  worker: Worker;
  rank: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Rank",
      value: (
        <Badge
          className={cn(
            "border-transparent font-medium tabular-nums",
            rank === 1
              ? "bg-amber-400 text-black"
              : rank === 2
                ? "bg-zinc-300 text-black"
                : rank === 3
                  ? "bg-amber-700 text-white"
                  : "bg-foreground text-background",
          )}
        >
          #{rank}
        </Badge>
      ),
    },
    {
      label: "Name",
      value: worker.dashboardUrl ? (
        <a
          href={worker.dashboardUrl}
          target="_blank"
          rel="noreferrer"
          className="font-medium underline underline-offset-4 hover:text-muted-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          {worker.name}
        </a>
      ) : (
        <span className="font-medium">{worker.name}</span>
      ),
    },
    { label: "Device", value: <span>{worker.userAgent || "n/a"}</span> },
    {
      label: "Address",
      value: (
        <span className="max-w-[240px] truncate font-mono text-xs">
          {worker.address || "n/a"}
        </span>
      ),
    },
    {
      label: "Hashrate",
      value: <DetailValue>{hashSuffix(worker.hashrate)}</DetailValue>,
    },
    {
      label: "Shares",
      value: <DetailValue>{worker.shares.toLocaleString()}</DetailValue>,
    },
    {
      label: "Best diff",
      value: (
        <DetailValue>
          <Flame className="size-3.5 text-orange-500" strokeWidth={1.75} />
          {worker.bestDifficulty ? numberSuffix(worker.bestDifficulty) : "n/a"}
        </DetailValue>
      ),
    },
    {
      label: "Uptime",
      value: (
        <DetailValue>
          {worker.uptimeSeconds == null ? "n/a" : formatUptime(worker.uptimeSeconds)}
        </DetailValue>
      ),
    },
    {
      label: "Temp",
      value: (
        <DetailValue>
          <Thermometer className="size-3.5 text-sky-500" strokeWidth={1.75} />
          {worker.tempC == null ? "n/a" : `${worker.tempC.toFixed(0)}°C`}
        </DetailValue>
      ),
    },
    {
      label: "Blocks found",
      value: <DetailValue>{worker.blocksFound}</DetailValue>,
    },
    {
      label: "Last seen",
      value: (
        <DetailValue>
          {worker.lastSeen ? timeAgo(worker.lastSeen) : "n/a"}
        </DetailValue>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${worker.name} details`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-xl">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>{worker.name}</CardTitle>
            <CardDescription>Miner details</CardDescription>
            <CardAction>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Close"
                onClick={onClose}
              >
                <X />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-lg border border-border">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
                >
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <div className="min-w-0 text-right">{row.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function WorkersTable({
  workers,
  totalMiners,
}: {
  workers: Worker[];
  totalMiners: number;
}) {
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ranks = useMemo(() => rankByBestDiff(workers), [workers]);
  const sorted = useMemo(
    () => [...workers].sort((a, b) => compareWorkers(a, b, sort)),
    [workers, sort],
  );
  const selected = sorted.find((worker) => worker.id === selectedId) ?? null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Miners
            <Badge className="border-transparent bg-foreground font-normal tabular-nums text-background">
              {totalMiners} online
            </Badge>
          </CardTitle>
          <CardDescription>
            Connected workers show up here. Tap a row for full miner details.
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <span className="mr-0.5 text-xs text-muted-foreground">Sort</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSort(option.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    sort === option.key
                      ? "border-transparent bg-foreground text-background"
                      : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Device</TableHead>
                <TableHead className="text-right">Hashrate</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Uptime</TableHead>
                <TableHead className="text-right">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No miner details yet. Open Connect to add miners — they show up here as they
                    join.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(worker.id)}
                  >
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {worker.userAgent || "n/a"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {hashSuffix(worker.hashrate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {worker.shares.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {worker.uptimeSeconds == null
                        ? "n/a"
                        : formatUptime(worker.uptimeSeconds)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {worker.lastSeen ? timeAgo(worker.lastSeen) : "n/a"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected ? (
        <WorkerDialog
          worker={selected}
          rank={ranks.get(selected.id) ?? workers.length}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </>
  );
}
