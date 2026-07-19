export type NotificationEventKey =
  | "minerConnect"
  | "minerDisconnect"
  | "bestDifficulty"
  | "blockFound"
  | "minerStruggling";

export type NotificationEvents = Record<NotificationEventKey, boolean>;

export type PoolDigestUnit = "off" | "hours" | "weeks" | "months";

export type PoolDigestConfig = {
  unit: PoolDigestUnit;
  every: number;
};

export type DiscordNotificationConfig = {
  enabled: boolean;
  configured: boolean;
  webhookUrl: string;
  events: NotificationEvents;
  poolDigest: PoolDigestConfig;
};

export type TelegramNotificationConfig = {
  enabled: boolean;
  configured: boolean;
  botToken: string;
  chatId: string;
  events: NotificationEvents;
  poolDigest: PoolDigestConfig;
};

export type NotificationSettings = {
  enabled: boolean;
  locked: boolean;
  discord: DiscordNotificationConfig;
  telegram: TelegramNotificationConfig;
};

export const NOTIFICATION_EVENT_META: {
  key: NotificationEventKey;
  label: string;
  description: string;
}[] = [
  {
    key: "minerConnect",
    label: "Miner connects",
    description: "When a worker opens a stratum session.",
  },
  {
    key: "minerDisconnect",
    label: "Miner disconnects",
    description: "When a worker drops or is soft-deleted offline.",
  },
  {
    key: "bestDifficulty",
    label: "New best difficulty",
    description: "When a share beats the pool or worker best.",
  },
  {
    key: "blockFound",
    label: "Block found",
    description: "When Lido submits a candidate block.",
  },
  {
    key: "minerStruggling",
    label: "Miner struggling",
    description:
      "When a miner stops submitting enough shares and Lido lowers stratum difficulty.",
  },
];

export const POOL_DIGEST_OPTIONS: {
  value: PoolDigestUnit;
  label: string;
}[] = [
  { value: "off", label: "Off" },
  { value: "hours", label: "Hourly" },
  { value: "weeks", label: "Weekly" },
  { value: "months", label: "Monthly" },
];

export function defaultPoolDigest(): PoolDigestConfig {
  return { unit: "off", every: 1 };
}

export function formatPoolDigest(digest: PoolDigestConfig): string {
  if (!digest || digest.unit === "off") return "Off";
  const n = Math.max(1, Math.floor(digest.every) || 1);
  if (digest.unit === "hours") return n === 1 ? "Every hour" : `Every ${n} hours`;
  if (digest.unit === "weeks") return n === 1 ? "Every week" : `Every ${n} weeks`;
  return n === 1 ? "Every month" : `Every ${n} months`;
}

/** Labels for digest embeds based on the selected schedule. */
export function formatPoolDigestPeriod(digest: PoolDigestConfig): {
  title: string;
  action: string;
  periodLabel: string;
} {
  if (!digest || digest.unit === "off") {
    return {
      title: "Pool digest",
      action: "Lido pool summary.",
      periodLabel: "All time",
    };
  }
  const n = Math.max(1, Math.floor(Number(digest.every) || 1));
  if (digest.unit === "hours") {
    return {
      title: n === 1 ? "Hourly pool digest" : `Pool digest (every ${n} hours)`,
      action: n === 1 ? "Summary for the last hour." : `Summary for the last ${n} hours.`,
      periodLabel: n === 1 ? "Last hour" : `Last ${n} hours`,
    };
  }
  if (digest.unit === "weeks") {
    return {
      title: n === 1 ? "Weekly pool digest" : `Pool digest (every ${n} weeks)`,
      action: n === 1 ? "Summary for the last week." : `Summary for the last ${n} weeks.`,
      periodLabel: n === 1 ? "Last week" : `Last ${n} weeks`,
    };
  }
  return {
    title: n === 1 ? "Monthly pool digest" : `Pool digest (every ${n} months)`,
    action: n === 1 ? "Summary for the last month." : `Summary for the last ${n} months.`,
    periodLabel: n === 1 ? "Last month" : `Last ${n} months`,
  };
}

export function defaultNotificationEvents(): NotificationEvents {
  return {
    minerConnect: true,
    minerDisconnect: true,
    bestDifficulty: true,
    blockFound: true,
    minerStruggling: true,
  };
}

/** Demo: clickable UI; paste a real webhook/token to try Test for real. */
export const DEMO_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  locked: false,
  discord: {
    enabled: false,
    configured: false,
    webhookUrl: "",
    events: {
      minerConnect: true,
      minerDisconnect: false,
      bestDifficulty: true,
      blockFound: true,
      minerStruggling: true,
    },
    poolDigest: { unit: "off", every: 1 },
  },
  telegram: {
    enabled: false,
    configured: false,
    botToken: "",
    chatId: "",
    events: {
      minerConnect: false,
      minerDisconnect: true,
      bestDifficulty: true,
      blockFound: true,
      minerStruggling: false,
    },
    poolDigest: { unit: "off", every: 1 },
  },
};

export function emptyNotificationSettings(): NotificationSettings {
  return {
    enabled: false,
    locked: false,
    discord: {
      enabled: false,
      configured: false,
      webhookUrl: "",
      events: defaultNotificationEvents(),
      poolDigest: defaultPoolDigest(),
    },
    telegram: {
      enabled: false,
      configured: false,
      botToken: "",
      chatId: "",
      events: defaultNotificationEvents(),
      poolDigest: defaultPoolDigest(),
    },
  };
}

function normalizeEvents(raw: unknown, fallback: NotificationEvents): NotificationEvents {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<NotificationEvents>;
  return {
    minerConnect:
      typeof src.minerConnect === "boolean" ? src.minerConnect : fallback.minerConnect,
    minerDisconnect:
      typeof src.minerDisconnect === "boolean"
        ? src.minerDisconnect
        : fallback.minerDisconnect,
    bestDifficulty:
      typeof src.bestDifficulty === "boolean"
        ? src.bestDifficulty
        : fallback.bestDifficulty,
    blockFound: typeof src.blockFound === "boolean" ? src.blockFound : fallback.blockFound,
    minerStruggling:
      typeof src.minerStruggling === "boolean"
        ? src.minerStruggling
        : fallback.minerStruggling,
  };
}

function normalizeDigest(raw: unknown): PoolDigestConfig {
  if (typeof raw === "string") {
    switch (raw) {
      case "off":
        return { unit: "off", every: 1 };
      case "hourly":
        return { unit: "hours", every: 1 };
      case "daily":
        return { unit: "hours", every: 24 };
      case "every3days":
        return { unit: "hours", every: 72 };
      case "weekly":
        return { unit: "weeks", every: 1 };
      case "monthly":
        return { unit: "months", every: 1 };
      default:
        return defaultPoolDigest();
    }
  }
  if (raw && typeof raw === "object") {
    const obj = raw as { unit?: unknown; every?: unknown };
    const units: PoolDigestUnit[] = ["off", "hours", "weeks", "months"];
    const unit = units.includes(obj.unit as PoolDigestUnit)
      ? (obj.unit as PoolDigestUnit)
      : "off";
    const every = Math.max(1, Math.floor(Number(obj.every) || 1));
    return { unit, every: unit === "off" ? 1 : every };
  }
  return defaultPoolDigest();
}

/** Accept API payloads that still use a shared top-level `events` map. */
export function normalizeNotificationSettings(
  raw: NotificationSettings & { events?: NotificationEvents },
): NotificationSettings {
  const legacy = raw.events ? normalizeEvents(raw.events, defaultNotificationEvents()) : null;
  return {
    enabled: Boolean(raw.enabled),
    locked: Boolean(raw.locked),
    discord: {
      enabled: Boolean(raw.discord?.enabled),
      configured: Boolean(raw.discord?.configured),
      webhookUrl: String(raw.discord?.webhookUrl || ""),
      events: normalizeEvents(
        raw.discord?.events ?? legacy,
        defaultNotificationEvents(),
      ),
      poolDigest: normalizeDigest(raw.discord?.poolDigest),
    },
    telegram: {
      enabled: Boolean(raw.telegram?.enabled),
      configured: Boolean(raw.telegram?.configured),
      botToken: String(raw.telegram?.botToken || ""),
      chatId: String(raw.telegram?.chatId || ""),
      events: normalizeEvents(
        raw.telegram?.events ?? legacy,
        defaultNotificationEvents(),
      ),
      poolDigest: normalizeDigest(raw.telegram?.poolDigest),
    },
  };
}

const IS_DEMO = process.env.NEXT_PUBLIC_LIDO_DEMO === "true";

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  if (IS_DEMO) return structuredClone(DEMO_NOTIFICATION_SETTINGS);

  const response = await fetch("/api/notifications/settings", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Notifications settings failed (${response.status})`);
  }
  return normalizeNotificationSettings(await response.json());
}

export async function saveNotificationSettings(
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  if (IS_DEMO) {
    // Demo keeps changes in the browser only.
    return {
      ...settings,
      locked: false,
      discord: {
        ...settings.discord,
        configured: Boolean(settings.discord.webhookUrl.trim()),
      },
      telegram: {
        ...settings.telegram,
        configured: Boolean(
          settings.telegram.botToken.trim() && settings.telegram.chatId.trim(),
        ),
      },
    };
  }
  const response = await fetch("/api/notifications/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `Save failed (${response.status})`);
  }
  return normalizeNotificationSettings(await response.json());
}

const AVATAR_DARK =
  "https://raw.githubusercontent.com/KevinGuest/lido-ui/main/public/logo.png";
const AVATAR_LIGHT =
  "https://raw.githubusercontent.com/KevinGuest/lido-ui/main/public/logo-light.png";

function currentAvatarTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const EVENT_META: Record<string, { title: string; color: number; emoji: string }> = {
  minerConnect: { title: "Miner connected", color: 0x22c55e, emoji: "🟢" },
  minerDisconnect: { title: "Miner disconnected", color: 0xf59e0b, emoji: "🟠" },
  bestDifficulty: { title: "New best difficulty", color: 0x3b82f6, emoji: "📈" },
  blockFound: { title: "Block found", color: 0xeab308, emoji: "🏆" },
  minerStruggling: { title: "Miner struggling", color: 0xef4444, emoji: "⚠️" },
  poolDigest: { title: "Pool digest", color: 0x8b5cf6, emoji: "📊" },
  test: { title: "Connection test", color: 0x14b8a6, emoji: "🧪" },
};

type SampleMessage = {
  event: string;
  title?: string;
  worker?: string;
  device?: string;
  address?: string;
  protocol?: string;
  action: string;
  url?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

/** Single connection check — same payload real Test uses. */
function notificationConnectionTest(): SampleMessage {
  return {
    event: "test",
    action: "Connection is good — Lido can reach this channel.",
    fields: [{ name: "Status", value: "OK", inline: true }],
  };
}

function toDiscordEmbed(message: SampleMessage) {
  const meta = EVENT_META[message.event] || {
    title: message.event,
    color: 0x14b8a6,
    emoji: "🔔",
  };
  const fields = [
    ...(message.worker
      ? [{ name: "Worker", value: message.worker, inline: true }]
      : []),
    ...(message.device
      ? [{ name: "Device", value: message.device, inline: true }]
      : []),
    ...(message.address
      ? [{ name: "Address", value: message.address, inline: false }]
      : []),
    ...(message.protocol
      ? [
          {
            name: "Protocol",
            value: String(message.protocol).toUpperCase(),
            inline: true,
          },
        ]
      : []),
    ...(message.fields || []),
  ]
    .map((field) => {
      if (
        message.url &&
        field.name.toLowerCase() === "height" &&
        !field.value.includes("](")
      ) {
        return {
          ...field,
          value: `[${field.value}](${message.url})`,
        };
      }
      return field;
    })
    .slice(0, 25);

  return {
    title: formatEventTitle(message.event, message.title || meta.title).slice(0, 256),
    description: message.action.slice(0, 4000),
    color: meta.color,
    fields,
    timestamp: new Date().toISOString(),
    footer: { text: "Lido" },
  };
}

function formatEventTitle(event: string, title: string): string {
  const meta = EVENT_META[event];
  const emoji = meta?.emoji || "🔔";
  const trimmed = title.trim();
  if (!trimmed) {
    return `${emoji} ${meta?.title || "Lido"}`;
  }
  if (trimmed.startsWith(emoji)) {
    return trimmed;
  }
  if (/^\p{Extended_Pictographic}/u.test(trimmed)) {
    return trimmed;
  }
  return `${emoji} ${trimmed}`;
}

async function testDiscordDirect(
  webhookUrl: string,
  avatarTheme: "dark" | "light",
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Lido",
      avatar_url: avatarTheme === "light" ? AVATAR_LIGHT : AVATAR_DARK,
      embeds: [toDiscordEmbed(notificationConnectionTest())],
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Discord test failed (${response.status})`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Same HTML shape as the pool Telegram formatter (for demo / Next proxy). */
function formatTelegramHtml(message: SampleMessage): string {
  const heading = formatEventTitle(
    message.event,
    message.title || EVENT_META[message.event]?.title || "Lido",
  );
  let action = message.action;
  if (message.event === "minerStruggling") {
    action = action.replace(/\s*—\s*/, "\n");
  }
  const lines = [`<b>${escapeHtml(heading)}</b>`, escapeHtml(action), ""];
  if (message.worker) {
    lines.push(`Worker: <code>${escapeHtml(message.worker)}</code>`);
  }
  if (message.device) {
    lines.push(`Device: ${escapeHtml(message.device)}`);
  }
  if (message.address) {
    lines.push(`Address: <code>${escapeHtml(message.address)}</code>`);
  }
  if (message.protocol) {
    lines.push(`Protocol: ${escapeHtml(String(message.protocol).toUpperCase())}`);
  }
  for (const field of message.fields || []) {
    if (message.url && field.name.toLowerCase() === "height") {
      lines.push(
        `Height: <a href="${escapeHtml(message.url)}">${escapeHtml(field.value)}</a>`,
      );
      continue;
    }
    lines.push(`${escapeHtml(field.name)}: ${escapeHtml(field.value)}`);
  }
  lines.push("— Lido");
  return lines.join("\n");
}

/** Server-side connection check via Telegram Bot API (demo proxy). */
export async function sendTelegramConnectionTest(input: {
  botToken: string;
  chatId: string;
}): Promise<void> {
  const { botToken, chatId } = input;
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatTelegramHtml(notificationConnectionTest()),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      description?: string;
    };
    throw new Error(
      body.description || `Telegram send failed (${response.status})`,
    );
  }
}

async function testTelegramViaDemoApi(
  botToken: string,
  chatId: string,
): Promise<void> {
  const response = await fetch("/api/notifications/telegram-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botToken, chatId }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message || `Telegram test failed (${response.status})`);
  }
}

export async function testNotificationChannel(input: {
  channel: "discord" | "telegram";
  settings: NotificationSettings;
}): Promise<void> {
  const avatarTheme = currentAvatarTheme();
  const { channel, settings } = input;

  if (channel === "discord") {
    const webhookUrl = settings.discord.webhookUrl.trim();
    if (!webhookUrl) {
      throw new Error("Paste a Discord webhook URL first");
    }

    let apiAvailable = false;
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "discord",
          avatarTheme,
          discord: { webhookUrl },
        }),
      });
      if (response.ok) return;
      if (response.status !== 404 && response.status !== 502) {
        apiAvailable = true;
        const body = (await response.json().catch(() => ({}))) as {
          message?: string | string[];
        };
        const message = Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message;
        throw new Error(message || `Discord test failed (${response.status})`);
      }
    } catch (error) {
      if (apiAvailable) throw error;
      // Pool API missing (demo / Pages) — post the webhook from the browser.
    }

    await testDiscordDirect(webhookUrl, avatarTheme);
    return;
  }

  const botToken = settings.telegram.botToken.trim();
  const chatId = settings.telegram.chatId.trim();
  if (!botToken || !chatId) {
    throw new Error("Paste a Telegram bot token and chat ID first");
  }

  let apiAvailable = false;
  try {
    const response = await fetch("/api/notifications/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "telegram",
        telegram: { botToken, chatId },
      }),
    });
    if (response.ok) return;
    if (response.status !== 404 && response.status !== 502) {
      apiAvailable = true;
      const body = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
      };
      const message = Array.isArray(body.message)
        ? body.message.join(", ")
        : body.message;
      throw new Error(message || `Telegram test failed (${response.status})`);
    }
  } catch (error) {
    if (apiAvailable) throw error;
    // Pool API missing — use the Next demo proxy (Telegram blocks browser CORS).
  }

  await testTelegramViaDemoApi(botToken, chatId);
}
