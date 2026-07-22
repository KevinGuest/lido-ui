import { isPublicDeployment } from "@/lib/app-meta";

/** Umbrel App Store / community package host ports. */
export const UMBREL_STRATUM_V1_PORT = 2301;
export const UMBREL_STRATUM_V2_PORT = 2302;

/** Public hosted pool (lido.wtf) host ports. */
export const PUBLIC_STRATUM_V1_PORT = 3333;
export const PUBLIC_STRATUM_V2_PORT = 4444;

function usePublicStratumPorts(): boolean {
  return isPublicDeployment();
}

/** Active Stratum V1 port for this deployment. */
export function stratumV1Port(): number {
  return usePublicStratumPorts() ? PUBLIC_STRATUM_V1_PORT : UMBREL_STRATUM_V1_PORT;
}

/** Active Stratum V2 port for this deployment. */
export function stratumV2Port(): number {
  return usePublicStratumPorts() ? PUBLIC_STRATUM_V2_PORT : UMBREL_STRATUM_V2_PORT;
}

/** @deprecated Prefer stratumV1Port() — value is fixed at module load. */
export const STRATUM_V1_PORT = UMBREL_STRATUM_V1_PORT;
/** @deprecated Prefer stratumV2Port() — value is fixed at module load. */
export const STRATUM_V2_PORT = UMBREL_STRATUM_V2_PORT;

/** Hostnames that should be replaced with the browser host when they differ. */
const GENERIC_STRATUM_HOSTS = new Set([
  "umbrel.local",
  "umbrel",
  "localhost",
  "127.0.0.1",
]);

export function stratumPortFromConfigured(configured: string): number {
  const match = configured.trim().match(/:(\d+)$/);
  if (!match) return stratumV1Port();
  const port = parseInt(match[1], 10);
  return Number.isFinite(port) ? port : stratumV1Port();
}

/** Replace or append the port on a host:port stratum endpoint. */
export function withStratumPort(endpoint: string, port: number): string {
  const trimmed = endpoint.trim();
  if (!trimmed) return `localhost:${port}`;
  const host = trimmed.replace(/:\d+$/, "");
  return `${host}:${port}`;
}

/**
 * Stratum URL for the Connect dialog — uses the host you opened the dashboard on
 * (IP, .local, Tailscale, etc.) unless an operator configured a distinct stratum host.
 * Public builds keep an explicit PUBLIC_POOL_STRATUM_URL (e.g. lido.wtf:3333).
 */
export function resolveStratumEndpoint(
  browserHostname: string,
  configured = "",
): string {
  const trimmed = configured.trim();
  const port = stratumPortFromConfigured(trimmed);
  const host = browserHostname.trim() || "localhost";

  if (!trimmed) {
    return `${host}:${port}`;
  }

  const configuredHost = trimmed.split(":")[0]?.toLowerCase() ?? "";

  if (
    GENERIC_STRATUM_HOSTS.has(configuredHost) &&
    configuredHost !== host.toLowerCase()
  ) {
    return `${host}:${port}`;
  }

  if (configuredHost === host.toLowerCase()) {
    return `${host}:${port}`;
  }

  return trimmed.includes(":") ? trimmed : `${trimmed}:${port}`;
}

/**
 * Umbrel App Store URL for the host you opened the dashboard on
 * (IP, .local, Tailscale, etc.).
 */
export function resolveUmbrelAppStoreUrl(
  browserHostname: string,
  protocol: string = "http:",
): string {
  const host = browserHostname.trim() || "umbrel.local";
  const proto = protocol === "https:" ? "https:" : "http:";
  return `${proto}//${host}/app-store`;
}
