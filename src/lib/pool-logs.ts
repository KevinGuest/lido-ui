export type PoolLogLevel = "log" | "warn" | "error" | "info";

export type PoolLogLine = {
  id: string;
  ts: number;
  level: PoolLogLevel;
  message: string;
};

const IS_DEMO = process.env.NEXT_PUBLIC_LIDO_DEMO === "true";

const DEMO_TEMPLATES = [
  { level: "info" as const, message: "[SV2] Extended channel 3 open for bc1q…demo.nerdqaxe-kitchen diff=8192" },
  { level: "log" as const, message: "getblocktemplate tx count: 2841" },
  { level: "log" as const, message: "[SV1] Accepted share from bitaxe-gamma (diff 4096)" },
  { level: "info" as const, message: "Loaded persisted SV2 authority key from DB/sv2-authority.privkey" },
  { level: "warn" as const, message: "[SV2] difficulty retarget channel 3: 8192 → 16384" },
  { level: "log" as const, message: "Client heartbeat nerdqaxe-kitchen hashRate=5.73e12" },
  { level: "error" as const, message: "Telegram polling failed: timeout of 10000ms exceeded (demo)" },
  { level: "log" as const, message: "[SV1] New job broadcast height=883512" },
  { level: "info" as const, message: "Notifications: discord=on telegram=on events=connect,disconnect,best,block" },
  { level: "log" as const, message: "Soft-deleted stale session bitaxe-spare (no heartbeat 120s)" },
];

let demoSeq = 0;

export function createDemoLogLine(now = Date.now()): PoolLogLine {
  const template = DEMO_TEMPLATES[demoSeq % DEMO_TEMPLATES.length];
  demoSeq += 1;
  return {
    id: `demo-${now}-${demoSeq}`,
    ts: now,
    level: template.level,
    message: template.message,
  };
}

export function seedDemoLogLines(count = 24): PoolLogLine[] {
  const now = Date.now();
  const lines: PoolLogLine[] = [];
  for (let i = count; i > 0; i -= 1) {
    lines.push(createDemoLogLine(now - i * 4_500));
  }
  return lines;
}

export async function fetchRecentPoolLogs(limit = 200): Promise<PoolLogLine[]> {
  if (IS_DEMO) return seedDemoLogLines(Math.min(limit, 40));

  const response = await fetch(`/api/logs?limit=${limit}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Logs failed (${response.status})`);
  }
  const data = (await response.json()) as { lines?: PoolLogLine[] };
  return data.lines ?? [];
}

export function downloadPoolLogs(lines: PoolLogLine[], filename = "lido-pool.log") {
  const body = lines
    .map((line) => {
      const time = new Date(line.ts).toISOString();
      return `${time} [${line.level.toUpperCase()}] ${line.message}`;
    })
    .join("\n");
  const blob = new Blob([body + "\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function isDemoLogs(): boolean {
  return IS_DEMO;
}
