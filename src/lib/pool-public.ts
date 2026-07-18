/** Client-safe stratum URL helpers (no Next server-only imports). */

function env(name: string): string {
  if (typeof process === "undefined") return "";
  return (process.env[name] ?? "").trim();
}

/** Browser/UI stratum hint — prefer NEXT_PUBLIC_* so the client can read it. */
export function configuredStratumUrl() {
  return (
    env("NEXT_PUBLIC_POOL_STRATUM_URL") ||
    env("NEXT_PUBLIC_STRATUM_URL") ||
    env("PUBLIC_POOL_STRATUM_URL") ||
    ""
  );
}
