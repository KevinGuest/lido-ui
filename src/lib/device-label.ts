const DEVICE_LABEL_MAX = 20;

/** Display label for a miner user-agent / device string (max 20 chars). */
export function deviceLabel(userAgent: string | null | undefined): string {
  const raw = (userAgent ?? "").trim();
  if (!raw) return "Unknown";
  const cleaned = raw.replace(/\/sv2$/i, "").trim() || "Unknown";
  return cleaned.length > DEVICE_LABEL_MAX
    ? cleaned.slice(0, DEVICE_LABEL_MAX)
    : cleaned;
}

export function deviceGroupKey(userAgent: string | null | undefined): string {
  return deviceLabel(userAgent).toLowerCase();
}

/** Path segment for `/device/[device]` (encodeURIComponent of the group key). */
export function deviceRouteSlug(userAgentOrKey: string | null | undefined): string {
  const key = deviceGroupKey(userAgentOrKey);
  return encodeURIComponent(key);
}

export function deviceKeyFromRouteSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
}
