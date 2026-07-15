"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { type DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { hashSuffix } from "@/lib/format";
import type { ChartPoint, MinerChartSeries } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MINER_COLORS = [
  "oklch(0.82 0.16 145)",
  "oklch(0.78 0.14 220)",
  "oklch(0.84 0.14 85)",
  "oklch(0.78 0.16 25)",
  "oklch(0.78 0.14 300)",
  "oklch(0.82 0.12 180)",
  "oklch(0.8 0.16 350)",
  "oklch(0.86 0.08 95)",
];

const totalChartConfig = {
  hashrate: {
    label: "Hashrate",
    color: "oklch(0.95 0 0)",
  },
} satisfies ChartConfig;

type ChartRow = {
  time: string;
  iso: string;
  hashrate?: number;
  [minerKey: string]: string | number | undefined;
};

type TimeWindow = { from: string; to: string };

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function clampWindow(window: TimeWindow, chartSince: string): TimeWindow {
  const min = new Date(chartSince).getTime();
  const max = Date.now();
  let from = new Date(window.from).getTime();
  let to = new Date(window.to).getTime();
  if (!Number.isFinite(from)) from = min;
  if (!Number.isFinite(to)) to = max;
  from = Math.max(min, Math.min(from, max));
  to = Math.max(from, Math.min(to, max));
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}

function filterByWindow(data: ChartPoint[], window: TimeWindow): ChartPoint[] {
  const fromTs = new Date(window.from).getTime();
  const toTs = new Date(window.to).getTime();
  return data.filter((point) => {
    const ts = new Date(point.label).getTime();
    return Number.isFinite(ts) && ts >= fromTs && ts <= toTs;
  });
}

function formatTick(iso: string, spanMs: number) {
  const date = new Date(iso);
  if (spanMs <= 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Compact Y-axis label so values like "28.02 TH/s" don't clip. */
function hashAxisTick(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0";
  const units = ["H", "KH", "MH", "GH", "TH", "PH", "EH", "ZH"];
  let v = value;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i += 1;
  }
  const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)}${units[i]}`;
}

function formatTooltipLabel(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function windowLabel(window: TimeWindow) {
  const from = new Date(window.from);
  const to = new Date(window.to);
  if (from.toDateString() === to.toDateString()) {
    return format(from, "PPP");
  }
  return `${format(from, "LLL dd, y")} – ${format(to, "LLL dd, y")}`;
}

function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span>Live · 24h</span>
    </span>
  );
}

function seriesKey(name: string, index: number) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `m_${slug || "miner"}_${index}`;
}

function prepareTotalRows(
  data: ChartPoint[],
  window: TimeWindow,
): { rows: ChartRow[]; flatZero: boolean } {
  const filtered = filterByWindow(data, window);
  const spanMs = new Date(window.to).getTime() - new Date(window.from).getTime();
  const rows = filtered.map((point) => ({
    time: formatTick(point.label, spanMs),
    iso: point.label,
    hashrate: Number(point.data) || 0,
  }));
  return {
    rows,
    flatZero: rows.length === 0 || rows.every((row) => (row.hashrate ?? 0) === 0),
  };
}

function prepareMinerRows(
  miners: MinerChartSeries[],
  window: TimeWindow,
): { rows: ChartRow[]; keys: string[]; config: ChartConfig; flatZero: boolean } {
  const spanMs = new Date(window.to).getTime() - new Date(window.from).getTime();
  const keys: string[] = [];
  const config: ChartConfig = {};
  const byKey = new Map<string, Map<number, number>>();

  miners.forEach((miner, index) => {
    const key = seriesKey(miner.name, index);
    keys.push(key);
    config[key] = {
      label: miner.name,
      color: MINER_COLORS[index % MINER_COLORS.length],
    };
    const map = new Map<number, number>();
    for (const point of filterByWindow(miner.chart, window)) {
      const ts = new Date(point.label).getTime();
      if (!Number.isFinite(ts)) continue;
      map.set(ts, Number(point.data) || 0);
    }
    byKey.set(key, map);
  });

  const timestamps = new Set<number>();
  for (const map of byKey.values()) {
    for (const ts of map.keys()) timestamps.add(ts);
  }
  const sorted = Array.from(timestamps).sort((a, b) => a - b);

  const rows: ChartRow[] = sorted.map((ts) => {
    const iso = new Date(ts).toISOString();
    const row: ChartRow = { time: formatTick(iso, spanMs), iso };
    for (const key of keys) {
      row[key] = byKey.get(key)?.get(ts) ?? 0;
    }
    return row;
  });

  return {
    rows,
    keys,
    config,
    flatZero:
      keys.length === 0 ||
      rows.every((row) => keys.every((key) => (Number(row[key]) || 0) === 0)),
  };
}

function TotalHashrateChart({ rows, flatZero }: { rows: ChartRow[]; flatZero: boolean }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Waiting for hashrate — chart starts when miners submit shares.
      </div>
    );
  }

  return (
    <ChartContainer config={totalChartConfig} className="aspect-auto h-64 w-full overflow-visible">
      <AreaChart accessibilityLayer data={rows} margin={{ left: 12, right: 8, top: 20, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          domain={flatZero ? [0, 1] : [0, "auto"]}
          tickMargin={8}
          tickFormatter={(value: number) => hashAxisTick(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, items) => {
                const iso = items?.[0]?.payload?.iso as string | undefined;
                return iso ? formatTooltipLabel(iso) : "";
              }}
              formatter={(value) => hashSuffix(Number(value))}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="hashrate"
          stroke="var(--color-hashrate)"
          fill="var(--color-hashrate)"
          fillOpacity={0.28}
          strokeWidth={2.5}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function MinersHashrateChart({
  rows,
  keys,
  config,
  flatZero,
}: {
  rows: ChartRow[];
  keys: string[];
  config: ChartConfig;
  flatZero: boolean;
}) {
  if (keys.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Connect miners to see per-worker hashrate.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No miner history in this time range yet.
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full overflow-visible">
      <LineChart accessibilityLayer data={rows} margin={{ left: 12, right: 8, top: 20, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
        <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={32} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          domain={flatZero ? [0, 1] : [0, "auto"]}
          tickMargin={8}
          tickFormatter={(value: number) => hashAxisTick(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, items) => {
                const iso = items?.[0]?.payload?.iso as string | undefined;
                return iso ? formatTooltipLabel(iso) : "";
              }}
              formatter={(value) => hashSuffix(Number(value))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

function ChartDateRangePicker({
  chartSince,
  liveMode,
  range,
  onLive,
  onRangeChange,
}: {
  chartSince: string;
  liveMode: boolean;
  range: DateRange | undefined;
  onLive: () => void;
  onRangeChange: (range: DateRange | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const sinceDate = startOfLocalDay(new Date(chartSince));
  const today = endOfLocalDay(new Date());

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        type="button"
        variant={liveMode ? "default" : "outline"}
        size="sm"
        className="h-8 text-xs"
        onClick={onLive}
      >
        Live
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant={liveMode ? "outline" : "secondary"}
              size="sm"
              id="chart-date-range"
              data-empty={liveMode || !range?.from}
              className={cn(
                "h-8 justify-start px-2.5 text-xs font-normal data-[empty=true]:text-muted-foreground",
              )}
            />
          }
        >
          <CalendarIcon data-icon="inline-start" className="size-3.5" />
          {!liveMode && range?.from ? (
            range.to ? (
              <>
                {format(range.from, "LLL dd, y")} – {format(range.to, "LLL dd, y")}
              </>
            ) : (
              format(range.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a range</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={range?.from ?? sinceDate}
            selected={range}
            onSelect={(next) => {
              onRangeChange(next);
              if (next?.from && next?.to) setOpen(false);
            }}
            numberOfMonths={2}
            disabled={{ before: sinceDate, after: today }}
          />
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Only dates since Lido started ({format(sinceDate, "PP")}).
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function HashrateChart({
  data,
  minerCharts = [],
  chartSince,
  liveHashrate = 0,
}: {
  data: ChartPoint[];
  minerCharts?: MinerChartSeries[];
  workers?: Array<{ id: string; name: string; hashrate?: number }>;
  chartSince: string;
  liveHashrate?: number;
}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [liveMode, setLiveMode] = React.useState(true);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => ({
    from: startOfLocalDay(new Date(chartSince)),
    to: endOfLocalDay(new Date()),
  }));

  const liveWindow = React.useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return clampWindow(
      { from: from.toISOString(), to: to.toISOString() },
      chartSince,
    );
  }, [chartSince]);

  const window = React.useMemo(() => {
    if (liveMode) return liveWindow;
    if (!dateRange?.from) return liveWindow;
    const from = startOfLocalDay(dateRange.from).toISOString();
    const to = endOfLocalDay(dateRange.to ?? dateRange.from).toISOString();
    return clampWindow({ from, to }, chartSince);
  }, [liveMode, liveWindow, dateRange, chartSince]);

  const pages = [
    { key: "total", title: "Total hashrate" },
    { key: "miners", title: "Miner hashrate" },
  ] as const;

  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const total = prepareTotalRows(data, window);
  const minerView = prepareMinerRows(minerCharts, window);
  const hasLiveHashrate = liveHashrate > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{page.title}</CardTitle>
        <CardDescription>
          {liveMode ? <LiveIndicator /> : windowLabel(window)}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Previous chart"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex(0)}
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-[5.5rem] text-center text-xs tabular-nums text-muted-foreground">
                {pageIndex + 1} / {pages.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Next chart"
                disabled={pageIndex === pages.length - 1}
                onClick={() => setPageIndex(1)}
              >
                <ChevronRight />
              </Button>
            </div>
            <ChartDateRangePicker
              chartSince={chartSince}
              liveMode={liveMode}
              range={dateRange}
              onLive={() => {
                setLiveMode(true);
                const to = endOfLocalDay(new Date());
                const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
                setDateRange({
                  from: startOfLocalDay(from),
                  to,
                });
              }}
              onRangeChange={(next) => {
                setDateRange(next);
                if (next?.from) setLiveMode(false);
              }}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {page.key === "total" ? (
          <TotalHashrateChart rows={total.rows} flatZero={total.flatZero && !hasLiveHashrate} />
        ) : (
          <MinersHashrateChart
            rows={minerView.rows}
            keys={minerView.keys}
            config={minerView.config}
            flatZero={minerView.flatZero}
          />
        )}
      </CardContent>
    </Card>
  );
}
