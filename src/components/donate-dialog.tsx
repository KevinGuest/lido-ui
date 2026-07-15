"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LN_ADDRESS = "public_pool@strike.me";
const ONCHAIN_ADDRESS = "bc1q99n3pu025yyu0jlywpmwzalyhm36tg5u37w20d";

function CopyableAddress({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Ignore clipboard errors.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy"
      className="mt-2 max-w-full break-all font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? "Copied" : value}
    </button>
  );
}

export function DonateDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Donate to Public Pool"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-xl">
        <DialogMarquees text="Support · Keep Lido running · Thank you" tone="donate">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Donate</CardTitle>
              <CardDescription>
                Like the project? Consider a donation to Public Pool.
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
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="flex flex-col items-center text-center">
                  <p className="mb-3 text-sm text-muted-foreground">Lightning</p>
                  <Image
                    src="/qr-code-ln.svg"
                    alt={LN_ADDRESS}
                    width={200}
                    height={200}
                    className="size-[200px] rounded-lg bg-white p-2"
                  />
                  <CopyableAddress value={LN_ADDRESS} />
                </div>
                <div className="flex flex-col items-center text-center">
                  <p className="mb-3 text-sm text-muted-foreground">On-chain</p>
                  <Image
                    src="/qr-code-onchain.svg"
                    alt={ONCHAIN_ADDRESS}
                    width={200}
                    height={200}
                    className="size-[200px] rounded-lg bg-white p-2"
                  />
                  <CopyableAddress value={ONCHAIN_ADDRESS} />
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </div>
  );
}
