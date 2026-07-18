"use client";

import { useEffect, useState } from "react";

import { UpdateDialog } from "@/components/update-dialog";
import { APP_VERSION, GITHUB_RELEASES_URL, type DeploymentKind } from "@/lib/app-meta";
import {
  dismissUpdateTag,
  dismissedUpdateTag,
  fetchLatestRelease,
  isNewerVersion,
  type LatestRelease,
} from "@/lib/update-check";

function isUpdatePreview(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("preview") === "update";
}

function clearUpdatePreviewParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("preview")) return;
  url.searchParams.delete("preview");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function UpdateNotifier({ deployment }: { deployment: DeploymentKind }) {
  const [open, setOpen] = useState(false);
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (isUpdatePreview()) {
      setPreview(true);
      setRelease({
        tag: "v0.1.17",
        name: "Preview release",
        url: GITHUB_RELEASES_URL,
      });
      setOpen(true);
      return;
    }

    // Demo site never auto-prompts; use ?preview=update to review the dialog.
    if (deployment === "demo") return;

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
        if (preview) {
          clearUpdatePreviewParam();
        } else {
          dismissUpdateTag(release.tag);
        }
        setOpen(false);
      }}
      currentVersion={APP_VERSION}
      release={release}
      deployment={deployment}
    />
  );
}
