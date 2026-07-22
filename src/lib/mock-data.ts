export type PoolSummary = {
  totalHashRate: number;
  blockHeight: number;
  totalMiners: number;
  blocksFound: number;
  bestDifficulty: number;
  fee: number;
};

export type FoundBlock = {
  height: number;
  address: string;
  worker: string;
  /** Device / user-agent label when known. */
  device?: string;
};

export type NetworkInfo = {
  height: number;
  nextHeight: number | null;
  difficulty: number;
  networkHashrate: number;
  chain: string;
  minFeeBtcKvB: number;
  currentBlockWeight: number | null;
  currentBlockTx: number | null;
  pooledTx: number | null;
  /** Chain tip headers from getblockchaininfo (IBD). */
  headers?: number | null;
  /** 0–1 from getblockchaininfo.verificationprogress. */
  verificationProgress?: number | null;
};

/** True while Bitcoin Core is still catching up (IBD). */
export function isNodeSyncing(network: NetworkInfo): boolean {
  if (
    network.verificationProgress != null &&
    Number.isFinite(network.verificationProgress)
  ) {
    return network.verificationProgress < 0.999;
  }
  if (network.headers != null && network.headers > 0) {
    return network.height < network.headers;
  }
  return false;
}

/** 0–100 IBD progress for sync-gated UI. */
export function syncProgressPct(network: NetworkInfo): number {
  if (
    network.verificationProgress != null &&
    Number.isFinite(network.verificationProgress)
  ) {
    return Math.min(100, Math.max(0, network.verificationProgress * 100));
  }
  if (network.headers != null && network.headers > 0) {
    return Math.min(100, Math.max(0, (network.height / network.headers) * 100));
  }
  return 0;
}

export type DifficultyAdjustment = {
  progressPercent: number;
  difficultyChange: number;
  previousRetarget: number;
  remainingBlocks: number;
  nextRetargetHeight: number;
  estimatedRetargetDate: number;
  timeAvgMs: number;
  expectedBlocks: number;
};

export type ChartPoint = {
  label: string;
  data: number;
};

export type MinerChartSeries = {
  id: string;
  name: string;
  chart: ChartPoint[];
};

export type Worker = {
  id: string;
  name: string;
  userAgent: string;
  /** Stratum protocol for the live session. */
  protocol: "sv1" | "sv2";
  address: string;
  sessionId: string;
  hashrate: number;
  shares: number;
  rejectedShares: number;
  bestDifficulty: number;
  uptimeSeconds: number | null;
  lastSeen: string | null;
  startTime: string | null;
  tempC: number | null;
  dashboardUrl: string | null;
  /** Product / project page (website or repo). */
  infoUrl?: string | null;
  blocksFound: number;
  /** False when remembered but not in the current pool session list. */
  online?: boolean;
};

export type DashboardPayload = {
  source: "mock" | "live";
  pool: PoolSummary;
  chart: ChartPoint[];
  minerCharts: MinerChartSeries[];
  /** ISO timestamp — earliest chart data (pool start). */
  chartSince: string;
  workers: Worker[];
  foundBlocks: FoundBlock[];
  network: NetworkInfo;
  difficultyAdjustment: DifficultyAdjustment | null;
  uptimeSeconds: number | null;
  /** Cumulative process uptime across all Lido sessions. */
  overallUptimeSeconds?: number | null;
  sharesAccepted?: number;
  sharesRejected?: number;
  /** Live pool SV2 authority pubkey for Connect (Noise auth). */
  sv2AuthorityPublicKey?: string | null;
};

const DEMO_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

/**
 * Find-your-miners test address — 6 workers (3× Bitaxe Gamma + 3 other types).
 * Use this in the Find your miners dialog while mocking.
 */
export const FIND_MINERS_TEST_ADDRESS =
  "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

/**
 * Fixed “process started” anchors so mock uptime advances like a real pool.
 * Session = current process (dashboard card); lifetime = all sessions (Settings → Info).
 * Avoid round week/month landmarks — looks staged.
 */
const MOCK_SESSION_STARTED_MS = Date.UTC(2026, 5, 26, 14, 27, 53); // Jun 26 → ~3+ weeks
const MOCK_LIFETIME_STARTED_MS = Date.UTC(2026, 2, 8, 11, 4, 18); // Mar 8 → ~4+ months

export function mockSessionUptimeSeconds(now = Date.now()): number {
  return Math.max(0, Math.floor((now - MOCK_SESSION_STARTED_MS) / 1000));
}

export function mockLifetimeUptimeSeconds(now = Date.now()): number {
  return Math.max(0, Math.floor((now - MOCK_LIFETIME_STARTED_MS) / 1000));
}

function mockWorkerUptimeSeconds(
  sessionFraction: number,
  index: number,
  phase: number,
  now: number,
): number {
  const session = mockSessionUptimeSeconds(now);
  const fraction = Math.min(1, Math.max(0, sessionFraction));
  const target = Math.floor(session * fraction);
  // Uneven minutes so the UI never lands on a round “Nd 0h”.
  const jitter = (((phase * 17 + index * 13) % 53) + 7) * 60 + (((index * 29 + phase * 7) % 47) + 5);
  return Math.max(0, Math.min(session, Math.max(0, target - jitter)));
}

/** Chart window matches pool session length (not a fixed 7d that truncates veterans). */
function mockChartWindow(now = Date.now()): { hours: number; intervalMinutes: number } {
  const sessionHours = Math.max(24, Math.ceil(mockSessionUptimeSeconds(now) / 3600));
  const hours = Math.min(sessionHours, 40 * 24);
  const intervalMinutes = hours > 20 * 24 ? 60 : hours > 10 * 24 ? 30 : 10;
  return { hours, intervalMinutes };
}

/** Pool high score shown on the demo dashboard (~4.20T). */
const DEMO_BEST_DIFFICULTY = 4.2e12;

function hashrateWobbleMultiplier(phase: number, timeMs: number): number {
  const t = timeMs / 1000;
  return (
    1 +
    0.045 * Math.sin(t / 47 + phase) +
    0.025 * Math.sin(t / 113 + phase * 1.4) +
    0.015 * Math.cos(t / 271 + phase * 0.8)
  );
}

/** Slow drift for chart history — keeps stacked areas readable. */
function chartWobbleMultiplier(phase: number, timeMs: number): number {
  const t = timeMs / 1000;
  return (
    1 +
    0.04 * Math.sin(t / 5400 + phase) +
    0.025 * Math.sin(t / 11_000 + phase * 1.3) +
    0.015 * Math.cos(t / 18_000 + phase * 0.7)
  );
}

function fluctuateHashrate(base: number, phase: number, now = Date.now()): number {
  return Math.max(0, base * hashrateWobbleMultiplier(phase, now));
}

type MockMinerSeed = {
  id: string;
  name: string;
  userAgent: string;
  sessionId: string;
  hashrate: number;
  shares: number;
  rejectedShares: number;
  bestDifficulty: number;
  /**
   * How long this worker has been on the *current* pool session (0–1).
   * 1 ≈ since process start (~pool uptime); smaller = joined later.
   */
  sessionFraction: number;
  tempC: number;
  dashboardHost?: string;
  phase: number;
  /** When false, shown as disconnected in the miners table. */
  online?: boolean;
  /** Payout / login address — defaults to DEMO_ADDRESS. */
  address?: string;
};

const MOCK_MINER_SEEDS: MockMinerSeed[] = [
  {
    id: "1",
    name: "nerdqaxe-kitchen",
    userAgent: "NerdQAxe++",
    sessionId: "a1f3",
    hashrate: 1.38e12,
    shares: 18_420,
    rejectedShares: 41,
    bestDifficulty: 68_274_102,
    sessionFraction: 0.96,
    tempC: 58,
    dashboardHost: "192.168.1.51",
    phase: 0.2,
  },
  {
    id: "2",
    name: "bitaxe-gamma",
    userAgent: "Bitaxe Gamma",
    sessionId: "b2c4",
    hashrate: 1.12e12,
    shares: 14_880,
    rejectedShares: 61,
    bestDifficulty: 41_002_110,
    sessionFraction: 0.74,
    tempC: 61,
    dashboardHost: "192.168.1.52",
    phase: 1.1,
  },
  {
    id: "3",
    name: "auradine-rack",
    userAgent: "Auradine AT1500",
    sessionId: "c3d5",
    hashrate: 2.08e12,
    shares: 26_140,
    rejectedShares: 39,
    bestDifficulty: 118_440_200,
    sessionFraction: 0.985,
    tempC: 49,
    dashboardHost: "192.168.1.53",
    phase: 2.4,
  },
  {
    id: "4",
    name: "bitaxe-ultra",
    userAgent: "Bitaxe Ultra",
    sessionId: "d4e6",
    hashrate: 8.6e11,
    shares: 11_640,
    rejectedShares: 79,
    bestDifficulty: 12_845_023,
    sessionFraction: 0.18,
    tempC: 63,
    dashboardHost: "192.168.1.54",
    phase: 3.6,
  },
  {
    id: "5",
    name: "nerdqaxe-garage",
    userAgent: "NerdQAxe",
    sessionId: "e5f7",
    hashrate: 9.8e11,
    shares: 13_220,
    rejectedShares: 44,
    bestDifficulty: 9_812_004,
    sessionFraction: 0.88,
    tempC: 57,
    dashboardHost: "192.168.1.55",
    phase: 4.2,
  },
  {
    id: "6",
    name: "esp-s3-shed",
    userAgent: "ESP-Miner S3+",
    sessionId: "f6g8",
    hashrate: 1.05e12,
    shares: 15_760,
    rejectedShares: 46,
    bestDifficulty: 18_331_900,
    sessionFraction: 0.91,
    tempC: 54,
    dashboardHost: "192.168.1.56",
    phase: 5.1,
  },
  {
    id: "7",
    name: "bitaxe-supra",
    userAgent: "Bitaxe Supra",
    sessionId: "g7h9",
    hashrate: 6.2e11,
    shares: 8_410,
    rejectedShares: 63,
    bestDifficulty: 6_204_880,
    sessionFraction: 0.28,
    tempC: 66,
    dashboardHost: "192.168.1.57",
    phase: 6.3,
  },
  {
    id: "8",
    name: "rrm-basement",
    userAgent: "Red Rock Miner RRM",
    sessionId: "h8j0",
    hashrate: 5.4e11,
    shares: 7_980,
    rejectedShares: 38,
    bestDifficulty: 4_992_110,
    sessionFraction: 0.65,
    tempC: 59,
    dashboardHost: "192.168.1.58",
    phase: 7.5,
  },
  {
    id: "9",
    name: "nerdoctaxe-den",
    userAgent: "NerdOctaxe",
    sessionId: "j9k1",
    hashrate: 12e12,
    shares: 38_640,
    rejectedShares: 73,
    bestDifficulty: 88_771_220,
    sessionFraction: 0.55,
    tempC: 55,
    dashboardHost: "192.168.1.59",
    phase: 8.4,
  },
  {
    id: "10",
    name: "nerdminer-s2",
    userAgent: "NerdMiner S2",
    sessionId: "k0l2",
    hashrate: 9.5e4,
    shares: 1_820,
    rejectedShares: 17,
    bestDifficulty: 48_440,
    sessionFraction: 0.12,
    tempC: 42,
    dashboardHost: "192.168.1.60",
    phase: 9.7,
  },
  {
    id: "11",
    name: "avalon-q-rack",
    userAgent: "Avalon Q",
    sessionId: "l1m3",
    hashrate: 9.0e13,
    shares: 42_600,
    rejectedShares: 51,
    bestDifficulty: 892_110_000,
    sessionFraction: 0.94,
    tempC: 52,
    phase: 10.2,
  },
  {
    id: "12",
    name: "antminer-s21-a",
    userAgent: "Antminer S21",
    sessionId: "m2n4",
    hashrate: 2.0e14,
    shares: 88_240,
    rejectedShares: 71,
    bestDifficulty: DEMO_BEST_DIFFICULTY,
    sessionFraction: 0.97,
    tempC: 48,
    phase: 11.4,
  },
  {
    id: "13",
    name: "antminer-s19xp-b",
    userAgent: "Antminer S19 XP",
    sessionId: "n3p5",
    hashrate: 1.36e14,
    shares: 61_880,
    rejectedShares: 68,
    bestDifficulty: 980_440_000,
    sessionFraction: 0.85,
    tempC: 50,
    phase: 12.1,
  },
  {
    id: "14",
    name: "braiins-mini",
    userAgent: "Braiins Mini Miner",
    sessionId: "p4q6",
    hashrate: 8.4e11,
    shares: 9_880,
    rejectedShares: 37,
    bestDifficulty: 14_220_000,
    sessionFraction: 0.62,
    tempC: 56,
    dashboardHost: "192.168.1.61",
    phase: 13.3,
    online: false,
  },
  {
    id: "15",
    name: "braiins-os-s19",
    userAgent: "Braiins OS",
    sessionId: "q5r7",
    hashrate: 3.1e13,
    shares: 19_420,
    rejectedShares: 47,
    bestDifficulty: 156_880_000,
    sessionFraction: 0.71,
    tempC: 51,
    phase: 14.6,
    online: false,
  },
  {
    id: "16",
    name: "bitaxe-hex",
    userAgent: "Bitaxe Hex",
    sessionId: "r6s8",
    hashrate: 4.8e12,
    shares: 22_140,
    rejectedShares: 55,
    bestDifficulty: 44_220_000,
    sessionFraction: 0.35,
    tempC: 62,
    dashboardHost: "192.168.1.62",
    phase: 15.2,
  },
  {
    id: "17",
    name: "nerdaxe-loft",
    userAgent: "NerdAxe",
    sessionId: "s7t9",
    hashrate: 1.2e12,
    shares: 10_440,
    rejectedShares: 29,
    bestDifficulty: 11_080_000,
    sessionFraction: 0.42,
    tempC: 58,
    dashboardHost: "192.168.1.63",
    phase: 16.1,
  },
  {
    id: "18",
    name: "avalon-nano-desk",
    userAgent: "Avalon Nano 3S",
    sessionId: "t8u0",
    hashrate: 4.0e12,
    shares: 16_220,
    rejectedShares: 33,
    bestDifficulty: 28_640_000,
    sessionFraction: 0.78,
    tempC: 46,
    phase: 17.4,
  },
  {
    id: "19",
    name: "antminer-s21-pro",
    userAgent: "Antminer S21 Pro",
    sessionId: "u9v1",
    hashrate: 2.34e14,
    shares: 102_400,
    rejectedShares: 82,
    bestDifficulty: 1_420_000_000,
    sessionFraction: 0.93,
    tempC: 49,
    phase: 18.3,
  },
  {
    id: "20",
    name: "bitaxe-gt",
    userAgent: "Bitaxe GT",
    sessionId: "v0w2",
    hashrate: 2.4e12,
    shares: 12_880,
    rejectedShares: 41,
    bestDifficulty: 19_550_000,
    sessionFraction: 0.09,
    tempC: 64,
    dashboardHost: "192.168.1.64",
    phase: 19.7,
  },
  {
    id: "21",
    name: "whatsminer-m60",
    userAgent: "Whatsminer M60",
    sessionId: "w1x3",
    hashrate: 1.86e14,
    shares: 74_120,
    rejectedShares: 59,
    bestDifficulty: 1_105_000_000,
    sessionFraction: 0.82,
    tempC: 53,
    phase: 20.5,
  },
];

/** Fixed set for Find-your-miners testing (not stress-cloned). */
const FIND_MINERS_TEST_SEEDS: MockMinerSeed[] = [
  {
    id: "find-1",
    name: "gamma-desk",
    userAgent: "Bitaxe Gamma",
    sessionId: "fnd1",
    hashrate: 1.18e12,
    shares: 9_420,
    rejectedShares: 22,
    bestDifficulty: 22_440_100,
    sessionFraction: 0.91,
    tempC: 59,
    dashboardHost: "192.168.1.71",
    phase: 30.1,
    address: FIND_MINERS_TEST_ADDRESS,
  },
  {
    id: "find-2",
    name: "gamma-shelf",
    userAgent: "Bitaxe Gamma",
    sessionId: "fnd2",
    hashrate: 1.09e12,
    shares: 8_110,
    rejectedShares: 31,
    bestDifficulty: 18_220_400,
    sessionFraction: 0.72,
    tempC: 61,
    dashboardHost: "192.168.1.72",
    phase: 30.4,
    address: FIND_MINERS_TEST_ADDRESS,
  },
  {
    id: "find-3",
    name: "gamma-rack",
    userAgent: "Bitaxe Gamma",
    sessionId: "fnd3",
    hashrate: 1.21e12,
    shares: 10_050,
    rejectedShares: 19,
    bestDifficulty: 31_880_200,
    sessionFraction: 0.84,
    tempC: 57,
    dashboardHost: "192.168.1.73",
    phase: 30.8,
    address: FIND_MINERS_TEST_ADDRESS,
  },
  {
    id: "find-4",
    name: "nerdqaxe-lab",
    userAgent: "NerdQAxe++",
    sessionId: "fnd4",
    hashrate: 1.42e12,
    shares: 12_640,
    rejectedShares: 28,
    bestDifficulty: 44_120_000,
    sessionFraction: 0.95,
    tempC: 55,
    dashboardHost: "192.168.1.74",
    phase: 31.2,
    address: FIND_MINERS_TEST_ADDRESS,
  },
  {
    id: "find-5",
    name: "s21-garage",
    userAgent: "Antminer S21",
    sessionId: "fnd5",
    hashrate: 1.95e14,
    shares: 54_200,
    rejectedShares: 61,
    bestDifficulty: 620_440_000,
    sessionFraction: 0.88,
    tempC: 48,
    phase: 31.6,
    address: FIND_MINERS_TEST_ADDRESS,
  },
  {
    id: "find-6",
    name: "nano-office",
    userAgent: "Avalon Nano 3S",
    sessionId: "fnd6",
    hashrate: 3.8e12,
    shares: 7_880,
    rejectedShares: 14,
    bestDifficulty: 12_660_000,
    sessionFraction: 0.63,
    tempC: 44,
    phase: 32.0,
    address: FIND_MINERS_TEST_ADDRESS,
  },
];

/** Public mock stress: deterministic working count per device (1–300). */
const MOCK_STRESS_WORKING_MAX = 300;

function mockStressEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_LIDO_PUBLIC === "true" ||
    process.env.LIDO_PUBLIC === "true"
  );
}

function mockWorkingCount(seed: MockMinerSeed): number {
  if (seed.online === false) return 1;
  if (!mockStressEnabled()) return 1;
  let hash = 0;
  for (let i = 0; i < seed.id.length; i += 1) {
    hash = (hash * 31 + seed.id.charCodeAt(i)) >>> 0;
  }
  // Spread across device types so the table isn't all near the same count.
  hash = (hash ^ Math.imul(seed.userAgent.length, 0x9e3779b1)) >>> 0;
  return 1 + (hash % MOCK_STRESS_WORKING_MAX);
}

function cloneMockMinerSeed(seed: MockMinerSeed, cloneIndex: number): MockMinerSeed {
  if (cloneIndex === 0) return seed;
  const n = cloneIndex + 1;
  return {
    ...seed,
    id: `${seed.id}-${n}`,
    name: `${seed.name}-${n}`,
    sessionId: `${seed.sessionId}${n.toString(16)}`,
    phase: seed.phase + cloneIndex * 0.17,
    hashrate: seed.hashrate * (0.88 + ((cloneIndex * 7) % 25) * 0.005),
    shares: Math.max(1, Math.floor(seed.shares * (0.55 + ((cloneIndex * 3) % 20) * 0.02))),
    rejectedShares: Math.max(
      0,
      Math.floor(seed.rejectedShares * (0.4 + ((cloneIndex * 5) % 15) * 0.04)),
    ),
    bestDifficulty: seed.bestDifficulty * (0.7 + ((cloneIndex * 11) % 30) * 0.01),
    sessionFraction: Math.min(
      1,
      Math.max(0.05, seed.sessionFraction * (0.75 + ((cloneIndex * 13) % 20) * 0.012)),
    ),
    tempC: seed.tempC + ((cloneIndex * 3) % 9) - 4,
    dashboardHost: seed.dashboardHost
      ? seed.dashboardHost.replace(/\.\d+$/, `.${50 + (cloneIndex % 200)}`)
      : undefined,
  };
}

let cachedExpandedMockSeeds: MockMinerSeed[] | null = null;

function getMockMinerSeeds(): MockMinerSeed[] {
  if (!mockStressEnabled()) {
    return [...MOCK_MINER_SEEDS, ...FIND_MINERS_TEST_SEEDS];
  }
  if (cachedExpandedMockSeeds) return cachedExpandedMockSeeds;
  const expanded: MockMinerSeed[] = [];
  for (const seed of MOCK_MINER_SEEDS) {
    const count = mockWorkingCount(seed);
    for (let i = 0; i < count; i += 1) {
      expanded.push(cloneMockMinerSeed(seed, i));
    }
  }
  // Keep the Find-your-miners set small and stable (not stress-cloned).
  expanded.push(...FIND_MINERS_TEST_SEEDS);
  cachedExpandedMockSeeds = expanded;
  return expanded;
}

function hoursAgo(hours: number, now = Date.now()) {
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

/** Default empty chart: N hours × interval buckets (matches live pool slots). */
export function buildZeroChart(
  hours = 24,
  intervalMinutes = 10,
  now = Date.now(),
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const steps = Math.max(1, Math.round((hours * 60) / intervalMinutes));
  for (let i = steps; i >= 1; i -= 1) {
    points.push({
      label: new Date(now - i * intervalMinutes * 60 * 1000).toISOString(),
      data: 0,
    });
  }
  return points;
}

function buildMinerHashrateChart(
  baseHashrate: number,
  phase: number,
  now = Date.now(),
  options?: { connectedSinceMs?: number; offlineSinceMs?: number },
): ChartPoint[] {
  const { hours, intervalMinutes } = mockChartWindow(now);
  const points = buildZeroChart(hours, intervalMinutes, now);
  const steps = points.length;
  const liveHashrate = fluctuateHashrate(baseHashrate, phase, now);
  const connectedSinceMs = options?.connectedSinceMs;
  const offlineSinceMs = options?.offlineSinceMs;

  return points.map((point, index) => {
    const pointTs = new Date(point.label).getTime();
    if (!Number.isFinite(pointTs)) {
      return { ...point, data: 0 };
    }
    // No hashrate before this worker joined (or after it went offline).
    if (connectedSinceMs != null && pointTs < connectedSinceMs) {
      return { ...point, data: 0 };
    }
    if (offlineSinceMs != null && pointTs >= offlineSinceMs) {
      return { ...point, data: 0 };
    }

    const progress = index / Math.max(1, steps - 1);
    const ramp = 0.78 + 0.22 * progress;
    const wobble = chartWobbleMultiplier(phase, pointTs);
    const isLiveTip = index === steps - 1 && offlineSinceMs == null;
    const value = isLiveTip ? liveHashrate : baseHashrate * ramp * wobble;

    return {
      ...point,
      data: Math.max(0, value),
    };
  });
}

type MockWorkerSession = {
  online: boolean;
  uptimeSeconds: number | null;
  connectedSinceMs: number;
  offlineSinceMs?: number;
};

/** Shared session math for miner table uptime + chart history. */
function mockWorkerSession(
  miner: MockMinerSeed,
  index: number,
  now: number,
): MockWorkerSession {
  const online = miner.online !== false;
  const uptimeSeconds = mockWorkerUptimeSeconds(
    miner.sessionFraction,
    index,
    miner.phase,
    now,
  );

  if (online) {
    return {
      online: true,
      uptimeSeconds,
      connectedSinceMs: now - uptimeSeconds * 1000,
    };
  }

  const offlineSinceMs = mockOfflineSinceMs(index, now);
  return {
    online: false,
    uptimeSeconds: null,
    // Still had a prior session — chart is live only between connect and disconnect.
    connectedSinceMs: offlineSinceMs - uptimeSeconds * 1000,
    offlineSinceMs,
  };
}

function sumCharts(series: MinerChartSeries[], now = Date.now()): ChartPoint[] {
  const { hours, intervalMinutes } = mockChartWindow(now);
  if (series.length === 0) return buildZeroChart(hours, intervalMinutes, now);

  const length = series[0].chart.length;
  return Array.from({ length }, (_, index) => {
    const label = series[0].chart[index]?.label ?? new Date(now).toISOString();
    const data = series.reduce(
      (sum, miner) => sum + (Number(miner.chart[index]?.data) || 0),
      0,
    );
    return { label, data };
  });
}

function buildMockWorkers(now = Date.now()): Worker[] {
  return getMockMinerSeeds().map((miner, index) => {
    const session = mockWorkerSession(miner, index, now);
    return {
      id: miner.id,
      name: miner.name,
      userAgent: miner.userAgent,
      protocol: index % 5 === 0 ? "sv2" : "sv1",
      address: miner.address ?? DEMO_ADDRESS,
      sessionId: miner.sessionId,
      hashrate: session.online ? fluctuateHashrate(miner.hashrate, miner.phase, now) : 0,
      shares: miner.shares,
      rejectedShares: miner.rejectedShares,
      bestDifficulty: miner.bestDifficulty,
      uptimeSeconds: session.uptimeSeconds,
      lastSeen: session.online
        ? new Date(now - (3_000 + (index % 200) * 1_500)).toISOString()
        : new Date(session.offlineSinceMs ?? now).toISOString(),
      startTime: session.online
        ? new Date(session.connectedSinceMs).toISOString()
        : null,
      tempC: session.online ? miner.tempC : null,
      dashboardUrl: miner.dashboardHost ? `http://${miner.dashboardHost}` : null,
      blocksFound: 0,
      online: session.online,
    };
  });
}

function mockOfflineSinceMs(index: number, now: number) {
  return now - 86_400_000 * (2 + index * 0.15);
}

/** Coherent demo payload — worker hashrates, miner charts, and pool total all align. */
export function buildMockDashboard(now = Date.now()): DashboardPayload {
  // Charts stay on the original seed set (scaled by clone count) so stress mocks
  // don't build thousands of per-miner series — plus the Find-your-miners test set.
  const chartSeeds = [...MOCK_MINER_SEEDS, ...FIND_MINERS_TEST_SEEDS];
  const minerCharts: MinerChartSeries[] = chartSeeds.map((miner, index) => {
    const session = mockWorkerSession(miner, index, now);
    const scale =
      miner.online === false
        ? 0
        : FIND_MINERS_TEST_SEEDS.some((seed) => seed.id === miner.id)
          ? 1
          : mockWorkingCount(miner);
    const chart = buildMinerHashrateChart(miner.hashrate, miner.phase, now, {
      connectedSinceMs: session.connectedSinceMs,
      offlineSinceMs: session.offlineSinceMs,
    });
    return {
      id: miner.id,
      name: miner.name,
      chart:
        scale <= 1
          ? chart
          : chart.map((point) => ({ ...point, data: point.data * scale })),
    };
  });
  const onlineCharts = minerCharts.filter((_, index) => {
    return chartSeeds[index]?.online !== false;
  });
  const chart = sumCharts(onlineCharts, now);
  const workers = buildMockWorkers(now);
  const onlineWorkers = workers.filter((worker) => worker.online !== false);
  const totalHashRate = onlineWorkers.reduce((sum, worker) => sum + worker.hashrate, 0);
  const bestDifficulty = DEMO_BEST_DIFFICULTY;
  const blockHeight = 918_742;

  return {
    source: "mock",
    pool: {
      totalHashRate,
      blockHeight,
      totalMiners: onlineWorkers.length,
      blocksFound: 1,
      bestDifficulty,
      fee: 0,
    },
    chart,
    chartSince: hoursAgo(mockChartWindow(now).hours, now),
    network: {
      height: blockHeight,
      nextHeight: blockHeight + 1,
      difficulty: 116_960_061_420_154.6,
      networkHashrate: 8.92e20,
      chain: "main",
      minFeeBtcKvB: 1e-8,
      currentBlockWeight: 3_992_140,
      currentBlockTx: 3_210,
      pooledTx: 4_800,
      headers: blockHeight,
      verificationProgress: 1,
    },
    difficultyAdjustment: {
      progressPercent: 42.5,
      difficultyChange: 2.74,
      previousRetarget: -5.0,
      remainingBlocks: 1158,
      nextRetargetHeight: blockHeight + (2016 - (blockHeight % 2016)),
      estimatedRetargetDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      timeAvgMs: 585_000,
      expectedBlocks: 820,
    },
    uptimeSeconds: mockSessionUptimeSeconds(now),
    overallUptimeSeconds: mockLifetimeUptimeSeconds(now),
    sharesAccepted: 512_840,
    sharesRejected: 1_284,
    foundBlocks: [
      {
        height: blockHeight - 17_740,
        address: DEMO_ADDRESS,
        worker: "nerdqaxe-kitchen",
        device: "NerdQAxe++",
      },
      {
        height: blockHeight - 42_100,
        address: FIND_MINERS_TEST_ADDRESS,
        worker: "gamma-desk",
        device: "Bitaxe Gamma",
      },
    ],
    workers,
    minerCharts,
    sv2AuthorityPublicKey: "9bXiEd8boQVhq7WddEcERUL5tyyJVFYdU8th3HfbNXK3Yw6GRXh",
  };
}


/** Static snapshot for imports/tests; prefer buildMockDashboard() at runtime. */
export const mockDashboard: DashboardPayload = buildMockDashboard();
