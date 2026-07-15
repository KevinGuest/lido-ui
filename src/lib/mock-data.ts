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
};

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
  address: string;
  sessionId: string;
  hashrate: number;
  shares: number;
  bestDifficulty: number;
  uptimeSeconds: number | null;
  lastSeen: string | null;
  startTime: string | null;
  tempC: number | null;
  dashboardUrl: string | null;
  blocksFound: number;
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
};

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** 24h × 30m buckets — used when the pool has no hashrate history yet. */
export function buildZeroChart(hours = 24, intervalMinutes = 30): ChartPoint[] {
  const points: ChartPoint[] = [];
  const now = Date.now();
  const steps = Math.max(1, Math.round((hours * 60) / intervalMinutes));
  for (let i = steps; i >= 1; i -= 1) {
    points.push({
      label: new Date(now - i * intervalMinutes * 60 * 1000).toISOString(),
      data: 0,
    });
  }
  return points;
}

function buildMockChart(): ChartPoint[] {
  return buildZeroChart(168, 60).map((point, index) => {
    const base = 5.2e14;
    const wobble = Math.sin(index / 4) * 4e13 + Math.cos(index / 7) * 2e13;
    return {
      ...point,
      data: Math.max(0, base + wobble),
    };
  });
}

export const mockDashboard: DashboardPayload = {
  source: "mock",
  pool: {
    totalHashRate: 5.4e14,
    blockHeight: 902_184,
    totalMiners: 4,
    blocksFound: 1,
    bestDifficulty: 263_293_310_516.64395,
    fee: 0,
  },
  chart: buildMockChart(),
  chartSince: hoursAgo(168),
  network: {
    height: 902_184,
    nextHeight: 902_185,
    difficulty: 116_960_061_420_154.6,
    networkHashrate: 8.92e20,
    chain: "main",
    minFeeBtcKvB: 1e-8,
    currentBlockWeight: 3_992_140,
    currentBlockTx: 3_210,
    pooledTx: 4_800,
  },
  difficultyAdjustment: {
    progressPercent: 42.5,
    difficultyChange: 2.74,
    previousRetarget: -5.0,
    remainingBlocks: 1158,
    nextRetargetHeight: 903_168,
    estimatedRetargetDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    timeAvgMs: 585_000,
    expectedBlocks: 820,
  },
  uptimeSeconds: 86_400 * 3 + 5 * 3600,
  foundBlocks: [
    {
      height: 901_002,
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      worker: "nerdqaxe-1",
    },
  ],
  workers: [
    {
      id: "1",
      name: "nerdqaxe-1",
      userAgent: "NerdQAxe++",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      sessionId: "a1f3",
      hashrate: 1.35e12,
      shares: 18_420,
      bestDifficulty: 68_274_102,
      uptimeSeconds: 86_400 * 3,
      lastSeen: new Date(Date.now() - 8_000).toISOString(),
      startTime: hoursAgo(72),
      tempC: 58,
      dashboardUrl: "http://192.168.1.51",
      blocksFound: 0,
    },
    {
      id: "2",
      name: "nerdqaxe-2",
      userAgent: "NerdQAxe++",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      sessionId: "b2c4",
      hashrate: 1.32e12,
      shares: 14_110,
      bestDifficulty: 41_002_110,
      uptimeSeconds: 86_400 * 2,
      lastSeen: new Date(Date.now() - 12_000).toISOString(),
      startTime: hoursAgo(48),
      tempC: 61,
      dashboardUrl: "http://192.168.1.52",
      blocksFound: 0,
    },
    {
      id: "3",
      name: "nerdqaxe-3",
      userAgent: "NerdQAxe++",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      sessionId: "c3d5",
      hashrate: 1.28e12,
      shares: 22_880,
      bestDifficulty: 22_441_200,
      uptimeSeconds: 86_400 * 5,
      lastSeen: new Date(Date.now() - 5_000).toISOString(),
      startTime: hoursAgo(120),
      tempC: 55,
      dashboardUrl: "http://192.168.1.53",
      blocksFound: 0,
    },
    {
      id: "4",
      name: "nerdqaxe-4",
      userAgent: "NerdQAxe++",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      sessionId: "d4e6",
      hashrate: 1.4e12,
      shares: 9_640,
      bestDifficulty: 12_845_023,
      uptimeSeconds: 86_400 * 1,
      lastSeen: new Date(Date.now() - 3_000).toISOString(),
      startTime: hoursAgo(26),
      tempC: 63,
      dashboardUrl: "http://192.168.1.54",
      blocksFound: 0,
    },
  ],
  minerCharts: [
    {
      id: "1",
      name: "nerdqaxe-1",
      chart: buildMockChart().map((p) => ({ ...p, data: p.data * 0.25 })),
    },
    {
      id: "2",
      name: "nerdqaxe-2",
      chart: buildMockChart().map((p) => ({ ...p, data: p.data * 0.24 })),
    },
    {
      id: "3",
      name: "nerdqaxe-3",
      chart: buildMockChart().map((p) => ({ ...p, data: p.data * 0.23 })),
    },
    {
      id: "4",
      name: "nerdqaxe-4",
      chart: buildMockChart().map((p) => ({ ...p, data: p.data * 0.26 })),
    },
  ],
};
