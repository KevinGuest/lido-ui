export function hashSuffix(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0 H/s";
  const units = ["H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s"];
  let v = value;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i += 1;
  }
  return `${v.toFixed(v >= 100 ? 0 : 2)} ${units[i]}`;
}

export function numberSuffix(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value <= 0) return "0";
  const units = ["", "K", "M", "G", "T", "P", "E"];
  const power = Math.min(units.length - 1, Math.floor(Math.log10(value) / 3));
  const scaled = value / Math.pow(1000, Math.max(0, power));
  return `${scaled.toFixed(2)}${units[Math.max(0, power)]}`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(delta)) return "n/a";
  const s = Math.max(0, Math.floor(delta / 1000));
  if (s < 60) return "<1 min ago";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  const remDays = d % 7;
  if (remDays === 0) return `${w}w ago`;
  return `${w}w ${remDays}d ago`;
}

export function feeRateSats(btcPerKvB: number): string {
  if (!Number.isFinite(btcPerKvB) || btcPerKvB <= 0) return "n/a";
  // getmininginfo.blockmintxfee is BTC/kvB → sats/vB
  const satsPerVb = (btcPerKvB * 1e8) / 1000;
  if (satsPerVb >= 10) return `${satsPerVb.toFixed(0)} sat/vB`;
  if (satsPerVb >= 1) return `${satsPerVb.toFixed(1)} sat/vB`;
  return `${satsPerVb.toFixed(3)} sat/vB`;
}
