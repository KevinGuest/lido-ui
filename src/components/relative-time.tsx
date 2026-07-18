"use client";

import { useEffect, useState } from "react";

import { timeAgo } from "@/lib/format";

/** Client-only relative time — avoids SSR/hydration mismatch from Date.now(). */
export function RelativeTime({ iso }: { iso: string | null | undefined }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) {
      setLabel(null);
      return;
    }
    const tick = () => setLabel(timeAgo(iso));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [iso]);

  if (!iso) return <>n/a</>;
  return <span suppressHydrationWarning>{label ?? "…"}</span>;
}
