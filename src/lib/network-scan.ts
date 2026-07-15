import dns from "node:dns/promises";
import os from "node:os";

type ScanCache = {
  at: number;
  hosts: string[];
};

const SCAN_TTL_MS = 2 * 60 * 1000;
let cache: ScanCache | null = null;
let inflight: Promise<string[]> | null = null;

function subnetFromIp(ip: string): string | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  if (parts.some((part) => Number.isNaN(Number(part)))) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

function isPrivateSubnet(subnet: string): boolean {
  const [a, b] = subnet.split(".").map(Number);
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

async function candidateSubnets(poolApiUrl: string): Promise<string[]> {
  const subnets = new Set<string>();
  const configured = (process.env.SCAN_SUBNETS ?? "")
    .split(/[,;\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/\.0\/24$/, "").replace(/\.$/, ""));

  for (const subnet of configured) {
    if (subnetFromIp(`${subnet}.1`)) subnets.add(subnetFromIp(`${subnet}.1`)!);
  }

  try {
    const hostname = new URL(poolApiUrl).hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      const resolved = await dns.lookup(hostname, { all: true });
      for (const entry of resolved) {
        const subnet = subnetFromIp(entry.address);
        if (subnet && isPrivateSubnet(subnet)) subnets.add(subnet);
      }
    }
  } catch {
    // Hostname may not resolve.
  }

  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      const family = String(address.family);
      if ((family === "IPv4" || family === "4") && !address.internal) {
        const subnet = subnetFromIp(address.address);
        if (subnet && isPrivateSubnet(subnet)) subnets.add(subnet);
      }
    }
  }

  return [...subnets];
}

async function isAxeMiner(ip: string): Promise<boolean> {
  const controllers = [
    `http://${ip}/api/v2/identify`,
    `http://${ip}/api/system/info`,
  ];

  for (const url of controllers) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(450),
        cache: "no-store",
      });
      if (!response.ok) continue;
      const text = await response.text();
      const lower = text.toLowerCase();
      if (
        lower.includes("nerdqaxe") ||
        lower.includes("bitaxe") ||
        lower.includes("axeos") ||
        lower.includes("asicmodel") ||
        lower.includes("devicemodel") ||
        lower.includes("hashrate") ||
        lower.includes("stratumuser")
      ) {
        return true;
      }
      // Identify endpoint often returns compact JSON with deviceModel.
      try {
        const json = JSON.parse(text) as { deviceModel?: string };
        if (json.deviceModel) return true;
      } catch {
        // Not JSON.
      }
    } catch {
      // Host closed or timed out.
    }
  }

  return false;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      const value = await worker(current);
      if (value != null) results.push(value);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  );
  return results;
}

async function scanSubnets(subnets: string[]): Promise<string[]> {
  const ips = subnets.flatMap((subnet) =>
    Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`),
  );

  return mapPool(ips, 48, async (ip) => ((await isAxeMiner(ip)) ? ip : null));
}

/** Find AxeOS / NerdQAxe hosts on LAN. Results are cached briefly. */
export async function discoverMinerHosts(poolApiUrl: string): Promise<string[]> {
  if (cache && Date.now() - cache.at < SCAN_TTL_MS) {
    return cache.hosts;
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const subnets = await candidateSubnets(poolApiUrl);
    if (subnets.length === 0) {
      cache = { at: Date.now(), hosts: [] };
      return [];
    }

    const hosts = await scanSubnets(subnets);
    cache = { at: Date.now(), hosts };
    return hosts;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
