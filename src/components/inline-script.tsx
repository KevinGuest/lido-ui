"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Inline script for SSR + hydration only.
 * React 19 warns if a <script> is created during a client render (it never runs).
 * useSyncExternalStore keeps the tag for the server/hydration pass, then drops it.
 * @see https://github.com/mui/material-ui/pull/48671
 */
export function InlineScript({
  html,
  type,
}: {
  html: string;
  type?: string;
}) {
  const renderScript = useSyncExternalStore(subscribe, () => false, () => true);
  if (!renderScript) return null;

  return (
    <script
      type={type}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
