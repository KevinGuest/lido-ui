"use client";

import { ArrowUpCircle } from "lucide-react";

import { AppNav } from "@/components/app-nav";
import { GitHubIcon } from "@/components/github-icon";
import { LogoThemeToggle } from "@/components/logo-theme-toggle";
import { GITHUB_REPO_URL } from "@/lib/app-meta";
import type { NetworkInfo } from "@/lib/mock-data";
import { cn, hoverLabelClassName, hoverLabelRightClassName } from "@/lib/utils";

export function AppHeader({
  title = "Lido",
  subtitle = "#2BGA",
  network,
  stratumConfigured = "",
  sv2AuthorityPublicKey = null,
  showUpdate = false,
  highlightUpdate = false,
  onUpdateClick,
}: {
  title?: string;
  subtitle?: string;
  network: NetworkInfo;
  stratumConfigured?: string;
  sv2AuthorityPublicKey?: string | null;
  showUpdate?: boolean;
  /** Auto-show the Update hover chip for a few seconds. */
  highlightUpdate?: boolean;
  onUpdateClick?: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <LogoThemeToggle />
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {showUpdate && onUpdateClick ? (
              <button
                type="button"
                aria-label="Update available"
                onClick={onUpdateClick}
                className={cn(
                  "group relative inline-flex size-8 items-center justify-center rounded-md",
                  "text-foreground transition-colors hover:bg-muted/40",
                )}
              >
                <ArrowUpCircle className="size-4 text-[#F7931A]" strokeWidth={1.75} />
                {highlightUpdate ? (
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1/2 left-full z-20 ml-1 -translate-y-1/2",
                      hoverLabelClassName,
                      hoverLabelRightClassName,
                      "opacity-100 transition-opacity",
                    )}
                  >
                    Update available
                  </span>
                ) : (
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1/2 left-full z-20 ml-1 -translate-y-1/2",
                      hoverLabelClassName,
                      hoverLabelRightClassName,
                      "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                    )}
                  >
                    Update
                  </span>
                )}
              </button>
            ) : (
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Lido on GitHub"
                className={cn(
                  "group relative inline-flex size-8 items-center justify-center rounded-md",
                  "text-foreground transition-colors hover:bg-muted/40",
                )}
              >
                <GitHubIcon className="size-4" />
                <span
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-full z-20 ml-1 -translate-y-1/2",
                    hoverLabelClassName,
                    hoverLabelRightClassName,
                    "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                >
                  GitHub
                </span>
              </a>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <AppNav
        stratumConfigured={stratumConfigured}
        network={network}
        sv2AuthorityPublicKey={sv2AuthorityPublicKey}
      />
    </header>
  );
}
