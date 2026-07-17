/** Shared palette so chart series and miner table stay in sync. */
export const MINER_COLORS = [
  "oklch(0.82 0.16 145)",
  "oklch(0.78 0.14 220)",
  "oklch(0.84 0.14 85)",
  "oklch(0.78 0.16 25)",
  "oklch(0.78 0.14 300)",
  "oklch(0.82 0.12 180)",
  "oklch(0.8 0.16 350)",
  "oklch(0.86 0.08 95)",
  "oklch(0.76 0.15 55)",
  "oklch(0.74 0.12 260)",
  "oklch(0.83 0.13 130)",
  "oklch(0.79 0.11 15)",
  "oklch(0.77 0.14 200)",
  "oklch(0.81 0.12 40)",
  "oklch(0.75 0.13 285)",
  "oklch(0.84 0.1 110)",
] as const;

export const TOTAL_HASHRATE_COLOR = "oklch(0.95 0 0)";

function hashName(name: string): number {
  let hash = 0;
  const key = name.trim().toLowerCase();
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable color for a miner name (order-independent). */
export function minerColor(name: string): string {
  if (!name.trim()) return MINER_COLORS[0];
  return MINER_COLORS[hashName(name) % MINER_COLORS.length];
}

export function minerSeriesKey(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `m_${slug || "miner"}`;
}
