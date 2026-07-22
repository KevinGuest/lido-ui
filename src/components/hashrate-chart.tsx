"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
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
import {
  minerColor,
  minerSeriesKey,
  TOTAL_HASHRATE_COLOR,
  WEEK_COMPARE_PRIOR_COLOR,
} from "@/lib/miner-colors";
import type { ChartPoint, MinerChartSeries } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";

const CHART_GRID_STROKE = "var(--chart-grid)";
const CHART_CURSOR_STROKE = "var(--chart-cursor)";

const totalChartConfig = {
  hashrate: {
    label: "Hashrate",
    color: TOTAL_HASHRATE_COLOR,
  },
} satisfies ChartConfig;

type ChartRow = {
  time: string;
  iso: string;
  hashrate?: number;
  [seriesKey: string]: string | number | undefined;
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

function seriesHasActivity(chart: ChartPoint[], window: TimeWindow): boolean {
  return filterByWindow(chart, window).some((point) => (Number(point.data) || 0) > 0);
}

type ChartWorkerRef = {
  id: string;
  name: string;
  hashrate?: number;
  online?: boolean;
};

function isMinerOnline(
  series: MinerChartSeries,
  workers?: ChartWorkerRef[],
): boolean {
  if (!workers?.length) return true;
  const worker = workers.find(
    (entry) => entry.id === series.id || entry.name === series.name,
  );
  if (!worker) return true;
  return worker.online !== false;
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

function LiveIndicator({ label = "Live · 24h" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span>{label}</span>
    </span>
  );
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_BUCKET_MS = 10 * 60 * 1000;

const weekCompareConfig = {
  thisWeek: {
    label: "This week",
    color: TOTAL_HASHRATE_COLOR,
  },
  lastWeek: {
    label: "Last week",
    color: WEEK_COMPARE_PRIOR_COLOR,
  },
} satisfies ChartConfig;

/** Align this week vs prior week on the same x-axis (offset within the week). */
function prepareWeekCompareRows(
  data: ChartPoint[],
  endMs: number,
  chartSince: string,
): { rows: ChartRow[]; flatZero: boolean } {
  const sinceMs = new Date(chartSince).getTime();
  const thisFrom = Math.max(sinceMs, endMs - WEEK_MS);
  const lastFrom = Math.max(sinceMs, endMs - 2 * WEEK_MS);
  const lastTo = endMs - WEEK_MS;

  const thisMap = new Map<number, number>();
  const lastMap = new Map<number, number>();

  for (const point of data) {
    const ts = new Date(point.label).getTime();
    if (!Number.isFinite(ts)) continue;
    const value = Number(point.data) || 0;
    if (ts >= thisFrom && ts <= endMs) {
      const bucket = Math.floor((ts - thisFrom) / WEEK_BUCKET_MS);
      thisMap.set(bucket, value);
    } else if (ts >= lastFrom && ts < lastTo) {
      const bucket = Math.floor((ts - lastFrom) / WEEK_BUCKET_MS);
      lastMap.set(bucket, value);
    }
  }

  const buckets = new Set<number>([...thisMap.keys(), ...lastMap.keys()]);
  const sorted = Array.from(buckets).sort((a, b) => a - b);
  const spanMs = WEEK_MS;

  const rows: ChartRow[] = sorted.map((bucket) => {
    const iso = new Date(thisFrom + bucket * WEEK_BUCKET_MS).toISOString();
    return {
      time: formatTick(iso, spanMs),
      iso,
      thisWeek: thisMap.get(bucket) ?? 0,
      lastWeek: lastMap.get(bucket) ?? 0,
    };
  });

  return {
    rows,
    flatZero:
      rows.length === 0 ||
      rows.every((row) => (Number(row.thisWeek) || 0) === 0 && (Number(row.lastWeek) || 0) === 0),
  };
}

function downsampleRows(rows: ChartRow[], keys: string[], maxPoints = 48): ChartRow[] {
  if (rows.length <= maxPoints) return rows;
  const bucketSize = Math.ceil(rows.length / maxPoints);
  const out: ChartRow[] = [];
  for (let i = 0; i < rows.length; i += bucketSize) {
    const slice = rows.slice(i, i + bucketSize);
    const anchor = slice[slice.length - 1] ?? slice[0];
    const row: ChartRow = { time: anchor.time, iso: anchor.iso };
    for (const key of keys) {
      row[key] =
        slice.reduce((sum, point) => sum + (Number(point[key]) || 0), 0) / slice.length;
    }
    out.push(row);
  }
  return out;
}

function prepareMinerRows(
  miners: MinerChartSeries[],
  window: TimeWindow,
): { rows: ChartRow[]; keys: string[]; config: ChartConfig; flatZero: boolean } {
  const spanMs = new Date(window.to).getTime() - new Date(window.from).getTime();
  const keys: string[] = [];
  const config: ChartConfig = {};
  const byKey = new Map<string, Map<number, number>>();

  const usedKeys = new Set<string>();
  miners.forEach((miner) => {
    let key = minerSeriesKey(miner.name);
    if (usedKeys.has(key)) key = `${key}_${usedKeys.size}`;
    usedKeys.add(key);
    keys.push(key);
    config[key] = {
      label: miner.name,
      color: minerColor(miner.name),
    };
    const map = new Map<number, number>();
    for (const point of filterByWindow(miner.chart, window)) {
      const ts = new Date(point.label).getTime();
      if (!Number.isFinite(ts)) continue;
      map.set(ts, Number(point.data) || 0);
    }
    byKey.set(key, map);
  });

  // Prefer timestamps from the first series (shared buckets); union as fallback for live data.
  const primary = byKey.get(keys[0] ?? "");
  const timestamps =
    primary && primary.size > 0
      ? Array.from(primary.keys()).sort((a, b) => a - b)
      : Array.from(
          new Set(
            Array.from(byKey.values()).flatMap((map) => Array.from(map.keys())),
          ),
        ).sort((a, b) => a - b);

  const lastByKey = new Map<string, number>();
  const rawRows: ChartRow[] = timestamps.map((ts) => {
    const iso = new Date(ts).toISOString();
    const row: ChartRow = { time: formatTick(iso, spanMs), iso };
    for (const key of keys) {
      const exact = byKey.get(key)?.get(ts);
      if (exact != null) {
        lastByKey.set(key, exact);
        row[key] = exact;
      } else {
        row[key] = lastByKey.get(key) ?? 0;
      }
    }
    return row;
  });

  // Largest series first → bottom of stack (easier to read big vs small miners).
  keys.sort((a, b) => {
    const avgA =
      rawRows.reduce((sum, row) => sum + (Number(row[a]) || 0), 0) / Math.max(1, rawRows.length);
    const avgB =
      rawRows.reduce((sum, row) => sum + (Number(row[b]) || 0), 0) / Math.max(1, rawRows.length);
    return avgB - avgA;
  });

  const rows = downsampleRows(rawRows, keys, 48);

  return {
    rows,
    keys,
    config,
    flatZero:
      rows.length === 0 ||
      rows.every((row) => keys.every((key) => (Number(row[key]) || 0) === 0)),
  };
}

function useChartLayout() {
  const isMobile = useIsMobile();
  return {
    isMobile,
    heightClass: isMobile
      ? "aspect-auto h-80 w-full overflow-visible"
      : "aspect-auto h-64 w-full overflow-visible",
    minersHeightClass: isMobile
      ? "aspect-auto h-80 w-full overflow-visible"
      : "aspect-auto h-72 w-full overflow-visible",
    emptyHeightClass: isMobile ? "flex h-80 items-center justify-center" : "flex h-64 items-center justify-center",
    minersEmptyHeightClass: isMobile
      ? "flex h-80 items-center justify-center"
      : "flex h-72 items-center justify-center",
    margin: isMobile
      ? { left: 0, right: 4, top: 12, bottom: 0 }
      : { left: 12, right: 8, top: 20, bottom: 4 },
            yAxisWidth: isMobile ? 48 : 72,
    minTickGap: isMobile ? 48 : 32,
  };
}

function TotalHashrateChart({
  rows,
  flatZero,
}: {
  rows: ChartRow[];
  flatZero: boolean;
}) {
  const layout = useChartLayout();

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          layout.emptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        Waiting for hashrate — chart starts when miners submit shares.
      </div>
    );
  }

  return (
    <ChartContainer config={totalChartConfig} className={layout.heightClass}>
      <AreaChart accessibilityLayer data={rows} margin={layout.margin}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          minTickGap={layout.minTickGap}
          tickMargin={layout.isMobile ? 4 : 0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={layout.yAxisWidth}
          domain={flatZero ? [0, 1] : [0, "auto"]}
          tickMargin={layout.isMobile ? 4 : 8}
          tickFormatter={(value: number) => hashAxisTick(value)}
        />
        <ChartTooltip
          cursor={false}
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

function WeekCompareChart({ rows, flatZero }: { rows: ChartRow[]; flatZero: boolean }) {
  const layout = useChartLayout();

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          layout.emptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        Need about two weeks of share history to compare weeks.
      </div>
    );
  }

  return (
    <ChartContainer config={weekCompareConfig} className={layout.heightClass}>
      <AreaChart accessibilityLayer data={rows} margin={layout.margin}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          minTickGap={layout.minTickGap}
          tickMargin={layout.isMobile ? 4 : 0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={layout.yAxisWidth}
          domain={flatZero ? [0, 1] : [0, "auto"]}
          tickMargin={layout.isMobile ? 4 : 8}
          tickFormatter={(value: number) => hashAxisTick(value)}
        />
        <ChartTooltip
          cursor={false}
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
        <ChartLegend
          content={() => (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {(["thisWeek", "lastWeek"] as const).map((key) => (
                <span key={key} className="inline-flex items-center gap-1.5 text-xs">
                  <span
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: weekCompareConfig[key].color }}
                  />
                  {weekCompareConfig[key].label}
                </span>
              ))}
            </div>
          )}
        />
        <defs>
          <linearGradient id="fillThisWeek" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-thisWeek)" stopOpacity={0.85} />
            <stop offset="95%" stopColor="var(--color-thisWeek)" stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id="fillLastWeek" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-lastWeek)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-lastWeek)" stopOpacity={0.06} />
          </linearGradient>
        </defs>
        <Area
          type="natural"
          dataKey="lastWeek"
          stroke="var(--color-lastWeek)"
          fill="url(#fillLastWeek)"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Area
          type="natural"
          dataKey="thisWeek"
          stroke="var(--color-thisWeek)"
          fill="url(#fillThisWeek)"
          fillOpacity={0.45}
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
  emptySelection,
}: {
  rows: ChartRow[];
  keys: string[];
  config: ChartConfig;
  flatZero: boolean;
  emptySelection?: boolean;
}) {
  const layout = useChartLayout();
  const [pinnedKey, setPinnedKey] = React.useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);
  const ignoreChartClickRef = React.useRef(false);
  // Pinned click focus wins over hover so empty-space still shows that miner.
  const focusedKey = pinnedKey ?? hoveredKey;

  React.useEffect(() => {
    setPinnedKey((current) => (current && keys.includes(current) ? current : null));
  }, [keys]);

  function togglePin(key: string) {
    ignoreChartClickRef.current = true;
    setPinnedKey((current) => (current === key ? null : key));
    window.setTimeout(() => {
      ignoreChartClickRef.current = false;
    }, 0);
  }

  if (emptySelection) {
    return (
      <div
        className={cn(
          layout.minersEmptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        Select miners below to plot their hashrate over time.
      </div>
    );
  }

  if (keys.length === 0) {
    return (
      <div
        className={cn(
          layout.minersEmptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        Connect miners to see per-worker hashrate.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          layout.minersEmptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        No miner history in this time range yet.
      </div>
    );
  }

  return (
    <ChartContainer config={config} className={layout.minersHeightClass}>
      <LineChart
        accessibilityLayer
        data={rows}
        margin={layout.margin}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => {
          if (ignoreChartClickRef.current) return;
          setPinnedKey(null);
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          minTickGap={layout.minTickGap}
          tickMargin={layout.isMobile ? 4 : 0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={layout.yAxisWidth}
          domain={flatZero ? [0, 1] : [0, "auto"]}
          tickMargin={layout.isMobile ? 4 : 8}
          tickFormatter={(value: number) => hashAxisTick(value)}
        />
        <ChartTooltip
          shared
          cursor={{ stroke: CHART_CURSOR_STROKE, strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            const items = focusedKey
              ? payload?.filter((item) => item.dataKey === focusedKey)
              : payload;
            if (!active || !items?.length) return null;
            return (
              <ChartTooltipContent
                active={active}
                payload={items}
                label={label}
                indicator="dot"
                labelFormatter={(_, tooltipItems) => {
                  const iso = tooltipItems?.[0]?.payload?.iso as string | undefined;
                  return iso ? formatTooltipLabel(iso) : "";
                }}
                formatter={(value) => hashSuffix(Number(value))}
              />
            );
          }}
        />
        {keys.map((key) => {
          const isFocused = focusedKey === key;
          const isDimmed = Boolean(focusedKey && !isFocused);
          return (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              strokeWidth={isFocused ? 2.75 : 2}
              strokeOpacity={isDimmed ? 0.28 : 0.95}
              dot={false}
              style={{
                cursor: isDimmed ? "default" : "pointer",
                pointerEvents: isDimmed ? "none" : "auto",
              }}
              activeDot={
                isDimmed
                  ? false
                  : {
                      r: 5,
                      strokeWidth: 0,
                      stroke: "transparent",
                      cursor: "pointer",
                      onMouseEnter: () => setHoveredKey(key),
                      onMouseLeave: () => setHoveredKey(null),
                      onClick: () => togglePin(key),
                    }
              }
              onMouseEnter={() => {
                if (!isDimmed) setHoveredKey(key);
              }}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => {
                if (!isDimmed) togglePin(key);
              }}
              isAnimationActive={false}
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );
}

function MinerSelectionBar({
  miners,
  selectedIds,
  onToggle,
  onClear,
}: {
  miners: MinerChartSeries[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {selectedIds.size === 0
            ? "Tap miners to plot their lines."
            : `${selectedIds.size} miner${selectedIds.size === 1 ? "" : "s"} selected`}
        </p>
        {selectedIds.size > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onClear}>
            Clear all
          </Button>
        ) : null}
      </div>
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border bg-transparent p-2">
        {miners.map((miner) => {
          const selected = selectedIds.has(miner.id);
          const color = minerColor(miner.name);
          return (
            <button
              key={miner.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(miner.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                selected
                  ? "border-border bg-transparent text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
              style={selected ? { outline: `1.5px solid ${color}`, outlineOffset: 0 } : undefined}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color, opacity: selected ? 1 : 0.45 }}
              />
              <span className="max-w-[10rem] truncate">{miner.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseDateInputValue(value: string, end: boolean) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return end ? endOfLocalDay(date) : startOfLocalDay(date);
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
  const [mobileRangeOpen, setMobileRangeOpen] = React.useState(false);
  const sinceDate = startOfLocalDay(new Date(chartSince));
  const today = endOfLocalDay(new Date());
  const minInput = toDateInputValue(sinceDate);
  const maxInput = toDateInputValue(today);
  const fromInput = range?.from ? toDateInputValue(range.from) : "";
  const toInput = range?.to
    ? toDateInputValue(range.to)
    : range?.from
      ? toDateInputValue(range.from)
      : "";

  function applyNativeRange(nextFrom: string, nextTo: string) {
    const from = parseDateInputValue(nextFrom, false);
    const to = parseDateInputValue(nextTo, true);
    if (!from || !to) return;
    const clampedFrom = from < sinceDate ? sinceDate : from > today ? today : from;
    let clampedTo = to < sinceDate ? sinceDate : to > today ? today : to;
    if (clampedTo < clampedFrom) clampedTo = endOfLocalDay(clampedFrom);
    onRangeChange({ from: clampedFrom, to: clampedTo });
  }

  const rangeLabel =
    !liveMode && range?.from
      ? range.to
        ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d")}`
        : format(range.from, "MMM d")
      : "Range";

  return (
    <>
      {/* Desktop: Live + calendar popover (unchanged) */}
      <div className="hidden items-center justify-end gap-1.5 md:flex">
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

      {/* Mobile: compact Live + Range (native dates inside popover) */}
      <div className="flex w-full items-center gap-2 md:hidden">
        <Button
          type="button"
          variant={liveMode ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0 px-3 text-xs"
          onClick={onLive}
        >
          Live
        </Button>
        <Popover open={mobileRangeOpen} onOpenChange={setMobileRangeOpen}>
          <PopoverTrigger
            render={
              <Button
                variant={liveMode ? "outline" : "secondary"}
                size="sm"
                aria-label="Pick date range"
                className={cn(
                  "h-9 min-w-0 flex-1 justify-start px-2.5 text-xs font-normal",
                  liveMode && "text-muted-foreground",
                )}
              />
            }
          >
            <CalendarIcon className="size-3.5 shrink-0" />
            <span className="truncate">{rangeLabel}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(18rem,calc(100vw-2rem))] p-3">
            <div className="flex flex-col gap-2.5">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">From</span>
                <input
                  type="date"
                  aria-label="Range start"
                  min={minInput}
                  max={maxInput}
                  value={fromInput || minInput}
                  className={cn(
                    "h-10 w-full rounded-md border border-border bg-background px-2.5",
                    "text-sm text-foreground outline-none",
                    "[color-scheme:light] dark:[color-scheme:dark]",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  onChange={(event) => {
                    const nextFrom = event.target.value;
                    if (!nextFrom) return;
                    applyNativeRange(nextFrom, toInput || nextFrom);
                  }}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">To</span>
                <input
                  type="date"
                  aria-label="Range end"
                  min={minInput}
                  max={maxInput}
                  value={toInput || maxInput}
                  className={cn(
                    "h-10 w-full rounded-md border border-border bg-background px-2.5",
                    "text-sm text-foreground outline-none",
                    "[color-scheme:light] dark:[color-scheme:dark]",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  onChange={(event) => {
                    const nextTo = event.target.value;
                    if (!nextTo) return;
                    applyNativeRange(fromInput || nextTo, nextTo);
                  }}
                />
              </label>
              <Button
                type="button"
                size="sm"
                className="mt-1 w-full"
                onClick={() => setMobileRangeOpen(false)}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

export function HashrateChart({
  data,
  minerCharts = [],
  workers,
  chartSince,
  liveHashrate = 0,
  mode = "full",
  autoSelectMinerIds,
  initialPage,
}: {
  data: ChartPoint[];
  minerCharts?: MinerChartSeries[];
  workers?: ChartWorkerRef[];
  chartSince: string;
  liveHashrate?: number;
  /** Public pool: total + weekly only (no per-miner page). */
  mode?: "full" | "public";
  /** When set (e.g. Find your miners), pre-select these series on the miner chart. */
  autoSelectMinerIds?: string[];
  /** Jump to a chart page when the view mode changes (e.g. address find). */
  initialPage?: "total" | "week" | "miners";
}) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [liveMode, setLiveMode] = React.useState(true);
  const [selectedMinerIds, setSelectedMinerIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => ({
    from: startOfLocalDay(new Date(chartSince)),
    to: endOfLocalDay(new Date()),
  }));

  const pages =
    mode === "public"
      ? ([
          { key: "total", title: "Total hashrate" },
          { key: "week", title: "Weekly compare" },
        ] as const)
      : ([
          { key: "total", title: "Total hashrate" },
          { key: "week", title: "Weekly compare" },
          { key: "miners", title: "Miner hashrate" },
        ] as const);

  const autoSelectKey = autoSelectMinerIds?.join("\0") ?? "";

  React.useEffect(() => {
    if (!autoSelectMinerIds?.length) return;
    setSelectedMinerIds(new Set(autoSelectMinerIds));
  }, [autoSelectKey, autoSelectMinerIds]);

  React.useEffect(() => {
    if (!initialPage) return;
    const index = pages.findIndex((page) => page.key === initialPage);
    if (index >= 0) setPageIndex(index);
  }, [initialPage, mode]);

  const liveDayWindow = React.useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return clampWindow(
      { from: from.toISOString(), to: to.toISOString() },
      chartSince,
    );
  }, [chartSince]);

  const customWindow = React.useMemo(() => {
    if (!dateRange?.from) return liveDayWindow;
    const from = startOfLocalDay(dateRange.from).toISOString();
    const to = endOfLocalDay(dateRange.to ?? dateRange.from).toISOString();
    return clampWindow({ from, to }, chartSince);
  }, [dateRange, chartSince, liveDayWindow]);

  const page = pages[Math.min(pageIndex, pages.length - 1)];

  const window = React.useMemo(() => {
    if (!liveMode) return customWindow;
    return liveDayWindow;
  }, [liveMode, customWindow, liveDayWindow]);

  const weekEndMs = liveMode
    ? Date.now()
    : new Date(customWindow.to).getTime();

  const visibleMinerCharts = React.useMemo(() => {
    return minerCharts.filter((series) => {
      if (liveMode) return isMinerOnline(series, workers);
      return seriesHasActivity(series.chart, window);
    });
  }, [minerCharts, workers, liveMode, window]);

  React.useEffect(() => {
    const visibleIds = new Set(visibleMinerCharts.map((series) => series.id));
    setSelectedMinerIds((current) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (visibleIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : current;
    });
  }, [visibleMinerCharts]);

  const total = prepareTotalRows(data, window);
  const weekCompare = prepareWeekCompareRows(data, weekEndMs, chartSince);
  const selectedMinerCharts = React.useMemo(
    () => visibleMinerCharts.filter((miner) => selectedMinerIds.has(miner.id)),
    [visibleMinerCharts, selectedMinerIds],
  );
  const minerView = prepareMinerRows(selectedMinerCharts, window);
  const hasLiveHashrate = liveHashrate > 0;

  const toggleMiner = React.useCallback((id: string) => {
    setSelectedMinerIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearMiners = React.useCallback(() => {
    setSelectedMinerIds(new Set());
  }, []);

  return (
    <Card>
      {/* Desktop header — unchanged */}
      <CardHeader className="max-md:hidden">
        <CardTitle>{page.title}</CardTitle>
        <CardDescription>
          {page.key === "week" ? (
            liveMode ? (
              <LiveIndicator label="This week vs last week" />
            ) : (
              "Selected end · prior 7 days vs 7 days before"
            )
          ) : liveMode ? (
            <LiveIndicator label="Live · 24h" />
          ) : (
            windowLabel(window)
          )}
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
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
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
                onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
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

      {/* Mobile header — compact controls, more room for chart */}
      <div className="flex flex-col gap-3 px-(--card-spacing) md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{page.title}</CardTitle>
            {!liveMode ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {windowLabel(window)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Previous chart"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-[3.25rem] text-center text-xs tabular-nums text-muted-foreground">
              {pageIndex + 1}/{pages.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Next chart"
              disabled={pageIndex === pages.length - 1}
              onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
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

      <CardContent>
        {page.key === "total" ? (
          <TotalHashrateChart rows={total.rows} flatZero={total.flatZero && !hasLiveHashrate} />
        ) : page.key === "week" ? (
          <WeekCompareChart rows={weekCompare.rows} flatZero={weekCompare.flatZero} />
        ) : (
          <>
            <MinersHashrateChart
              rows={minerView.rows}
              keys={minerView.keys}
              config={minerView.config}
              flatZero={minerView.flatZero}
              emptySelection={selectedMinerIds.size === 0}
            />
            <MinerSelectionBar
              miners={visibleMinerCharts}
              selectedIds={selectedMinerIds}
              onToggle={toggleMiner}
              onClear={clearMiners}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
