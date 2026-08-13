export const ACTIVITY_CARDS_STORAGE_KEY = "lido-activity-cards";

export const FIAT_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "NZD",
  "BRL",
  "KRW",
  "INR",
  "SGD",
  "HKD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "ZAR",
  "MXN",
  "CNY",
] as const;

export type FiatCurrency = (typeof FIAT_CURRENCIES)[number];

export type ActivityCardId =
  | "uptime"
  | "hashrate"
  | "bestDifficulty"
  | "networkDifficulty"
  | "blocksFound"
  | "connectedMiners"
  | "shares"
  | "blockHeight"
  | "networkHashrate"
  | "avgTxFee"
  | "temperature"
  | "wattage"
  | "btcPrice"
  | "satsPerFiat";

export type ActivityCardGroup = "pool" | "chain" | "device" | "market";

export type ActivityCardDef = {
  id: ActivityCardId;
  label: string;
  group: ActivityCardGroup;
  /** Home/LAN only — hide on public (no miner HTTP). */
  deviceOnly?: boolean;
  /** Needs a fiat price feed (mempool.space on public/demo). */
  needsPrice?: boolean;
};

export const ACTIVITY_CARD_CATALOG: ActivityCardDef[] = [
  { id: "uptime", label: "Uptime", group: "pool" },
  { id: "hashrate", label: "Total hashrate", group: "pool" },
  { id: "bestDifficulty", label: "Best difficulty", group: "pool" },
  { id: "blocksFound", label: "Blocks found", group: "pool" },
  { id: "connectedMiners", label: "Connected miners", group: "pool" },
  { id: "shares", label: "Shares", group: "pool" },
  { id: "networkDifficulty", label: "Network difficulty", group: "chain" },
  { id: "blockHeight", label: "Block height", group: "chain" },
  { id: "networkHashrate", label: "Network hashrate", group: "chain" },
  { id: "avgTxFee", label: "Average tx fee", group: "chain" },
  { id: "temperature", label: "Temperature", group: "device", deviceOnly: true },
  { id: "wattage", label: "Wattage", group: "device", deviceOnly: true },
  { id: "btcPrice", label: "BTC price", group: "market", needsPrice: true },
  { id: "satsPerFiat", label: "Sats per unit", group: "market", needsPrice: true },
];

export const DEFAULT_ACTIVITY_CARD_IDS: ActivityCardId[] = [
  "uptime",
  "hashrate",
  "bestDifficulty",
  "networkDifficulty",
  "blocksFound",
];

export const DEFAULT_FIAT: FiatCurrency = "USD";

export type ActivityCardLayout = {
  order: ActivityCardId[];
  fiat: FiatCurrency;
};

const CARD_IDS = new Set<string>(ACTIVITY_CARD_CATALOG.map((card) => card.id));
const FIAT_SET = new Set<string>(FIAT_CURRENCIES);

export function isActivityCardId(value: string): value is ActivityCardId {
  return CARD_IDS.has(value);
}

export function isFiatCurrency(value: string): value is FiatCurrency {
  return FIAT_SET.has(value);
}

export type ActivityCardAvailability = {
  device: boolean;
  prices: boolean;
};

export function cardIsAvailable(
  def: ActivityCardDef,
  availability: ActivityCardAvailability,
): boolean {
  if (def.deviceOnly && !availability.device) return false;
  if (def.needsPrice && !availability.prices) return false;
  return true;
}

export function sanitizeLayout(
  layout: ActivityCardLayout,
  availability: ActivityCardAvailability,
): ActivityCardLayout {
  const fiat = isFiatCurrency(layout.fiat) ? layout.fiat : DEFAULT_FIAT;
  const seen = new Set<ActivityCardId>();
  const order = layout.order.filter((id) => {
    if (!isActivityCardId(id) || seen.has(id)) return false;
    const def = ACTIVITY_CARD_CATALOG.find((card) => card.id === id);
    if (!def || !cardIsAvailable(def, availability)) return false;
    seen.add(id);
    return true;
  });
  return {
    fiat,
    order: order.length > 0 ? order : [...DEFAULT_ACTIVITY_CARD_IDS],
  };
}

export function readActivityCardLayout(
  availability: ActivityCardAvailability,
): ActivityCardLayout {
  if (typeof window === "undefined") {
    return { order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT };
  }
  try {
    const raw = localStorage.getItem(ACTIVITY_CARDS_STORAGE_KEY);
    if (!raw) {
      return { order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT };
    }
    const parsed = JSON.parse(raw) as Partial<ActivityCardLayout>;
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((id): id is ActivityCardId => typeof id === "string" && isActivityCardId(id))
      : [...DEFAULT_ACTIVITY_CARD_IDS];
    const fiat =
      typeof parsed.fiat === "string" && isFiatCurrency(parsed.fiat)
        ? parsed.fiat
        : DEFAULT_FIAT;
    return sanitizeLayout({ order, fiat }, availability);
  } catch {
    return { order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT };
  }
}

export const ACTIVITY_CARDS_CHANGE_EVENT = "lido-activity-cards-change";

export function writeActivityCardLayout(layout: ActivityCardLayout) {
  try {
    localStorage.setItem(
      ACTIVITY_CARDS_STORAGE_KEY,
      JSON.stringify({ order: layout.order, fiat: layout.fiat }),
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(ACTIVITY_CARDS_CHANGE_EVENT));
    }
  } catch {
    // Ignore quota / private mode.
  }
}

export function subscribeActivityCardLayout(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ACTIVITY_CARDS_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ACTIVITY_CARDS_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getActivityCardLayoutSnapshot() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(ACTIVITY_CARDS_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getActivityCardLayoutServerSnapshot() {
  return "";
}

export function parseActivityCardLayoutSnapshot(
  raw: string,
  availability: ActivityCardAvailability,
): ActivityCardLayout {
  if (!raw) {
    return { order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ActivityCardLayout>;
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter(
          (id): id is ActivityCardId => typeof id === "string" && isActivityCardId(id),
        )
      : [...DEFAULT_ACTIVITY_CARD_IDS];
    const fiat =
      typeof parsed.fiat === "string" && isFiatCurrency(parsed.fiat)
        ? parsed.fiat
        : DEFAULT_FIAT;
    return sanitizeLayout({ order, fiat }, availability);
  } catch {
    return { order: [...DEFAULT_ACTIVITY_CARD_IDS], fiat: DEFAULT_FIAT };
  }
}

export function formatFiatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatSatsPerFiat(btcPrice: number, currency: string): string | null {
  if (!Number.isFinite(btcPrice) || btcPrice <= 0) return null;
  const sats = 1e8 / btcPrice;
  const digits = sats >= 100 ? 0 : sats >= 10 ? 1 : 2;
  return `${sats.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })} sats/${currency}`;
}

export function availableFiats(prices: Record<string, number> | null | undefined): FiatCurrency[] {
  if (!prices) return [];
  return FIAT_CURRENCIES.filter((code) => {
    const value = prices[code];
    return typeof value === "number" && Number.isFinite(value) && value > 0;
  });
}
