/** Official product / project pages for known miner brands. */
const BRAND_URLS: { match: RegExp; url: string }[] = [
  { match: /bitaxe|esp-miner/i, url: "https://bitaxe.org" },
  { match: /nerd(qaxe|octaxe|axe|miner)/i, url: "https://www.nerdminers.org" },
  { match: /antminer|bitmain/i, url: "https://www.bitmain.com" },
  { match: /braiins/i, url: "https://braiins.com" },
  { match: /auradine/i, url: "https://www.auradine.com" },
  { match: /avalon|canaan/i, url: "https://www.canaan.io" },
  { match: /whatsminer|microbt/i, url: "https://www.microbt.com" },
  { match: /red\s*rock|rrm/i, url: "https://github.com/bitaxeorg" },
];

/**
 * Prefer an explicit info URL, then brand match on user-agent / name,
 * then a local device dashboard if present.
 */
export function minerInfoUrl(worker: {
  name: string;
  userAgent?: string;
  infoUrl?: string | null;
  dashboardUrl?: string | null;
}): string | null {
  const explicit = worker.infoUrl?.trim();
  if (explicit) return explicit;

  const haystack = `${worker.userAgent ?? ""} ${worker.name}`;
  for (const entry of BRAND_URLS) {
    if (entry.match.test(haystack)) return entry.url;
  }

  const dash = worker.dashboardUrl?.trim();
  return dash || null;
}
