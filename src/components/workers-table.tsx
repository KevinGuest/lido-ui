"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Flame, List, MoreHorizontal, X } from "lucide-react";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RelativeTime } from "@/components/relative-time";
import { ModalOverlay } from "@/components/modal-overlay";
import { formatUptime, hashSuffix, numberSuffix } from "@/lib/format";
import { minerColor } from "@/lib/miner-colors";
import { minerInfoUrl } from "@/lib/miner-info-url";
import type { Worker } from "@/lib/mock-data";
import {
  useRememberedWorkers,
  type ListedWorker,
} from "@/lib/remembered-workers";
import { cn, hoverLabelClassName } from "@/lib/utils";

type SortKey = "name" | "hashrate" | "shares" | "bestDifficulty" | "uptime" | "blocks";

const PAGE_SIZE = 8;
const PAGINATE_STORAGE_KEY = "lido-miners-paginate";

function readPaginatePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PAGINATE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writePaginatePreference(enabled: boolean) {
  try {
    localStorage.setItem(PAGINATE_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore storage errors.
  }
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "hashrate", label: "Hashrate" },
  { key: "shares", label: "Shares" },
  { key: "bestDifficulty", label: "Best diff" },
  { key: "uptime", label: "Uptime" },
  { key: "blocks", label: "Blocks" },
];

function compareWorkers(a: ListedWorker, b: ListedWorker, sort: SortKey) {
  // Online miners first, then the active sort.
  if (a.online !== b.online) return a.online ? -1 : 1;

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

function rejectShareLabel(accepted: number, rejected: number) {
  const total = accepted + rejected;
  if (total <= 0) return "0%";
  return `${((rejected / total) * 100).toFixed(1)}%`;
}

function SharesCell({ accepted, rejected }: { accepted: number; rejected: number }) {
  return (
    <div className="flex flex-col items-end gap-0.5 leading-tight">
      <span className="tabular-nums">{accepted.toLocaleString()}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        {rejected.toLocaleString()} rej · {rejectShareLabel(accepted, rejected)}
      </span>
    </div>
  );
}

function MinerNameCell({ worker }: { worker: ListedWorker }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "size-2.5 shrink-0 rounded-[2px]",
          !worker.online && "opacity-40",
        )}
        style={{ backgroundColor: minerColor(worker.name) }}
        aria-hidden
      />
      <span className="min-w-0">
        {worker.name}
        {!worker.online ? (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Offline
          </span>
        ) : null}
      </span>
    </span>
  );
}

function deviceLabel(userAgent: string | null | undefined): string {
  const raw = (userAgent || "").trim();
  if (!raw) return "n/a";
  // Older SV2 sessions stored vendor with a redundant /sv2 suffix.
  return raw.replace(/\/sv2$/i, "") || "n/a";
}

function MinerDeviceCell({ worker }: { worker: ListedWorker }) {
  const label = deviceLabel(worker.userAgent);
  const href = minerInfoUrl({ ...worker, userAgent: label });

  if (!href) {
    return <span className="text-muted-foreground">{label}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </a>
  );
}

function DetailValue({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 text-sm tabular-nums text-foreground",
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
    { label: "Device", value: <span>{deviceLabel(worker.userAgent)}</span> },
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
      value: (
        <DetailValue className="flex-col items-end gap-0.5">
          <span>{worker.shares.toLocaleString()} accepted</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {worker.rejectedShares.toLocaleString()} rejected ·{" "}
            {rejectShareLabel(worker.shares, worker.rejectedShares)}
          </span>
        </DetailValue>
      ),
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
      label: "Blocks found",
      value: <DetailValue>{worker.blocksFound}</DetailValue>,
    },
    {
      label: "Protocol",
      value: (
        <DetailValue>{worker.protocol === "sv2" ? "Stratum V2" : "Stratum V1"}</DetailValue>
      ),
    },
    {
      label: "Last seen",
      value: (
        <DetailValue>
          <RelativeTime iso={worker.lastSeen} />
        </DetailValue>
      ),
    },
  ];

  return (
    <ModalOverlay open onClose={onClose} label={`${worker.name} details`}>
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-background lido-dialog-shell">
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
    </ModalOverlay>
  );
}

export function WorkersTable({
  workers: liveWorkers,
  persistRemovals = true,
}: {
  workers: Worker[];
  /** When false (demo), Remove works for the session only and resets on refresh. */
  persistRemovals?: boolean;
  /** @deprecated Online count is derived from remembered + live workers. */
  totalMiners?: number;
}) {
  const { workers, onlineCount, removeWorker } = useRememberedWorkers(
    liveWorkers,
    { persistRemovals },
  );
  const [sort, setSort] = useState<SortKey>("hashrate");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paginate, setPaginate] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPaginate(readPaginatePreference());
  }, []);

  const ranks = useMemo(() => rankByBestDiff(workers), [workers]);
  const sorted = useMemo(
    () => [...workers].sort((a, b) => compareWorkers(a, b, sort)),
    [workers, sort],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const visibleWorkers = useMemo(() => {
    if (!paginate || sorted.length <= PAGE_SIZE) return sorted;
    const start = safePageIndex * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [paginate, safePageIndex, sorted]);

  const selected =
    sorted.find((worker) => worker.id === selectedId) ??
    visibleWorkers.find((worker) => worker.id === selectedId) ??
    null;

  function togglePaginate() {
    setPaginate((current) => {
      const next = !current;
      writePaginatePreference(next);
      return next;
    });
    setPageIndex(0);
  }

  return (
    <>
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Miners
            <Badge className="border-transparent bg-foreground font-normal tabular-nums text-background">
              {onlineCount}/{workers.length} online
            </Badge>
          </CardTitle>
          <CardDescription>
            Miners stay listed after they disconnect. Use the row menu to remove one.
          </CardDescription>
          <CardAction>
            <div className="relative z-20 flex flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={togglePaginate}
                aria-label={paginate ? "Turn off pagination" : "Paginate miners"}
                aria-pressed={paginate}
                className={cn(
                  "group relative inline-flex items-center justify-center rounded-full border px-2.5 py-1 transition-colors",
                  paginate
                    ? "border-transparent bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <List className="size-3.5" strokeWidth={1.75} />
                <span
                  className={cn(
                    "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2",
                    hoverLabelClassName,
                    "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                >
                  {paginate ? "Show all" : "Paginate"}
                </span>
              </button>
              <span className="mx-0.5 hidden h-4 w-px bg-border sm:inline-block" />
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
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No miner details yet. Open Connect to add miners — they show up here as they
                    join.
                  </TableCell>
                </TableRow>
              ) : (
                visibleWorkers.map((worker) => (
                  <TableRow
                    key={worker.id}
                    className={cn(
                      "cursor-pointer",
                      !worker.online && "opacity-60",
                    )}
                    onClick={() => setSelectedId(worker.id)}
                  >
                    <TableCell className="font-medium">
                      <MinerNameCell worker={worker} />
                    </TableCell>
                    <TableCell>
                      <MinerDeviceCell worker={worker} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {worker.online ? hashSuffix(worker.hashrate) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <SharesCell accepted={worker.shares} rejected={worker.rejectedShares} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {!worker.online || worker.uptimeSeconds == null
                        ? "n/a"
                        : formatUptime(worker.uptimeSeconds)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      <RelativeTime iso={worker.lastSeen} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          nativeButton
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-md",
                            "text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
                          )}
                          aria-label={`Actions for ${worker.name}`}
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" strokeWidth={1.75} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-36 w-auto"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeWorker(worker);
                              if (selectedId === worker.id) setSelectedId(null);
                            }}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {paginate && sorted.length > PAGE_SIZE ? (
            <div className="mt-4 flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Previous page"
                disabled={safePageIndex === 0}
                onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-[10rem] text-center text-xs tabular-nums text-muted-foreground">
                Showing {safePageIndex * PAGE_SIZE + 1}–
                {Math.min((safePageIndex + 1) * PAGE_SIZE, sorted.length)} of{" "}
                {sorted.length} miners
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Next page"
                disabled={safePageIndex >= pageCount - 1}
                onClick={() =>
                  setPageIndex((page) => Math.min(pageCount - 1, page + 1))
                }
              >
                <ChevronRight />
              </Button>
            </div>
          ) : null}
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
