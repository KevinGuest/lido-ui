"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  appendDeviceMetricSample,
  buildMockMetricSeries,
  getDeviceMetricServerSnapshot,
  getDeviceMetricSnapshot,
  parseDeviceMetricSnapshot,
  samplesToSeries,
  subscribeDeviceMetricSamples,
} from "@/lib/device-metric-history";
import { formatTempC, formatWatts } from "@/lib/format";
import { minerColor, minerSeriesKey } from "@/lib/miner-colors";
import type { MinerChartSeries, Worker } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";

const CHART_GRID_STROKE = "var(--chart-grid)";
const CHART_CURSOR_STROKE = "var(--chart-cursor)";

type ChartRow = {
  time: string;
  iso: string;
  [seriesKey: string]: string | number | undefined;
};

function formatTick(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function downsampleRows(rows: ChartRow[], keys: string[], maxPoints = 48): ChartRow[] {
  if (rows.length <= maxPoints) return rows;
  const bucketSize = Math.ceil(rows.length / maxPoints);
  const out: ChartRow[] = [];
  for (let i = 0; i < rows.length; i += bucketSize) {
    const slice = rows.slice(i, i + bucketSize);
    const anchor = slice[slice.length - 1] ?? slice[0];
    const row: ChartRow = { time: anchor.time, iso: anchor.iso };
    for (const key of keys) {
      const nums = slice
        .map((point) => point[key])
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      if (nums.length > 0) {
        row[key] = nums.reduce((sum, value) => sum + value, 0) / nums.length;
      }
    }
    out.push(row);
  }
  return out;
}

function prepareDeviceRows(
  miners: MinerChartSeries[],
): { rows: ChartRow[]; keys: string[]; config: ChartConfig } {
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
    for (const point of miner.chart) {
      const ts = new Date(point.label).getTime();
      if (!Number.isFinite(ts)) continue;
      if (!Number.isFinite(point.data) || point.data <= 0) continue;
      map.set(ts, point.data);
    }
    byKey.set(key, map);
  });

  const timestamps = Array.from(
    new Set(Array.from(byKey.values()).flatMap((map) => Array.from(map.keys()))),
  ).sort((a, b) => a - b);

  const rawRows: ChartRow[] = timestamps.map((ts) => {
    const iso = new Date(ts).toISOString();
    const row: ChartRow = { time: formatTick(iso), iso };
    for (const key of keys) {
      const exact = byKey.get(key)?.get(ts);
      if (exact != null) row[key] = exact;
    }
    return row;
  });

  return {
    rows: downsampleRows(rawRows, keys, 48),
    keys,
    config,
  };
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

function DeviceMetricChart({
  rows,
  keys,
  config,
  emptySelection,
  emptyLabel,
  formatTickValue,
  formatTooltipValue,
}: {
  rows: ChartRow[];
  keys: string[];
  config: ChartConfig;
  emptySelection?: boolean;
  emptyLabel: string;
  formatTickValue: (value: number) => string;
  formatTooltipValue: (value: number) => string;
}) {
  const isMobile = useIsMobile();
  const [pinnedKey, setPinnedKey] = React.useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);
  const ignoreChartClickRef = React.useRef(false);
  const activePin = pinnedKey && keys.includes(pinnedKey) ? pinnedKey : null;
  const focusedKey = activePin ?? hoveredKey;
  const heightClass = isMobile
    ? "aspect-auto h-80 w-full overflow-visible"
    : "aspect-auto h-72 w-full overflow-visible";
  const emptyHeightClass = isMobile
    ? "flex h-80 items-center justify-center"
    : "flex h-72 items-center justify-center";
  const margin = isMobile
    ? { left: 0, right: 4, top: 12, bottom: 0 }
    : { left: 12, right: 8, top: 20, bottom: 4 };

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
          emptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        Select miners below to plot this metric.
      </div>
    );
  }

  if (keys.length === 0 || rows.length === 0) {
    return (
      <div
        className={cn(
          emptyHeightClass,
          "rounded-lg border border-dashed border-border text-sm text-muted-foreground",
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <ChartContainer config={config} className={heightClass}>
      <LineChart
        accessibilityLayer
        data={rows}
        margin={margin}
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
          minTickGap={isMobile ? 48 : 32}
          tickMargin={isMobile ? 4 : 0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={isMobile ? 48 : 72}
          domain={["auto", "auto"]}
          tickMargin={isMobile ? 4 : 8}
          tickFormatter={(value: number) => formatTickValue(value)}
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
                formatter={(value) => formatTooltipValue(Number(value))}
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
              connectNulls={false}
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

function useDeviceMetricSeries(workers: Worker[], mock: boolean) {
  const raw = React.useSyncExternalStore(
    subscribeDeviceMetricSamples,
    getDeviceMetricSnapshot,
    getDeviceMetricServerSnapshot,
  );
  const workerKey = workers
    .map(
      (worker) =>
        `${worker.address || "_"}::${worker.name}:${worker.tempC ?? ""}:${worker.powerW ?? ""}`,
    )
    .join("|");

  React.useEffect(() => {
    if (mock) return;
    appendDeviceMetricSample(workers);
  }, [mock, workerKey, workers]);

  const mockTemp = React.useMemo(
    () => (mock ? buildMockMetricSeries(workers, "tempC") : null),
    [mock, workers],
  );
  const mockPower = React.useMemo(
    () => (mock ? buildMockMetricSeries(workers, "powerW") : null),
    [mock, workers],
  );

  if (mock) {
    return { tempSeries: mockTemp ?? [], powerSeries: mockPower ?? [] };
  }

  const samples = parseDeviceMetricSnapshot(raw);
  return {
    tempSeries: samplesToSeries(samples, "tempC"),
    powerSeries: samplesToSeries(samples, "powerW"),
  };
}

export function DeviceTelemetryCharts({
  workers,
  mock = false,
}: {
  workers: Worker[];
  mock?: boolean;
}) {
  const { tempSeries, powerSeries } = useDeviceMetricSeries(workers, mock);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [tempOverride, setTempOverride] = React.useState<Set<string> | null>(null);
  const [powerOverride, setPowerOverride] = React.useState<Set<string> | null>(null);

  const selectedTempIds = React.useMemo(() => {
    const ids = new Set(tempSeries.map((series) => series.id));
    if (tempOverride == null) return ids;
    const next = new Set<string>();
    for (const id of tempOverride) {
      if (ids.has(id)) next.add(id);
    }
    return next;
  }, [tempSeries, tempOverride]);

  const selectedPowerIds = React.useMemo(() => {
    const ids = new Set(powerSeries.map((series) => series.id));
    if (powerOverride == null) return ids;
    const next = new Set<string>();
    for (const id of powerOverride) {
      if (ids.has(id)) next.add(id);
    }
    return next;
  }, [powerSeries, powerOverride]);

  const pages = [
    {
      key: "temp" as const,
      title: "Miner temperature",
      series: tempSeries,
      selected: selectedTempIds,
      empty: "Waiting for device temperatures — samples collect while miners report.",
      formatTick: (value: number) => formatTempC(value) ?? "—",
      formatTooltip: (value: number) => formatTempC(value) ?? "—",
    },
    {
      key: "power" as const,
      title: "Miner wattage",
      series: powerSeries,
      selected: selectedPowerIds,
      empty: "Waiting for device wattage — samples collect while miners report.",
      formatTick: (value: number) => formatWatts(value) ?? "—",
      formatTooltip: (value: number) => formatWatts(value) ?? "—",
    },
  ];

  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const selectedSeries = page.series.filter((series) => page.selected.has(series.id));
  const view = prepareDeviceRows(selectedSeries);

  const toggleMiner = React.useCallback(
    (id: string) => {
      const setter = pageIndex === 0 ? setTempOverride : setPowerOverride;
      const selected = pageIndex === 0 ? selectedTempIds : selectedPowerIds;
      setter(() => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [pageIndex, selectedTempIds, selectedPowerIds],
  );

  const clearMiners = React.useCallback(() => {
    if (pageIndex === 0) setTempOverride(new Set());
    else setPowerOverride(new Set());
  }, [pageIndex]);

  return (
    <Card>
      <CardHeader className="max-md:hidden">
        <CardTitle>{page.title}</CardTitle>
        <CardDescription>
          <LiveIndicator />
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Previous chart"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
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
              onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </CardAction>
      </CardHeader>

      <div className="flex flex-col gap-3 px-(--card-spacing) md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{page.title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              <LiveIndicator />
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Previous chart"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
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
              onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <CardContent>
        <DeviceMetricChart
          rows={view.rows}
          keys={view.keys}
          config={view.config}
          emptySelection={page.selected.size === 0 && page.series.length > 0}
          emptyLabel={page.empty}
          formatTickValue={page.formatTick}
          formatTooltipValue={page.formatTooltip}
        />
        {page.series.length > 0 ? (
          <MinerSelectionBar
            miners={page.series}
            selectedIds={page.selected}
            onToggle={toggleMiner}
            onClear={clearMiners}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
