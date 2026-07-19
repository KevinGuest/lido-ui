/** Shared palette so chart series and miner table stay in sync.
 * Values resolve via CSS vars in globals.css (light + dark).
 */
export const MINER_COLORS = [
  "var(--miner-0)",
  "var(--miner-1)",
  "var(--miner-2)",
  "var(--miner-3)",
  "var(--miner-4)",
  "var(--miner-5)",
  "var(--miner-6)",
  "var(--miner-7)",
  "var(--miner-8)",
  "var(--miner-9)",
  "var(--miner-10)",
  "var(--miner-11)",
  "var(--miner-12)",
  "var(--miner-13)",
  "var(--miner-14)",
  "var(--miner-15)",
] as const;

export const TOTAL_HASHRATE_COLOR = "var(--chart-total)";
export const WEEK_COMPARE_PRIOR_COLOR = "var(--chart-week-prior)";

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
