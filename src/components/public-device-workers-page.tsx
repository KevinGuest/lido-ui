"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { AutoRefresh } from "@/components/auto-refresh";
import { ModalOverlay } from "@/components/modal-overlay";
import { RelativeTime } from "@/components/relative-time";
import { groupWorkersByDevice } from "@/components/public-device-table";
import {
  PublicSortToolbar,
  compareByPublicSort,
  lastSeenMs,
  type PublicSortKey,
} from "@/components/public-sort-toolbar";
import { TablePager } from "@/components/table-pager";
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
import { useAddressSession } from "@/lib/address-session";
import { addressHasPoolWorkers } from "@/lib/address-auth";
import type { DeploymentKind } from "@/lib/app-meta";
import { deviceLabel, deviceKeyFromRouteSlug } from "@/lib/device-label";
import { formatUptime, hashSuffix, numberSuffix } from "@/lib/format";
import { minerColor } from "@/lib/miner-colors";
import type { DashboardPayload, Worker } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function rankBadge(rank: number) {
  if (rank === 1) {
    return (
      <Badge className="border-transparent bg-yellow-500/20 font-semibold tabular-nums text-yellow-700 dark:text-yellow-400">
        #{rank}
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="border-transparent bg-zinc-400/20 font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
        #{rank}
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="border-transparent bg-amber-700/25 font-semibold tabular-nums text-amber-900 dark:text-amber-500">
        #{rank}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="tabular-nums text-muted-foreground dark:text-white">
      #{rank}
    </Badge>
  );
}

function DetailValue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular-nums", className)}>
      {children}
    </span>
  );
}

function rejectShareLabel(accepted: number, rejected: number) {
  const total = accepted + rejected;
  if (total <= 0) return "0%";
  const pct = (rejected / total) * 100;
  const pctText =
    pct >= 10 ? pct.toFixed(1) : pct >= 1 ? pct.toFixed(2) : pct.toFixed(3);
  return `${pctText}%`;
}

function MinerDetailDialog({
  worker,
  onClose,
}: {
  worker: Worker;
  onClose: () => void;
}) {
  const rows: { label: string; value: ReactNode }[] = [
    {
      label: "Name",
      value: <span className="font-medium">{worker.name}</span>,
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
      value: (
        <DetailValue>
          {worker.online === false ? "—" : hashSuffix(worker.hashrate)}
        </DetailValue>
      ),
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
      label: "Best difficulty",
      value: (
        <DetailValue>
          {worker.bestDifficulty ? numberSuffix(worker.bestDifficulty) : "—"}
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
      <div className="w-[min(100%,32rem)] min-w-0 overflow-hidden rounded-xl bg-background lido-dialog-shell">
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

export function PublicDeviceWorkersPage({
  initial,
  deployment,
  stratumConfigured = "",
  deviceSlug,
}: {
  initial: DashboardPayload;
  deployment: DeploymentKind;
  stratumConfigured?: string;
  deviceSlug: string;
}) {
  const router = useRouter();
  const session = useAddressSession();
  const deviceKey = deviceKeyFromRouteSlug(deviceSlug);

  const [dashboard, setDashboard] = useState(initial);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<PublicSortKey>("hashrate");
  const [addressQuery, setAddressQuery] = useState("");

  useEffect(() => {
    setDashboard(initial);
  }, [initial]);

  // Logged-in users use the personalized home dashboard.
  useEffect(() => {
    if (session.ready && session.address) {
      if (!addressHasPoolWorkers(session.address, dashboard.workers)) {
        session.logout();
        return;
      }
      router.replace("/");
    }
  }, [
    session.ready,
    session.address,
    session.logout,
    router,
    dashboard.workers,
  ]);

  const group = useMemo(() => {
    const groups = groupWorkersByDevice(dashboard.workers);
    return groups.find((entry) => entry.key === deviceKey) ?? null;
  }, [dashboard.workers, deviceKey]);

  const filtered = useMemo(() => {
    if (!group) return [];
    const query = addressQuery.trim().toLowerCase();
    if (!query) return group.workers;
    return group.workers.filter((worker) =>
      worker.address.trim().toLowerCase().includes(query),
    );
  }, [group, addressQuery]);

  const sorted = useMemo(() => {
    return [...filtered]
      .map((worker) => ({
        worker,
        hashrate: worker.online === false ? 0 : worker.hashrate,
        bestDifficulty: worker.bestDifficulty || 0,
        lastSeenMs: lastSeenMs(worker.lastSeen),
        name: worker.name,
      }))
      .sort((a, b) => {
        const aOnline = a.worker.online !== false;
        const bOnline = b.worker.online !== false;
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
        return compareByPublicSort(a, b, sort);
      })
      .map((entry) => entry.worker);
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const visible = useMemo(() => {
    const start = safePageIndex * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [deviceKey, sort, addressQuery]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const selected =
    sorted.find((worker) => worker.id === selectedId) ??
    visible.find((worker) => worker.id === selectedId) ??
    null;

  const label = group?.label ?? deviceLabel(deviceKey);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AutoRefresh seconds={60} />
      <AppHeader
        network={dashboard.network}
        stratumConfigured={stratumConfigured}
        sv2AuthorityPublicKey={dashboard.sv2AuthorityPublicKey}
        deployment={deployment}
        loggedInAddress={session.address}
        onLogin={session.login}
        onLogout={session.logout}
        loginWorkers={dashboard.workers}
      />

      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back
        </Link>
      </div>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: minerColor(label) }}
              aria-hidden
            />
            {label}
          </CardTitle>
          <CardDescription>
            {group
              ? `${group.working.toLocaleString()} working · ${hashSuffix(group.hashrate)} · ${sorted.length.toLocaleString()} shown`
              : "No miners for this device type."}
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <PublicSortToolbar sort={sort} onSortChange={setSort} />
              <label className="sr-only" htmlFor="device-address-search">
                Search by Bitcoin address
              </label>
              <input
                id="device-address-search"
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
                placeholder="Search by address…"
                autoComplete="off"
                spellCheck={false}
                className="w-[14rem] max-w-full rounded-md border border-border bg-transparent px-3 py-1.5 font-mono text-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Hashrate</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Best diff</TableHead>
                <TableHead className="hidden text-right md:table-cell">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {addressQuery.trim()
                      ? "No miners match that address."
                      : "No miners found for this device."}
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((worker, index) => {
                  const online = worker.online !== false;
                  const rank = safePageIndex * PAGE_SIZE + index + 1;
                  return (
                    <TableRow
                      key={worker.id}
                      className={cn("cursor-pointer", !online && "opacity-60")}
                      onClick={() => setSelectedId(worker.id)}
                    >
                      <TableCell>{rankBadge(rank)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{worker.name}</span>
                          {!online ? (
                            <span className="text-[11px] text-muted-foreground">Offline</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {online ? hashSuffix(worker.hashrate) : "—"}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {worker.bestDifficulty
                          ? numberSuffix(worker.bestDifficulty)
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden text-right md:table-cell">
                        <RelativeTime iso={worker.lastSeen} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePager
            pageIndex={safePageIndex}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={sorted.length}
            noun="miners"
            onPageChange={setPageIndex}
          />
        </CardContent>
      </Card>

      {selected ? (
        <MinerDetailDialog worker={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}
