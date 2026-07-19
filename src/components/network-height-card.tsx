"use client";

import { useEffect, useState } from "react";
import { Box, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { feeRateSats, hashSuffix, numberSuffix } from "@/lib/format";
import type { NetworkInfo } from "@/lib/mock-data";
import { cn, hoverLabelClassName } from "@/lib/utils";

function formatNetworkName(chain: string) {
  const key = chain.trim().toLowerCase();
  if (key === "main" || key === "mainnet") return "Mainnet";
  if (key === "test" || key === "testnet") return "Testnet";
  if (key === "signet") return "Signet";
  if (key === "regtest") return "Regtest";
  return chain || "Unknown";
}

export function NetworkHeightPill({ network }: { network: NetworkInfo }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rows = [
    { label: "Network", value: formatNetworkName(network.chain) },
    { label: "Block height", value: network.height.toLocaleString() },
    {
      label: "Next height",
      value: network.nextHeight == null ? "n/a" : network.nextHeight.toLocaleString(),
    },
    {
      label: "Network fee (min)",
      value: feeRateSats(network.minFeeBtcKvB),
    },
    {
      label: "Network hashrate",
      value: network.networkHashrate ? hashSuffix(network.networkHashrate) : "n/a",
    },
    {
      label: "Difficulty",
      value: network.difficulty ? numberSuffix(network.difficulty) : "n/a",
    },
    {
      label: "Current block weight",
      value:
        network.currentBlockWeight == null
          ? "n/a"
          : network.currentBlockWeight.toLocaleString(),
    },
    {
      label: "Current block txs",
      value:
        network.currentBlockTx == null ? "n/a" : network.currentBlockTx.toLocaleString(),
    },
    {
      label: "Mempool txs",
      value: network.pooledTx == null ? "n/a" : network.pooledTx.toLocaleString(),
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-label={`Block height ${network.height.toLocaleString()}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "group relative inline-flex h-10 items-center gap-2 rounded-full border border-border bg-transparent px-3",
          "text-foreground transition-colors hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Box className="size-4 shrink-0 text-orange-500" strokeWidth={1.75} />
        <span className="tabular-nums text-sm font-medium">
          {network.height.toLocaleString()}
        </span>
          <span
            className={cn(
              "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2",
              hoverLabelClassName,
              "opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
          Block height
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Bitcoin network"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-background lido-dialog-shell">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle>Node network info</CardTitle>
                <CardDescription>
                  Live mining info from your Umbrel Bitcoin node via the pool RPC link.
                </CardDescription>
                <CardAction>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                  >
                    <X />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5"
                    >
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="font-mono text-sm tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
