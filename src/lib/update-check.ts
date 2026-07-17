export type LatestRelease = {
  tag: string;
  name: string;
  url: string;
};

const RELEASES_API_URL =
  "https://api.github.com/repos/KevinGuest/lido-ui/releases/latest";

const DISMISS_KEY = "lido-update-dismissed";

function parseVersion(tag: string): number[] {
  return tag
    .trim()
    .replace(/^v/i, "")
    .split(".")
    .map((part) => parseInt(part.replace(/[^0-9].*$/, ""), 10) || 0);
}

export function isNewerVersion(latestTag: string, currentTag: string): boolean {
  const latest = parseVersion(latestTag);
  const current = parseVersion(currentTag);
  const length = Math.max(latest.length, current.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (latest[i] ?? 0) - (current[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

export function dismissedUpdateTag(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

export function dismissUpdateTag(tag: string) {
  try {
    localStorage.setItem(DISMISS_KEY, tag);
  } catch {
    // Ignore storage errors.
  }
}

export async function fetchLatestRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(RELEASES_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      tag_name?: string;
      name?: string;
      html_url?: string;
    };

    if (!data.tag_name || !data.html_url) return null;

    return {
      tag: data.tag_name,
      name: data.name?.trim() || data.tag_name,
      url: data.html_url,
    };
  } catch {
    return null;
  }
}
