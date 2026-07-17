const DEFAULT_STRATUM_PORT = 3333;

/** Hostnames that should be replaced with the browser host when they differ. */
const GENERIC_STRATUM_HOSTS = new Set([
  "umbrel.local",
  "umbrel",
  "localhost",
  "127.0.0.1",
]);

export function stratumPortFromConfigured(configured: string): number {
  const match = configured.trim().match(/:(\d+)$/);
  if (!match) return DEFAULT_STRATUM_PORT;
  const port = parseInt(match[1], 10);
  return Number.isFinite(port) ? port : DEFAULT_STRATUM_PORT;
}

/**
 * Stratum URL for the Connect dialog — uses the host you opened the dashboard on
 * (IP, .local, Tailscale, etc.) unless an operator configured a distinct stratum host.
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

  return trimmed;
}
