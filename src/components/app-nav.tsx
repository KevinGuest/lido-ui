"use client";

import { useState } from "react";
import { Heart, Unplug } from "lucide-react";

import { ConnectDialog } from "@/components/connect-panel";
import { DonateDialog } from "@/components/donate-dialog";
import { NetworkHeightPill } from "@/components/network-height-card";
import { ThemeToggle } from "@/components/theme-toggle";
import type { NetworkInfo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function AppNav({
  stratumUrl,
  network,
}: {
  stratumUrl: string;
  network: NetworkInfo;
}) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

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
              "pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2",
              "rounded-md border border-border bg-background px-2 py-1 text-xs whitespace-nowrap text-foreground shadow-lg",
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            Connect
          </span>
        </button>

        <ThemeToggle />

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
              "pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2",
              "rounded-md border border-border bg-background px-2 py-1 text-xs whitespace-nowrap text-foreground shadow-lg",
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
