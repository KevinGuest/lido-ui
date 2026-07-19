"use client";

import { useEffect, useState } from "react";
import { Heart, Unplug } from "lucide-react";

import { ConnectDialog } from "@/components/connect-panel";
import { DonateDialog } from "@/components/donate-dialog";
import { GitHubIcon } from "@/components/github-icon";
import { NetworkHeightPill } from "@/components/network-height-card";
import { GITHUB_RELEASES_URL } from "@/lib/app-meta";
import type { NetworkInfo } from "@/lib/mock-data";
import { resolveStratumEndpoint } from "@/lib/stratum-url";
import { cn, hoverLabelClassName } from "@/lib/utils";

export function AppNav({
  stratumConfigured = "",
  network,
}: {
  stratumConfigured?: string;
  network: NetworkInfo;
}) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [stratumUrl, setStratumUrl] = useState("");

  useEffect(() => {
    setStratumUrl(
      resolveStratumEndpoint(window.location.hostname, stratumConfigured),
    );
  }, [stratumConfigured]);

  return (
    <>
      <nav className="flex items-center gap-2" aria-label="Primary">
        <NetworkHeightPill network={network} />

        <button
          type="button"
          aria-label="Connect"
          aria-haspopup="dialog"
          aria-expanded={connectOpen}
          onClick={() => setConnectOpen(true)}
          className={cn(
            "group relative flex size-10 items-center justify-center rounded-md border transition-colors",
            connectOpen
              ? "border-transparent bg-foreground text-background"
              : "border-border bg-transparent text-foreground hover:bg-muted/40",
          )}
        >
          <Unplug
            className={cn(
              "size-[1.15rem] transition-colors",
              connectOpen
                ? "fill-background"
                : "group-hover:fill-foreground group-focus-visible:fill-foreground",
            )}
            strokeWidth={1.75}
          />
          <span
            className={cn(
              "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
              hoverLabelClassName,
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            Connect
          </span>
        </button>

        <a
          href={GITHUB_RELEASES_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub releases"
          className={cn(
            "group relative flex size-10 items-center justify-center rounded-md border border-border bg-transparent text-foreground transition-colors hover:bg-muted/40",
          )}
        >
          <GitHubIcon className="size-[1.15rem]" />
          <span
            className={cn(
              "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
              hoverLabelClassName,
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            GitHub
          </span>
        </a>

        <button
          type="button"
          aria-label="Donate"
          aria-haspopup="dialog"
          aria-expanded={donateOpen}
          onClick={() => setDonateOpen(true)}
          className={cn(
            "group relative flex size-10 items-center justify-center rounded-md border transition-colors",
            donateOpen
              ? "border-transparent bg-foreground text-background"
              : "border-border bg-transparent text-foreground hover:bg-muted/40",
          )}
        >
          <Heart
            className={cn(
              "size-[1.15rem] transition-colors",
              donateOpen
                ? "fill-red-500 text-red-500"
                : "group-hover:fill-red-500 group-hover:text-red-500 group-focus-visible:fill-red-500 group-focus-visible:text-red-500",
            )}
            strokeWidth={1.75}
          />
          <span
            className={cn(
              "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
              hoverLabelClassName,
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            Donate
          </span>
        </button>
      </nav>

      <ConnectDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        stratumUrl={stratumUrl}
      />
      <DonateDialog open={donateOpen} onClose={() => setDonateOpen(false)} />
    </>
  );
}
