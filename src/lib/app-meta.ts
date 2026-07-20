export const APP_VERSION = process.env.NEXT_PUBLIC_LIDO_VERSION ?? "0.0.0";

export const GITHUB_RELEASES_URL = "https://github.com/KevinGuest/lido-ui/releases";
export const GITHUB_REPO_URL = "https://github.com/KevinGuest/lido-ui";
export const UMBREL_APP_URL = "https://github.com/KevinGuest/lido-app";

export type DeploymentKind = "demo" | "umbrel" | "self-hosted";

export function deploymentKind(): DeploymentKind {
  if (
    process.env.GITHUB_PAGES === "true" ||
    process.env.NEXT_PUBLIC_LIDO_DEMO === "true" ||
    process.env.LIDO_USE_MOCK === "true"
  ) {
    return "demo";
  }
  const api = (process.env.PUBLIC_POOL_API_URL ?? "").trim();
  if (api.includes("lido-app") || api.includes(":2299") || api.includes(":2019")) return "umbrel";
  return "self-hosted";
}

export function updateDestinationUrl(kind: DeploymentKind): string {
  return kind === "umbrel" ? UMBREL_APP_URL : GITHUB_RELEASES_URL;
}

export function updateDestinationLabel(kind: DeploymentKind): string {
  return kind === "umbrel" ? "Open Umbrel app repo" : "View GitHub releases";
}
