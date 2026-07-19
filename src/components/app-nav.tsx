"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DoorOpen, Heart, Settings, Unplug } from "lucide-react";

import { ConnectDialog } from "@/components/connect-panel";
import { DonateDialog } from "@/components/donate-dialog";
import { NetworkHeightPill } from "@/components/network-height-card";
import type { NetworkInfo } from "@/lib/mock-data";
import { resolveStratumEndpoint } from "@/lib/stratum-url";
import { cn, hoverLabelClassName } from "@/lib/utils";

function NavIconButton({
  active,
  label,
  onClick,
  href,
  children,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
}) {
  const className = cn(
    "group relative flex size-10 items-center justify-center rounded-md border transition-colors",
    active
      ? "border-transparent bg-foreground text-background"
      : "border-border bg-transparent text-foreground hover:bg-muted/40",
  );
  const tip = (
    <span
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
        hoverLabelClassName,
        "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
      )}
    >
      {label}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {children}
        {tip}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      {children}
      {tip}
    </button>
  );
}

export function AppNav({
  stratumConfigured = "",
  network,
  sv2AuthorityPublicKey = null,
}: {
  stratumConfigured?: string;
  network: NetworkInfo;
  sv2AuthorityPublicKey?: string | null;
}) {
  const pathname = usePathname();
  const settingsMode = pathname?.startsWith("/settings") ?? false;
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

        {settingsMode ? (
          <>
            <NavIconButton active label="Settings" href="/settings">
              <Settings className="size-[1.15rem]" strokeWidth={1.75} />
            </NavIconButton>
            <NavIconButton label="Exit" href="/">
              <DoorOpen
                className="size-[1.15rem] transition-colors group-hover:text-red-500 group-focus-visible:text-red-500"
                strokeWidth={1.75}
              />
            </NavIconButton>
          </>
        ) : (
          <>
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

            <NavIconButton label="Settings" href="/settings">
              <Settings className="size-[1.15rem]" strokeWidth={1.75} />
            </NavIconButton>
          </>
        )}
      </nav>

      {!settingsMode ? (
        <>
          <ConnectDialog
            open={connectOpen}
            onClose={() => setConnectOpen(false)}
            stratumUrl={stratumUrl}
            initialAuthorityPublicKey={sv2AuthorityPublicKey}
          />
          <DonateDialog open={donateOpen} onClose={() => setDonateOpen(false)} />
        </>
      ) : null}
    </>
  );
}
