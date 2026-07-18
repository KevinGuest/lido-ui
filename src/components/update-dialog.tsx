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

const outlineAction = cn(
  buttonVariants({ variant: "outline", size: "lg" }),
  "gap-2 bg-transparent px-3 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-muted/40",
);

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
      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-xl">
        <DialogMarquees text="Lido update available" tone="update">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Update available</CardTitle>
              <CardDescription>
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
            <CardContent className="space-y-4 pb-5">
              <div className="rounded-xl border border-border/50 px-4 py-4 text-left">
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                  Latest release
                </p>
                <p className="mt-1.5 font-mono text-2xl font-semibold tracking-tight">
                  {release.tag}
                </p>
                {release.name !== release.tag ? (
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">{release.name}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2.5">
                {showUmbrelStore ? (
                  <a
                    href={UMBREL_APP_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open Umbrel app store repo"
                    title="Umbrel app"
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "gap-2 px-3",
                    )}
                  >
                    <Store className="size-[18px]" strokeWidth={1.75} />
                    Umbrel
                  </a>
                ) : null}
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on GitHub"
                  title="GitHub"
                  className={
                    showUmbrelStore
                      ? outlineAction
                      : cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 px-3")
                  }
                >
                  <GitHubIcon className="size-[18px]" />
                  GitHub
                </a>
                <Button
                  type="button"
                  size="icon-lg"
                  variant="outline"
                  aria-label="Later"
                  title="Later"
                  className="bg-transparent dark:bg-transparent hover:bg-muted/40 dark:hover:bg-muted/40"
                  onClick={onClose}
                >
                  <ArrowRight className="size-[18px]" strokeWidth={1.75} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </div>
  );
}
