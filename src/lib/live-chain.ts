import type {
  DashboardPayload,
  DifficultyAdjustment,
  NetworkInfo,
} from "@/lib/mock-data";

const DEFAULT_MEMPOOL_API = "https://mempool.space/api";

export type LiveChainSnapshot = {
  height: number | null;
  difficulty: number | null;
  networkHashrate: number | null;
  minFeeBtcKvB: number | null;
  pooledTx: number | null;
  difficultyAdjustment: DifficultyAdjustment | null;
};

type MempoolDifficultyAdjustment = {
  progressPercent?: number;
  difficultyChange?: number;
  previousRetarget?: number;
  remainingBlocks?: number;
  nextRetargetHeight?: number;
  estimatedRetargetDate?: number;
  timeAvg?: number;
  expectedBlocks?: number;
};

type MempoolHashrate = {
  currentHashrate?: number;
  currentDifficulty?: number;
};

type MempoolStats = {
  count?: number;
};

type MempoolFees = {
  economyFee?: number;
  minimumFee?: number;
};

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json() as Promise<T>;
}

function mapDifficultyAdjustment(
  raw: MempoolDifficultyAdjustment,
): DifficultyAdjustment {
  return {
    progressPercent: Number(raw.progressPercent) || 0,
    difficultyChange: Number(raw.difficultyChange) || 0,
    previousRetarget: Number(raw.previousRetarget) || 0,
    remainingBlocks: Number(raw.remainingBlocks) || 0,
    nextRetargetHeight: Number(raw.nextRetargetHeight) || 0,
    estimatedRetargetDate: Number(raw.estimatedRetargetDate) || 0,
    timeAvgMs: Number(raw.timeAvg) || 0,
    expectedBlocks: Number(raw.expectedBlocks) || 0,
  };
}

/** Browser + server: live chain stats from mempool.space. */
export async function fetchLiveChainSnapshot(
  baseUrl = DEFAULT_MEMPOOL_API,
): Promise<LiveChainSnapshot> {
  const base = baseUrl.replace(/\/+$/, "") || DEFAULT_MEMPOOL_API;

  const [heightRaw, difficultyRaw, hashrateRaw, mempoolRaw, feesRaw] =
    await Promise.all([
      fetchJson<number>(`${base}/blocks/tip/height`).catch(() => null),
      fetchJson<MempoolDifficultyAdjustment>(`${base}/v1/difficulty-adjustment`).catch(
        () => null,
      ),
      fetchJson<MempoolHashrate>(`${base}/v1/mining/hashrate/3d`).catch(() => null),
      fetchJson<MempoolStats>(`${base}/mempool`).catch(() => null),
      fetchJson<MempoolFees>(`${base}/v1/fees/recommended`).catch(() => null),
    ]);

  const height = Number(heightRaw);
  const difficulty = Number(hashrateRaw?.currentDifficulty);
  const networkHashrate = Number(hashrateRaw?.currentHashrate);
  const minFeeSatVb = Number(feesRaw?.minimumFee ?? feesRaw?.economyFee);
  const pooledTx = Number(mempoolRaw?.count);

  return {
    height: Number.isFinite(height) && height > 0 ? height : null,
    difficulty: Number.isFinite(difficulty) && difficulty > 0 ? difficulty : null,
    networkHashrate:
      Number.isFinite(networkHashrate) && networkHashrate > 0 ? networkHashrate : null,
    minFeeBtcKvB:
      Number.isFinite(minFeeSatVb) && minFeeSatVb > 0
        ? (minFeeSatVb * 1000) / 1e8
        : null,
    pooledTx: Number.isFinite(pooledTx) ? pooledTx : null,
    difficultyAdjustment: difficultyRaw ? mapDifficultyAdjustment(difficultyRaw) : null,
  };
}

export function applyLiveChainSnapshot(
  dashboard: DashboardPayload,
  live: LiveChainSnapshot,
): DashboardPayload {
  const blockHeight = live.height ?? dashboard.network.height;
  const network: NetworkInfo = {
    ...dashboard.network,
    height: blockHeight,
    nextHeight: blockHeight + 1,
    difficulty: live.difficulty ?? dashboard.network.difficulty,
    networkHashrate: live.networkHashrate ?? dashboard.network.networkHashrate,
    chain: "main",
    minFeeBtcKvB: live.minFeeBtcKvB ?? dashboard.network.minFeeBtcKvB,
    pooledTx: live.pooledTx ?? dashboard.network.pooledTx,
  };

  return {
    ...dashboard,
    pool: {
      ...dashboard.pool,
      blockHeight,
    },
    network,
    difficultyAdjustment: live.difficultyAdjustment ?? dashboard.difficultyAdjustment,
    foundBlocks: dashboard.foundBlocks.map((block, index) => ({
      ...block,
      height: Math.max(1, blockHeight - 17_740 - index),
    })),
  };
}
