"use client";

import { useEffect, useState } from "react";
import { Store, X } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
import { GitHubIcon } from "@/components/github-icon";
import { ModalOverlay } from "@/components/modal-overlay";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DeploymentKind } from "@/lib/app-meta";
import { GITHUB_RELEASES_URL, UMBREL_APP_URL } from "@/lib/app-meta";
import { resolveUmbrelAppStoreUrl } from "@/lib/stratum-url";
import type { LatestRelease } from "@/lib/update-check";
import { cn } from "@/lib/utils";

function formatVersion(tag: string) {
  const trimmed = tag.trim();
  return trimmed.startsWith("v") || trimmed.startsWith("V") ? trimmed : `v${trimmed}`;
}

export function UpdateDialog({
  open,
  onClose,
  currentVersion,
  release,
  deployment,
}: {
  open: boolean;
  onClose: () => void;
  currentVersion: string;
  release: LatestRelease;
  deployment?: DeploymentKind;
}) {
  const [umbrelAppStoreUrl, setUmbrelAppStoreUrl] = useState(
    "http://umbrel.local/app-store",
  );

  useEffect(() => {
    setUmbrelAppStoreUrl(
      resolveUmbrelAppStoreUrl(
        window.location.hostname,
        window.location.protocol,
      ),
    );
  }, []);

  const githubUrl =
    release.url ||
    (deployment === "umbrel" ? UMBREL_APP_URL : GITHUB_RELEASES_URL);
  const current = formatVersion(currentVersion);
  const latest = formatVersion(release.tag);

  return (
    <ModalOverlay open={open} onClose={onClose} label="Lido update available">
      <div className="w-[min(100%,22rem)] min-w-0 overflow-hidden rounded-2xl bg-background lido-dialog-shell">
        <DialogMarquees text="Lido" tone="update" showBottom={false}>
          <Card className="gap-0 border-0 py-0 shadow-none">
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-lg">Update available</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                A newer version of Lido is ready to install.
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Close"
                  onClick={onClose}
                >
                  <X />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Version
                  </p>
                  <p className="mt-0.5 font-mono text-sm tabular-nums text-foreground">
                    <span className="text-muted-foreground">{current}</span>
                    <span className="mx-1.5 text-muted-foreground">→</span>
                    <span className="font-semibold">{latest}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={umbrelAppStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open Umbrel app store"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "h-10 gap-2",
                  )}
                >
                  <Store className="size-4" strokeWidth={1.75} />
                  Umbrel
                </a>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on GitHub"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 gap-2 bg-transparent hover:bg-muted/40 dark:bg-transparent dark:hover:bg-muted/40",
                  )}
                >
                  <GitHubIcon className="size-4" />
                  GitHub
                </a>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </ModalOverlay>
  );
}
