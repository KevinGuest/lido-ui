"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { ModalOverlay } from "@/components/modal-overlay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addressHasPoolWorkers } from "@/lib/address-auth";
import { isLikelyBitcoinAddress } from "@/lib/bitcoin-address";
import type { Worker } from "@/lib/mock-data";

export function AddressLoginDialog({
  open,
  onClose,
  onLogin,
  workers,
}: {
  open: boolean;
  onClose: () => void;
  onLogin: (address: string) => void;
  /** Current pool workers — find only succeeds if this address has one. */
  workers: Pick<Worker, "address">[];
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!isLikelyBitcoinAddress(trimmed)) {
      setError("Enter a valid bitcoin address (bc1… / 1… / 3…).");
      return;
    }
    if (!addressHasPoolWorkers(trimmed, workers)) {
      setError("No miners connected for this address on this pool.");
      return;
    }
    setError(null);
    onLogin(trimmed);
    setValue("");
    onClose();
  }

  return (
    <ModalOverlay open={open} onClose={onClose} label="Find your miners">
      <div className="w-[min(100%,28rem)] min-w-0 overflow-hidden rounded-xl bg-background lido-dialog-shell">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Find your miners</CardTitle>
            <CardDescription>
              Enter the bitcoin address you mine with. Works only if that address
              already has a miner on this pool.
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
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <label htmlFor="lido-login-address" className="text-sm text-muted-foreground">
                  Bitcoin address
                </label>
                <input
                  id="lido-login-address"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setError(null);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
                {error ? <p className="text-sm text-rose-400">{error}</p> : null}
              </div>
              <Button type="submit" className="w-full">
                Find miners
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>
  );
}
