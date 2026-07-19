import { unstable_noStore as noStore } from "next/cache";

import { applyLiveChainSnapshot, fetchLiveChainSnapshot } from "@/lib/live-chain";
import { buildMockDashboard, type ChartPoint, type DashboardPayload, type DifficultyAdjustment, type FoundBlock, type MinerChartSeries, type NetworkInfo, type Worker } from "@/lib/mock-data";
import { discoverMinerHosts } from "@/lib/network-scan";
import { configuredStratumUrl as configuredStratumUrlPublic } from "@/lib/pool-public";

/** Dynamic access so Next does not inline these at docker build time. */
function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function useMockData() {
  return env("GITHUB_PAGES") === "true" || env("LIDO_USE_MOCK") === "true";
}

function poolBaseUrl() {
  if (useMockData()) return "";
  return env("PUBLIC_POOL_API_URL").replace(/\/+$/, "");
}

function mempoolBaseUrl() {
  return env("MEMPOOL_API_URL").replace(/\/+$/, "") || "https://mempool.space/api";
}

/** Server/runtime stratum hint — UI resolves the display URL from the browser host. */
export function configuredStratumUrl() {
  return (
    env("PUBLIC_POOL_STRATUM_URL") ||
    configuredStratumUrlPublic() ||
    ""
  );
}

function configuredMinerHosts(): string[] {
  const raw = env("MINER_HOSTS") || env("MINER_SEED");
  return raw
    .split(/[,;\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/^https?:\/\//, "").replace(/\/+$/, ""));
}

function dashboardUrlFor(host: string) {
  if (host.startsWith("http://") || host.startsWith("https://")) return host;
  return `http://${host}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    next: { revalidate: 0 },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json() as Promise<T>;
}

async function fetchPool<T>(path: string): Promise<T> {
  const base = poolBaseUrl();
  if (!base) throw new Error("PUBLIC_POOL_API_URL is not set");
  return fetchJson<T>(`${base}${path}`);
}

type LivePoolResponse = {
  totalHashRate: number;
  blockHeight: number;
  totalMiners: number;
  blocksFound?: Array<{
    height?: number;
    minerAddress?: string;
    worker?: string;
  }>;
  fee?: number;
};

type PoolWorker = {
  sessionId: string;
  name: string;
  bestDifficulty: number | string;
  hashRate: number;
  startTime: string;
  lastSeen: string;
  userAgent?: string;
  protocol?: string;
  address?: string;
  shares?: number;
  rejectedShares?: number;
};

type PoolClientResponse = {
  bestDifficulty?: number;
  workersCount: number;
  workers: PoolWorker[];
};

type AxeSystemInfo = {
  hostname?: string;
  ipAddress?: string;
  ASICModel?: string;
  deviceModel?: string;
  hashRate?: number;
  hashRate_10m?: number;
  temp?: number;
  asicTemp?: number;
  bestDiff?: string | number;
  bestSessionDiff?: string | number;
  uptimeSeconds?: number;
  stratumUser?: string;
};

type AxeDashboard = {
  system?: { uptime?: number };
  performance?: {
    hashRate?: number;
    bestDiff?: number;
    bestSessionDiff?: number;
  };
  thermal?: { asicTemp?: number };
  stratum?: {
    pools?: Array<{ user?: string; bestDiff?: number; accepted?: number }>;
  };
};

type AxeSwarmInfo = {
  swarm?: Array<{ ip?: string; ipAddress?: string }>;
};

type LiveInfoResponse = {
  /** Process boot time (Uptime card). */
  uptime?: string | Date;
  /** First pool start — persists across restarts for chart date range. */
  startedAt?: string | Date;
  highScores?: Array<{
    bestDifficulty?: number | string;
    bestDifficultyUserAgent?: string;
    updatedAt?: string;
  }>;
  userAgents?: Array<{
    userAgent: string;
    count: string | number;
    bestDifficulty: string | number;
    totalHashRate: string | number;
  }>;
};

function parsePoolUptimeSeconds(uptime: unknown): number | null {
  if (uptime == null) return null;
  const started = new Date(uptime as string | Date).getTime();
  if (!Number.isFinite(started)) return null;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

type LiveNetworkResponse = {
  blocks?: number;
  difficulty?: number;
  networkhashps?: number;
  chain?: string;
  blockmintxfee?: number;
  currentblockweight?: number;
  currentblocktx?: number;
  pooledtx?: number;
  next?: { height?: number };
};

function mapNetwork(raw: LiveNetworkResponse | null, fallbackHeight: number): NetworkInfo {
  return {
    height: Number(raw?.blocks) || fallbackHeight,
    nextHeight: raw?.next?.height != null ? Number(raw.next.height) : null,
    difficulty: Number(raw?.difficulty) || 0,
    networkHashrate: Number(raw?.networkhashps) || 0,
    chain: raw?.chain || "unknown",
    minFeeBtcKvB: Number(raw?.blockmintxfee) || 0,
    currentBlockWeight:
      raw?.currentblockweight == null ? null : Number(raw.currentblockweight),
    currentBlockTx: raw?.currentblocktx == null ? null : Number(raw.currentblocktx),
    pooledTx: raw?.pooledtx == null ? null : Number(raw.pooledtx),
  };
}

async function loadDifficultyAdjustment(): Promise<DifficultyAdjustment | null> {
  try {
    const live = await fetchLiveChainSnapshot(mempoolBaseUrl());
    return live.difficultyAdjustment;
  } catch {
    return null;
  }
}

/** Overlay live Bitcoin network stats onto the demo dashboard (miners stay mocked). */
async function enrichMockWithLiveChain(mock: DashboardPayload): Promise<DashboardPayload> {
  try {
    const live = await fetchLiveChainSnapshot(mempoolBaseUrl());
    return applyLiveChainSnapshot(mock, live);
  } catch {
    return mock;
  }
}

function parseStratumUser(user?: string): { address: string; workerName: string } {
  if (!user) return { address: "", workerName: "" };
  const [address, ...rest] = user.split(".");
  return {
    address: address ?? "",
    workerName: rest.join(".") || "",
  };
}

function parseDifficulty(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.eE+-]/g, "");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function poolWorkerToWorker(session: PoolWorker, fallbackAddress = ""): Worker {
  const address = session.address || fallbackAddress;
  const uptimeSeconds = session.startTime
    ? Math.max(0, Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000))
    : null;

  return {
    id: `${address || "pool"}-${session.name}-${session.sessionId}`,
    name: session.name,
    userAgent: session.userAgent || "unknown",
    protocol: session.protocol === "sv2" ? "sv2" : "sv1",
    address,
    sessionId: session.sessionId,
    hashrate: session.hashRate,
    shares: Number(session.shares) || 0,
    rejectedShares: Number(session.rejectedShares) || 0,
    bestDifficulty: parseDifficulty(session.bestDifficulty),
    uptimeSeconds,
    lastSeen: session.lastSeen,
    startTime: session.startTime,
    tempC: null,
    dashboardUrl: null,
    blocksFound: 0,
    online: true,
  };
}

async function expandHosts(hosts: string[]): Promise<string[]> {
  if (hosts.length !== 1) return hosts;
  const seed = hosts[0];
  try {
    const swarm = await fetchJson<AxeSwarmInfo>(`http://${seed}/api/swarm/info`, {
      signal: AbortSignal.timeout(2500),
    });
    const found = (swarm.swarm ?? [])
      .map((item) => item.ip || item.ipAddress || "")
      .filter(Boolean);
    if (found.length > 0) return Array.from(new Set([seed, ...found]));
  } catch {
    // Seed may not expose swarm.
  }
  return hosts;
}

async function loadMinerDevice(host: string): Promise<Worker | null> {
  const base = dashboardUrlFor(host);
  let info: AxeSystemInfo | null = null;
  let dash: AxeDashboard | null = null;

  try {
    info = await fetchJson<AxeSystemInfo>(`${base}/api/system/info`, {
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    try {
      dash = await fetchJson<AxeDashboard>(`${base}/api/v2/dashboard`, {
        signal: AbortSignal.timeout(2500),
      });
    } catch {
      return null;
    }
  }

  if (!dash) {
    try {
      dash = await fetchJson<AxeDashboard>(`${base}/api/v2/dashboard`, {
        signal: AbortSignal.timeout(2500),
      });
    } catch {
      // Optional.
    }
  }

  const stratumUser =
    info?.stratumUser ||
    dash?.stratum?.pools?.find((pool) => pool.user)?.user ||
    "";
  const parsed = parseStratumUser(stratumUser);
  const name =
    parsed.workerName ||
    info?.hostname ||
    host.replace(/\.(local|lan)$/i, "") ||
    host;
  const hashrate =
    Number(info?.hashRate_10m ?? info?.hashRate ?? dash?.performance?.hashRate ?? 0) || 0;
  const normalizedHashrate = hashrate > 0 && hashrate < 1e9 ? hashrate * 1e9 : hashrate;
  const bestDifficulty = parseDifficulty(
    info?.bestDiff ??
      info?.bestSessionDiff ??
      dash?.performance?.bestDiff ??
      dash?.performance?.bestSessionDiff ??
      dash?.stratum?.pools?.find((pool) => pool.user)?.bestDiff,
  );
  const tempC = info?.temp ?? info?.asicTemp ?? dash?.thermal?.asicTemp ?? null;
  const uptimeSeconds = info?.uptimeSeconds ?? dash?.system?.uptime ?? null;
  const ip = info?.ipAddress || host;

  return {
    id: `${ip}-${name}`,
    name,
    userAgent: info?.deviceModel || info?.ASICModel || "AxeOS",
    protocol: "sv1",
    address: parsed.address,
    sessionId: "",
    hashrate: normalizedHashrate,
    shares: 0,
    rejectedShares: 0,
    bestDifficulty,
    uptimeSeconds,
    lastSeen: new Date().toISOString(),
    startTime: uptimeSeconds
      ? new Date(Date.now() - uptimeSeconds * 1000).toISOString()
      : null,
    tempC: tempC == null ? null : Number(tempC),
    dashboardUrl: dashboardUrlFor(ip),
    blocksFound: 0,
    online: true,
  };
}

async function resolveMinerHosts(): Promise<string[]> {
  const configured = configuredMinerHosts();
  const base = poolBaseUrl();
  const discovered = base ? await discoverMinerHosts(base) : [];
  const merged = Array.from(new Set([...configured, ...discovered]));
  return expandHosts(merged);
}

async function loadDevices(): Promise<Worker[]> {
  const hosts = await resolveMinerHosts();
  if (hosts.length === 0) return [];
  return (await Promise.all(hosts.map((host) => loadMinerDevice(host)))).filter(
    (worker): worker is Worker => worker != null,
  );
}

/** Bassin-style: whoever is connected to the pool appears automatically. */
async function loadPoolConnectedWorkers(): Promise<Worker[]> {
  try {
    const data = await fetchPool<PoolClientResponse>("/api/client");
    return (data.workers ?? []).map((session) => poolWorkerToWorker(session));
  } catch {
    // List-all unavailable; try address-scoped fallback below.
  }

  const address = env("PUBLIC_POOL_ADDRESS");
  if (!address) return [];

  try {
    const data = await fetchPool<PoolClientResponse>(
      `/api/client/${encodeURIComponent(address)}`,
    );
    return (data.workers ?? []).map((session) => poolWorkerToWorker(session, address));
  } catch {
    return [];
  }
}

function mergeWorkers(poolWorkers: Worker[], devices: Worker[]): Worker[] {
  const pool = dedupeWorkersByName(poolWorkers);
  if (pool.length === 0) return devices;
  if (devices.length === 0) return pool;

  const usedDevices = new Set<string>();

  const merged = pool.map((poolWorker) => {
    const device = devices.find((candidate) => {
      if (usedDevices.has(candidate.id)) return false;
      const nameMatch =
        candidate.name.toLowerCase() === poolWorker.name.toLowerCase() ||
        candidate.name.toLowerCase().includes(poolWorker.name.toLowerCase()) ||
        poolWorker.name.toLowerCase().includes(candidate.name.toLowerCase());
      const addressMatch =
        Boolean(candidate.address) &&
        Boolean(poolWorker.address) &&
        candidate.address === poolWorker.address;
      return nameMatch || addressMatch;
    });

    if (!device) return poolWorker;
    usedDevices.add(device.id);

    return {
      ...poolWorker,
      userAgent: device.userAgent || poolWorker.userAgent,
      hashrate: poolWorker.hashrate || device.hashrate,
      shares: poolWorker.shares || device.shares,
      rejectedShares: poolWorker.rejectedShares || device.rejectedShares,
      bestDifficulty: Math.max(poolWorker.bestDifficulty, device.bestDifficulty),
      uptimeSeconds: device.uptimeSeconds ?? poolWorker.uptimeSeconds,
      tempC: device.tempC ?? poolWorker.tempC,
      dashboardUrl: device.dashboardUrl,
      address: poolWorker.address || device.address,
    };
  });

  const leftovers = devices.filter((device) => !usedDevices.has(device.id));
  return [...merged, ...leftovers];
}

/** Prefer the freshest pool session when reconnects left duplicates. */
function dedupeWorkersByName(workers: Worker[]): Worker[] {
  const seenMs = (value: string | null) => {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
  };

  const byKey = new Map<string, Worker>();
  for (const worker of workers) {
    const key = `${worker.address}\0${worker.name}`.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, worker);
      continue;
    }
    const existingSeen = seenMs(existing.lastSeen);
    const nextSeen = seenMs(worker.lastSeen);
    if (nextSeen >= existingSeen) {
      byKey.set(key, {
        ...worker,
        shares: Math.max(worker.shares, existing.shares),
        rejectedShares: Math.max(worker.rejectedShares, existing.rejectedShares),
        bestDifficulty: Math.max(worker.bestDifficulty, existing.bestDifficulty),
      });
    } else {
      existing.shares = Math.max(existing.shares, worker.shares);
      existing.rejectedShares = Math.max(existing.rejectedShares, worker.rejectedShares);
      existing.bestDifficulty = Math.max(existing.bestDifficulty, worker.bestDifficulty);
    }
  }
  return Array.from(byKey.values());
}

function appendLiveHashrate(chart: ChartPoint[], liveHashrate: number): ChartPoint[] {
  if (!Number.isFinite(liveHashrate) || liveHashrate <= 0) return chart;
  const now = new Date().toISOString();
  if (chart.length === 0) {
    return [{ label: now, data: liveHashrate }];
  }
  const last = chart[chart.length - 1];
  const lastTs = new Date(last.label).getTime();
  const ageMs = Date.now() - lastTs;
  if (ageMs > 90_000) {
    return [...chart, { label: now, data: liveHashrate }];
  }
  return [...chart.slice(0, -1), { label: now, data: liveHashrate }];
}

function chartSinceIso(info: LiveInfoResponse): string {
  const raw = info.startedAt ?? info.uptime;
  if (raw) {
    const started = new Date(raw as string | Date).getTime();
    if (Number.isFinite(started)) return new Date(started).toISOString();
  }
  return new Date().toISOString();
}

async function loadMinerCharts(chartSince: string): Promise<MinerChartSeries[]> {
  const from = encodeURIComponent(chartSince);
  try {
    const bulk = await fetchPool<MinerChartSeries[]>(`/api/info/chart/miners?from=${from}`);
    if (Array.isArray(bulk) && bulk.length > 0) {
      return bulk.map((row) => ({
        id: row.id || row.name,
        name: row.name,
        chart: Array.isArray(row.chart) ? row.chart : [],
      }));
    }
  } catch {
    // No miner history yet.
  }
  return [];
}

function emptyLiveDashboard(): DashboardPayload {
  return {
    source: "live",
    pool: {
      totalHashRate: 0,
      blockHeight: 0,
      totalMiners: 0,
      blocksFound: 0,
      bestDifficulty: 0,
      fee: 0,
    },
    chart: [],
    chartSince: new Date().toISOString(),
    minerCharts: [],
    workers: [],
    foundBlocks: [],
    network: {
      height: 0,
      nextHeight: null,
      difficulty: 0,
      networkHashrate: 0,
      chain: "unknown",
      minFeeBtcKvB: 0,
      currentBlockWeight: null,
      currentBlockTx: null,
      pooledTx: null,
    },
    difficultyAdjustment: null,
    uptimeSeconds: null,
    sv2AuthorityPublicKey: null,
  };
}

export async function getDashboard(): Promise<DashboardPayload> {
  // Demo/mock: fake miners + live chain stats from mempool.space.
  if (useMockData()) {
    // Local mock refreshes each request; static GH Pages export stays build-time.
    if (env("GITHUB_PAGES") !== "true") {
      noStore();
    }
    const mock = buildMockDashboard();
    try {
      return await enrichMockWithLiveChain(mock);
    } catch {
      return mock;
    }
  }

  // Always render at request time so PUBLIC_POOL_API_URL from compose applies.
  noStore();

  const base = poolBaseUrl();
  if (!base) {
    return emptyLiveDashboard();
  }

  const [pool, info, networkRaw, difficultyAdjustment, poolWorkers, devices, sv2Info] =
    await Promise.all([
      fetchPool<LivePoolResponse>("/api/pool"),
      fetchPool<LiveInfoResponse>("/api/info"),
      fetchPool<LiveNetworkResponse>("/api/network").catch(() => null),
      loadDifficultyAdjustment(),
      loadPoolConnectedWorkers(),
      loadDevices(),
      fetchPool<{ enabled?: boolean; authorityPublicKey?: string }>("/api/info/sv2").catch(
        () => null,
      ),
    ]);

  const chartSince = chartSinceIso(info);
  const from = encodeURIComponent(chartSince);
  let chart = await fetchPool<ChartPoint[]>(`/api/info/chart?from=${from}`).catch(() => []);
  chart = appendLiveHashrate(chart, pool.totalHashRate);

  const workers = mergeWorkers(poolWorkers, devices);
  const minerCharts = await loadMinerCharts(chartSince);
  const highScoreBest = Math.max(
    0,
    ...(info.highScores ?? []).map((row) => parseDifficulty(row.bestDifficulty)),
  );
  const workerBest = workers.reduce((max, worker) => Math.max(max, worker.bestDifficulty), 0);
  const userAgentBest = Math.max(
    0,
    ...(info.userAgents ?? []).map((row) => parseDifficulty(row.bestDifficulty)),
  );

  const foundBlocks: FoundBlock[] = Array.isArray(pool.blocksFound)
    ? pool.blocksFound
        .map((block) => ({
          height: Number(block.height) || 0,
          address: block.minerAddress || "",
          worker: block.worker || "",
        }))
        .filter((block) => block.height > 0)
        .sort((a, b) => b.height - a.height)
    : [];

  const network = mapNetwork(networkRaw, pool.blockHeight);
  const sv2AuthorityPublicKey =
    sv2Info?.enabled && sv2Info.authorityPublicKey ? sv2Info.authorityPublicKey : null;

  return {
    source: "live",
    pool: {
      totalHashRate: pool.totalHashRate,
      blockHeight: network.height || pool.blockHeight,
      totalMiners: pool.totalMiners ?? workers.length,
      blocksFound: foundBlocks.length,
      bestDifficulty: Math.max(highScoreBest, workerBest, userAgentBest),
      fee: pool.fee ?? 0,
    },
    chart,
    chartSince,
    minerCharts,
    workers: workers.sort((a, b) => b.hashrate - a.hashrate),
    foundBlocks,
    network,
    difficultyAdjustment,
    uptimeSeconds: parsePoolUptimeSeconds(info.uptime),
    sv2AuthorityPublicKey,
  };
}
