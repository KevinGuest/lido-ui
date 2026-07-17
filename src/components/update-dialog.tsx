"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
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
import {
  updateDestinationLabel,
  updateDestinationUrl,
} from "@/lib/app-meta";
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

  const destination = updateDestinationUrl(deployment);
  const destinationLabel = updateDestinationLabel(deployment);

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
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/50 px-4 py-3">
                <p className="text-xs text-muted-foreground">Latest release</p>
                <p className="font-mono text-sm">{release.tag}</p>
                {release.name !== release.tag ? (
                  <p className="mt-1 text-sm text-muted-foreground">{release.name}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={destination}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants())}
                >
                  {destinationLabel}
                </a>
                <Button type="button" variant="outline" onClick={onClose}>
                  Later
                </Button>
                {deployment !== "umbrel" ? (
                  <a
                    href={release.url}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "ghost" }))}
                  >
                    Release notes
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </div>
  );
}
