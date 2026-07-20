/** Browser-side pool API paths — proxied through Next.js, not nginx → pool. */
export function browserPoolApiPath(path: string): string {
  const normalized = path.replace(/^\/+/, "");
  if (process.env.NEXT_PUBLIC_LIDO_DEMO === "true") {
    return `/${normalized}`;
  }
  return `/pool-proxy/${normalized}`;
}
