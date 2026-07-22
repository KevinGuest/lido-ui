"use client";

import { SlidersHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type PublicSortKey = "hashrate" | "bestDifficulty" | "lastSeen";

export const PUBLIC_SORT_OPTIONS: { key: PublicSortKey; label: string }[] = [
  { key: "hashrate", label: "Hashrate" },
  { key: "bestDifficulty", label: "Best diff" },
  { key: "lastSeen", label: "Last seen" },
];

export function PublicSortToolbar({
  sort,
  onSortChange,
}: {
  sort: PublicSortKey;
  onSortChange: (sort: PublicSortKey) => void;
}) {
  const activeLabel =
    PUBLIC_SORT_OPTIONS.find((option) => option.key === sort)?.label ?? sort;

  return (
    <div className="relative z-20 flex flex-wrap items-center justify-end gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          nativeButton
          aria-label={`Sort by ${activeLabel}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs md:hidden",
            "text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
          {activeLabel}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(value) => {
              if (value) onSortChange(value as PublicSortKey);
            }}
          >
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PUBLIC_SORT_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.key} value={option.key}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="mr-0.5 hidden text-xs text-muted-foreground md:inline">
        Sort
      </span>
      <div className="hidden flex-wrap items-center justify-end gap-1.5 md:flex">
        {PUBLIC_SORT_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onSortChange(option.key)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              sort === option.key
                ? "border-transparent bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function compareByPublicSort<
  T extends {
    hashrate: number;
    bestDifficulty: number;
    lastSeenMs: number;
    name?: string;
    label?: string;
  },
>(a: T, b: T, sort: PublicSortKey): number {
  const nameA = a.name ?? a.label ?? "";
  const nameB = b.name ?? b.label ?? "";
  switch (sort) {
    case "bestDifficulty":
      return b.bestDifficulty - a.bestDifficulty || nameA.localeCompare(nameB);
    case "lastSeen":
      return b.lastSeenMs - a.lastSeenMs || nameA.localeCompare(nameB);
    case "hashrate":
    default:
      return b.hashrate - a.hashrate || nameA.localeCompare(nameB);
  }
}

export function lastSeenMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : 0;
}
