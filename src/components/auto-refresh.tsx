"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Soft-refresh the dashboard so live Umbrel pool data stays current. */
export function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);

  return null;
}
