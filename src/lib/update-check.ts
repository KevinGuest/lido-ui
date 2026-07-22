import type { DeploymentKind } from "@/lib/app-meta";
import { UMBREL_APP_URL } from "@/lib/app-meta";

export type LatestRelease = {
  tag: string;
  name: string;
  url: string;
};

const UI_RELEASES_API_URL =
  "https://api.github.com/repos/KevinGuest/lido-ui/releases/latest";

/** Community Umbrel package manifest — source of truth for Umbrel app version. */
const UMBREL_APP_MANIFEST_URL =
  "https://raw.githubusercontent.com/KevinGuest/lido-app/main/lido-app/umbrel-app.yml";

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

function parseUmbrelManifestVersion(yaml: string): string | null {
  const match = yaml.match(/^\s*version:\s*["']?([^"'\s#]+)/m);
  const tag = match?.[1]?.trim();
  return tag || null;
}

async function fetchLatestUmbrelAppRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(UMBREL_APP_MANIFEST_URL, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const yaml = await response.text();
    const tag = parseUmbrelManifestVersion(yaml);
    if (!tag) return null;
    return {
      tag,
      name: `Lido ${tag}`,
      url: UMBREL_APP_URL,
    };
  } catch {
    return null;
  }
}

async function fetchLatestUiRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(UI_RELEASES_API_URL, {
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

/** Umbrel tracks lido-app; self-hosted tracks lido-ui releases. */
export async function fetchLatestRelease(
  deployment: DeploymentKind = "self-hosted",
): Promise<LatestRelease | null> {
  if (deployment === "umbrel") return fetchLatestUmbrelAppRelease();
  return fetchLatestUiRelease();
}
