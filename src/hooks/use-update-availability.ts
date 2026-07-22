"use client";

import { useCallback, useEffect, useState } from "react";

import { APP_VERSION, type DeploymentKind } from "@/lib/app-meta";
import {
  dismissUpdateTag,
  dismissedUpdateTag,
  fetchLatestRelease,
  isNewerVersion,
  type LatestRelease,
} from "@/lib/update-check";

const HINT_MS = 4_000;
const IS_DEV = process.env.NODE_ENV === "development";

export function useUpdateAvailability(
  deployment: DeploymentKind,
  {
    announce = true,
    currentVersion = APP_VERSION,
  }: { announce?: boolean; currentVersion?: string } = {},
) {
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [isNewer, setIsNewer] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  /** Brief auto-shown label on the header Update control. */
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    // Demo / public: no update affordance.
    if (deployment === "demo" || deployment === "public") return;

    let cancelled = false;

    (async () => {
      const latest = await fetchLatestRelease(deployment);
      if (cancelled || !latest) return;

      const newer = isNewerVersion(latest.tag, currentVersion);
      // Local next/dev: preview update UI even when already current.
      // Production: only when the tracked repo is ahead.
      if (!newer && !IS_DEV) return;

      // Skip if this real upgrade was permanently dismissed.
      if (newer && dismissedUpdateTag() === latest.tag) return;

      setRelease(latest);
      setIsNewer(newer);
    })();

    return () => {
      cancelled = true;
    };
  }, [deployment, currentVersion]);

  const hasUpdate =
    deployment !== "demo" &&
    deployment !== "public" &&
    Boolean(release) &&
    (isNewer || IS_DEV);

  useEffect(() => {
    if (!announce || !hasUpdate) return;

    setHintOpen(true);
    const id = window.setTimeout(() => setHintOpen(false), HINT_MS);
    return () => window.clearTimeout(id);
  }, [announce, hasUpdate]);

  const openDialog = useCallback(() => {
    if (!release) return;
    setHintOpen(false);
    setDialogOpen(true);
  }, [release]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const dismissUpdate = useCallback(() => {
    if (release && isNewer) dismissUpdateTag(release.tag);
    setHintOpen(false);
    setDialogOpen(false);
    setRelease(null);
  }, [release, isNewer]);

  return {
    release,
    dialogOpen,
    hintOpen,
    openDialog,
    closeDialog,
    dismissUpdate,
    currentVersion,
    hasUpdate,
  };
}
