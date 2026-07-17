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

const DEMO_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
const CHART_HOURS = 168;
const CHART_INTERVAL_MINUTES = 10;

type MockMinerSeed = {
  id: string;
  name: string;
  userAgent: string;
  sessionId: string;
  hashrate: number;
  shares: number;
  bestDifficulty: number;
  uptimeHours: number;
  tempC: number;
  dashboardHost?: string;
  phase: number;
};

const MOCK_MINER_SEEDS: MockMinerSeed[] = [
  {
    id: "1",
    name: "nerdqaxe-kitchen",
    userAgent: "NerdQAxe++",
    sessionId: "a1f3",
    hashrate: 1.38e12,
    shares: 18_420,
    bestDifficulty: 68_274_102,
    uptimeHours: 72,
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
    bestDifficulty: 41_002_110,
    uptimeHours: 48,
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
    bestDifficulty: 118_440_200,
    uptimeHours: 120,
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
    bestDifficulty: 12_845_023,
    uptimeHours: 26,
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
    bestDifficulty: 9_812_004,
    uptimeHours: 64,
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
    bestDifficulty: 18_331_900,
    uptimeHours: 88,
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
    bestDifficulty: 6_204_880,
    uptimeHours: 34,
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
    bestDifficulty: 4_992_110,
    uptimeHours: 52,
    tempC: 59,
    dashboardHost: "192.168.1.58",
    phase: 7.5,
  },
  {
    id: "9",
    name: "apollo-ii",
    userAgent: "Apollo II",
    sessionId: "j9k1",
    hashrate: 4.8e11,
    shares: 6_540,
    bestDifficulty: 3_771_220,
    uptimeHours: 41,
    tempC: 62,
    dashboardHost: "192.168.1.59",
    phase: 8.4,
  },
  {
    id: "10",
    name: "lv06-closet",
    userAgent: "Lucky Miner LV06",
    sessionId: "k0l2",
    hashrate: 3.5e11,
    shares: 5_120,
    bestDifficulty: 2_118_440,
    uptimeHours: 29,
    tempC: 68,
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
    bestDifficulty: 892_110_000,
    uptimeHours: 96,
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
    bestDifficulty: 1_420_880_000,
    uptimeHours: 110,
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
    bestDifficulty: 980_440_000,
    uptimeHours: 84,
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
    bestDifficulty: 14_220_000,
    uptimeHours: 56,
    tempC: 56,
    dashboardHost: "192.168.1.61",
    phase: 13.3,
  },
  {
    id: "15",
    name: "braiins-os-s19",
    userAgent: "Braiins OS",
    sessionId: "q5r7",
    hashrate: 3.1e13,
    shares: 19_420,
    bestDifficulty: 156_880_000,
    uptimeHours: 73,
    tempC: 51,
    phase: 14.6,
  },
];

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** Default empty chart: N hours × interval buckets (matches live pool slots). */
export function buildZeroChart(hours = 24, intervalMinutes = 10): ChartPoint[] {
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

function buildMinerHashrateChart(hashrate: number, phase: number): ChartPoint[] {
  const points = buildZeroChart(CHART_HOURS, CHART_INTERVAL_MINUTES);
  const steps = points.length;

  return points.map((point, index) => {
    const progress = index / Math.max(1, steps - 1);
    const ramp = 0.72 + 0.28 * progress;
    const wobble =
      1 +
      0.06 * Math.sin(index / 4 + phase) +
      0.03 * Math.cos(index / 11 + phase);
    const isLast = index === steps - 1;
    const value = isLast ? hashrate : hashrate * ramp * wobble;

    return {
      ...point,
      data: Math.max(0, value),
    };
  });
}

function sumCharts(series: MinerChartSeries[]): ChartPoint[] {
  if (series.length === 0) return buildZeroChart(CHART_HOURS, CHART_INTERVAL_MINUTES);

  const length = series[0].chart.length;
  return Array.from({ length }, (_, index) => {
    const label = series[0].chart[index]?.label ?? new Date().toISOString();
    const data = series.reduce(
      (sum, miner) => sum + (Number(miner.chart[index]?.data) || 0),
      0,
    );
    return { label, data };
  });
}

function buildMockWorkers(now = Date.now()): Worker[] {
  return MOCK_MINER_SEEDS.map((miner, index) => ({
    id: miner.id,
    name: miner.name,
    userAgent: miner.userAgent,
    address: DEMO_ADDRESS,
    sessionId: miner.sessionId,
    hashrate: miner.hashrate,
    shares: miner.shares,
    bestDifficulty: miner.bestDifficulty,
    uptimeSeconds: miner.uptimeHours * 3600,
    lastSeen: new Date(now - (3_000 + index * 1_500)).toISOString(),
    startTime: hoursAgo(miner.uptimeHours),
    tempC: miner.tempC,
    dashboardUrl: miner.dashboardHost ? `http://${miner.dashboardHost}` : null,
    blocksFound: 0,
  }));
}

/** Coherent demo payload — worker hashrates, miner charts, and pool total all align. */
export function buildMockDashboard(): DashboardPayload {
  const minerCharts: MinerChartSeries[] = MOCK_MINER_SEEDS.map((miner) => ({
    id: miner.id,
    name: miner.name,
    chart: buildMinerHashrateChart(miner.hashrate, miner.phase),
  }));
  const chart = sumCharts(minerCharts);
  const workers = buildMockWorkers();
  const totalHashRate = workers.reduce((sum, worker) => sum + worker.hashrate, 0);
  const bestDifficulty = Math.max(...workers.map((worker) => worker.bestDifficulty));
  const blockHeight = 918_742;

  return {
    source: "mock",
    pool: {
      totalHashRate,
      blockHeight,
      totalMiners: workers.length,
      blocksFound: 1,
      bestDifficulty,
      fee: 0,
    },
    chart,
    chartSince: hoursAgo(CHART_HOURS),
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
    uptimeSeconds: 86_400 * 7,
    foundBlocks: [
      {
        height: blockHeight - 17_740,
        address: DEMO_ADDRESS,
        worker: "nerdqaxe-kitchen",
      },
    ],
    workers,
    minerCharts,
  };
}

/** Static snapshot for imports/tests; prefer buildMockDashboard() at runtime. */
export const mockDashboard: DashboardPayload = buildMockDashboard();
