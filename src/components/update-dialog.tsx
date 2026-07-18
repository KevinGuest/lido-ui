"use client";

import { useEffect } from "react";
import { ArrowRight, Store, X } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
import { GitHubIcon } from "@/components/github-icon";
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
import type { LatestRelease } from "@/lib/update-check";
import { cn } from "@/lib/utils";

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
  deployment: DeploymentKind;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const githubUrl = release.url || GITHUB_RELEASES_URL;
  const showUmbrelStore = deployment === "umbrel";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Lido update available"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-xl sm:max-w-xl sm:aspect-[5/4]">
        <DialogMarquees text="Lido update available" tone="update">
          <Card className="flex h-full flex-col border-0 shadow-none">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xl sm:text-2xl">Update available</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                A newer Lido UI release is available. You are on{" "}
                <span className="font-medium text-foreground">v{currentVersion}</span>.
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
            <CardContent className="flex flex-1 flex-col justify-between gap-8 pt-2 pb-4 sm:pb-6">
              <div className="flex min-h-44 flex-1 flex-col items-center justify-center rounded-2xl border border-border/50 px-6 py-10 text-center sm:min-h-52">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  Latest release
                </p>
                <p className="mt-3 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
                  {release.tag}
                </p>
                {release.name !== release.tag ? (
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">{release.name}</p>
                ) : null}
              </div>
              <div className="flex items-center justify-center gap-3">
                {showUmbrelStore ? (
                  <a
                    href={UMBREL_APP_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open Umbrel app store repo"
                    title="Umbrel app"
                    className={cn(
                      buttonVariants({ variant: "default", size: "icon-lg" }),
                      "size-11",
                    )}
                  >
                    <Store className="size-5" strokeWidth={1.75} />
                  </a>
                ) : null}
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on GitHub"
                  title="GitHub"
                  className={cn(
                    buttonVariants({
                      variant: showUmbrelStore ? "outline" : "default",
                      size: "icon-lg",
                    }),
                    "size-11",
                  )}
                >
                  <GitHubIcon className="size-5" />
                </a>
                <Button
                  type="button"
                  size="icon-lg"
                  variant="outline"
                  aria-label="Later"
                  title="Later"
                  className="size-11"
                  onClick={onClose}
                >
                  <ArrowRight className="size-5" strokeWidth={1.75} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </div>
  );
}
