"use client";

import { useEffect, useState } from "react";

import { UpdateDialog } from "@/components/update-dialog";
import { APP_VERSION, type DeploymentKind } from "@/lib/app-meta";
import {
  dismissUpdateTag,
  dismissedUpdateTag,
  fetchLatestRelease,
  isNewerVersion,
  type LatestRelease,
} from "@/lib/update-check";

export function UpdateNotifier({ deployment }: { deployment: DeploymentKind }) {
  const [open, setOpen] = useState(false);
  const [release, setRelease] = useState<LatestRelease | null>(null);

  useEffect(() => {
    if (deployment === "demo") return;

    let cancelled = false;

    (async () => {
      const latest = await fetchLatestRelease();
      if (cancelled || !latest) return;
      if (!isNewerVersion(latest.tag, APP_VERSION)) return;
      if (dismissedUpdateTag() === latest.tag) return;

      setRelease(latest);
      setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [deployment]);

  if (!release) return null;

  return (
    <UpdateDialog
      open={open}
      onClose={() => {
        dismissUpdateTag(release.tag);
        setOpen(false);
      }}
      currentVersion={APP_VERSION}
      release={release}
      deployment={deployment}
    />
  );
}
