"use client";

import { UpdateDialog } from "@/components/update-dialog";
import type { DeploymentKind } from "@/lib/app-meta";
import type { LatestRelease } from "@/lib/update-check";

export function UpdateNotifier({
  dialogOpen,
  onCloseDialog,
  release,
  currentVersion,
  deployment,
}: {
  dialogOpen: boolean;
  onCloseDialog: () => void;
  release: LatestRelease | null;
  currentVersion: string;
  deployment?: DeploymentKind;
}) {
  if (!release) return null;

  return (
    <UpdateDialog
      open={dialogOpen}
      onClose={onCloseDialog}
      currentVersion={currentVersion}
      release={release}
      deployment={deployment}
    />
  );
}
