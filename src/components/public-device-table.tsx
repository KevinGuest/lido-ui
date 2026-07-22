"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

import {
  PublicSortToolbar,
  compareByPublicSort,
  lastSeenMs,
  type PublicSortKey,
} from "@/components/public-sort-toolbar";
import { TablePager } from "@/components/table-pager";
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
import { deviceGroupKey, deviceLabel, deviceRouteSlug } from "@/lib/device-label";
import { hashSuffix, numberSuffix } from "@/lib/format";
import { minerColor } from "@/lib/miner-colors";
import type { Worker } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export type DeviceGroup = {
  key: string;
  label: string;
  workers: Worker[];
  working: number;
  hashrate: number;
  bestDifficulty: number;
  lastSeenMs: number;
};

const PAGE_SIZE = 10;

const BEST_DIFF_TIP =
  "A submitted difficulty above the current Bitcoin network difficulty is a valid block candidate.";

function TipIcon({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex shrink-0 align-middle">
      <Info
        className="size-3.5 text-muted-foreground/80"
        strokeWidth={1.75}
        aria-hidden
      />
      <span
        className={cn(
          // Right-aligned so the tip never extends past the card (avoids phantom x-scroll).
          "pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-52 max-w-[70vw]",
          "rounded-md border border-transparent bg-foreground px-2 py-1.5 text-left text-[11px] leading-snug",
          "whitespace-normal text-background shadow-lg",
          "invisible opacity-0 transition-opacity group-hover:visible group-hover:opacity-100",
          "group-focus-within:visible group-focus-within:opacity-100",
          "before:absolute before:right-2 before:top-full before:border-[5px]",
          "before:border-transparent before:border-t-foreground before:content-['']",
        )}
      >
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

export function groupWorkersByDevice(workers: Worker[]): DeviceGroup[] {
  const map = new Map<string, DeviceGroup>();
  for (const worker of workers) {
    const label = deviceLabel(worker.userAgent);
    const key = deviceGroupKey(worker.userAgent);
    const online = worker.online !== false;
    const seen = lastSeenMs(worker.lastSeen);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        label,
        workers: [worker],
        working: online ? 1 : 0,
        hashrate: online ? worker.hashrate : 0,
        bestDifficulty: worker.bestDifficulty || 0,
        lastSeenMs: seen,
      });
      continue;
    }
    existing.workers.push(worker);
    if (online) {
      existing.working += 1;
      existing.hashrate += worker.hashrate;
    }
    existing.bestDifficulty = Math.max(
      existing.bestDifficulty,
      worker.bestDifficulty || 0,
    );
    existing.lastSeenMs = Math.max(existing.lastSeenMs, seen);
  }
  return Array.from(map.values());
}

export function PublicDeviceTable({ workers }: { workers: Worker[] }) {
  const router = useRouter();
  const groups = useMemo(() => groupWorkersByDevice(workers), [workers]);
  const [sort, setSort] = useState<PublicSortKey>("hashrate");
  const [pageIndex, setPageIndex] = useState(0);

  const sorted = useMemo(
    () =>
      [...groups].sort((a, b) => {
        if (a.working > 0 !== b.working > 0) return a.working > 0 ? -1 : 1;
        return compareByPublicSort(a, b, sort);
      }),
    [groups, sort],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visible = useMemo(() => {
    const start = safePageIndex * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [sort]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Miners</CardTitle>
        <CardDescription>
          Open a row for that device’s workers.
        </CardDescription>
        <CardAction>
          <PublicSortToolbar sort={sort} onSortChange={setSort} />
        </CardAction>
      </CardHeader>
      <CardContent className="min-w-0 overflow-x-hidden">
        <div className="min-w-0 [&_[data-slot=table-container]]:overflow-x-hidden">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[36%]">Device</TableHead>
                <TableHead className="w-[16%] text-right">Working</TableHead>
                <TableHead className="w-[22%] text-right">Hashrate</TableHead>
                <TableHead className="w-[26%] text-right">
                  <span className="inline-flex items-center justify-end gap-0.5">
                    Best diff
                    <TipIcon text={BEST_DIFF_TIP} />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No miners connected yet.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((group) => (
                  <TableRow
                    key={group.key}
                    className="cursor-pointer"
                    onClick={() => router.push(`/device/${deviceRouteSlug(group.key)}`)}
                  >
                    <TableCell className="font-medium">
                      <span className="inline-flex max-w-full items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: minerColor(group.label) }}
                          aria-hidden
                        />
                        <span className="truncate" title={group.label}>
                          {group.label}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {group.working.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {hashSuffix(group.hashrate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {group.bestDifficulty
                        ? numberSuffix(group.bestDifficulty)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePager
          pageIndex={safePageIndex}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          total={sorted.length}
          noun="devices"
          onPageChange={setPageIndex}
        />
      </CardContent>
    </Card>
  );
}
