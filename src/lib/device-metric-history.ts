"use client";

import type { ChartPoint, MinerChartSeries, Worker } from "@/lib/mock-data";

const STORAGE_KEY = "lido-device-metric-history";
const CHANGE_EVENT = "lido-device-metric-history-change";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 20_000;
const MAX_SAMPLES = 400;
const MOCK_INTERVAL_MS = 10 * 60 * 1000;
const MOCK_HOURS = 24;

export type DeviceMetricSample = {
  t: number;
  miners: Record<
    string,
    { name: string; tempC: number | null; powerW: number | null }
  >;
};

export function deviceMetricKey(worker: Pick<Worker, "name" | "address">): string {
  return `${worker.address || "_"}::${worker.name}`.toLowerCase();
}

function prune(samples: DeviceMetricSample[], now = Date.now()): DeviceMetricSample[] {
  const cutoff = now - MAX_AGE_MS;
  const fresh = samples.filter((sample) => sample.t >= cutoff);
  if (fresh.length <= MAX_SAMPLES) return fresh;
  return fresh.slice(fresh.length - MAX_SAMPLES);
}

function readSamples(): DeviceMetricSample[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeviceMetricSample[];
    if (!Array.isArray(parsed)) return [];
    return prune(
      parsed.filter(
        (sample) =>
          sample &&
          typeof sample.t === "number" &&
          Number.isFinite(sample.t) &&
          sample.miners &&
          typeof sample.miners === "object",
      ),
    );
  } catch {
    return [];
  }
}

function writeSamples(samples: DeviceMetricSample[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  } catch {
    // Ignore quota / private mode.
  }
}

export function subscribeDeviceMetricSamples(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getDeviceMetricSnapshot() {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function getDeviceMetricServerSnapshot() {
  return "[]";
}

export function parseDeviceMetricSnapshot(raw: string): DeviceMetricSample[] {
  try {
    const parsed = JSON.parse(raw) as DeviceMetricSample[];
    if (!Array.isArray(parsed)) return [];
    return prune(
      parsed.filter(
        (sample) =>
          sample &&
          typeof sample.t === "number" &&
          Number.isFinite(sample.t) &&
          sample.miners &&
          typeof sample.miners === "object",
      ),
    );
  } catch {
    return [];
  }
}

function snapshotMiners(workers: Worker[]): DeviceMetricSample["miners"] {
  const miners: DeviceMetricSample["miners"] = {};
  for (const worker of workers) {
    if (worker.online === false) continue;
    const tempC =
      worker.tempC != null && Number.isFinite(worker.tempC) && worker.tempC > 0
        ? worker.tempC
        : null;
    const powerW =
      worker.powerW != null && Number.isFinite(worker.powerW) && worker.powerW > 0
        ? worker.powerW
        : null;
    if (tempC == null && powerW == null) continue;
    miners[deviceMetricKey(worker)] = { name: worker.name, tempC, powerW };
  }
  return miners;
}

/** Append one dashboard snapshot. No-ops if nothing reports or last sample is too fresh. */
export function appendDeviceMetricSample(
  workers: Worker[],
  now = Date.now(),
): DeviceMetricSample[] {
  const current = readSamples();
  const miners = snapshotMiners(workers);
  if (Object.keys(miners).length === 0) return current;

  const last = current[current.length - 1];
  if (last && now - last.t < MIN_INTERVAL_MS) {
    const next = [...current.slice(0, -1), { t: now, miners }];
    writeSamples(next);
    return next;
  }

  const next = prune([...current, { t: now, miners }], now);
  writeSamples(next);
  return next;
}

export function loadDeviceMetricSamples(): DeviceMetricSample[] {
  return readSamples();
}

export function samplesToSeries(
  samples: DeviceMetricSample[],
  metric: "tempC" | "powerW",
): MinerChartSeries[] {
  const names = new Map<string, string>();
  const ids: string[] = [];
  for (const sample of samples) {
    for (const [id, row] of Object.entries(sample.miners)) {
      if (row[metric] == null) continue;
      if (!names.has(id)) {
        names.set(id, row.name);
        ids.push(id);
      } else {
        names.set(id, row.name);
      }
    }
  }

  return ids
    .map((id) => {
      const chart: ChartPoint[] = [];
      for (const sample of samples) {
        const value = sample.miners[id]?.[metric];
        if (value == null) continue;
        chart.push({
          label: new Date(sample.t).toISOString(),
          data: value,
        });
      }
      return {
        id,
        name: names.get(id) ?? id,
        chart,
      };
    })
    .filter((series) => series.chart.length > 0);
}

/** Deterministic 24h series so demo charts look populated without a history DB. */
export function buildMockMetricSeries(
  workers: Worker[],
  metric: "tempC" | "powerW",
  now = Date.now(),
): MinerChartSeries[] {
  const steps = Math.round((MOCK_HOURS * 60 * 60 * 1000) / MOCK_INTERVAL_MS);
  return workers
    .filter((worker) => {
      if (worker.online === false) return false;
      const value = worker[metric];
      return value != null && Number.isFinite(value) && value > 0;
    })
    .slice(0, 40)
    .map((worker, index) => {
      const base = worker[metric] as number;
      const phase = index * 0.73 + worker.name.length * 0.11;
      const chart: ChartPoint[] = [];
      for (let i = steps; i >= 0; i -= 1) {
        const t = now - i * MOCK_INTERVAL_MS;
        const data =
          metric === "tempC"
            ? Math.max(
                1,
                base +
                  1.8 * Math.sin(t / 120_000 + phase) +
                  0.6 * Math.cos(t / 210_000 + phase * 1.3),
              )
            : Math.max(
                0.1,
                base *
                  (1 +
                    0.035 * Math.sin(t / 150_000 + phase) +
                    0.02 * Math.cos(t / 260_000 + phase)),
              );
        chart.push({ label: new Date(t).toISOString(), data });
      }
      return {
        id: deviceMetricKey(worker),
        name: worker.name,
        chart,
      };
    });
}
