"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { DialogMarquees } from "@/components/dialog-marquees";
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
import { copyToClipboard } from "@/lib/utils";

const LN_ADDRESS = "public_pool@strike.me";
const ONCHAIN_ADDRESS = "bc1q99n3pu025yyu0jlywpmwzalyhm36tg5u37w20d";

function CopyableAddress({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
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
  return (
    <ModalOverlay open={open} onClose={onClose} label="Donate to Public Pool">
      <div className="flex w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl bg-background lido-dialog-shell">
        <DialogMarquees text="Support us · Keep Public Pool flowing · Thank you" tone="donate">
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
                    className="size-[min(200px,70vw)] rounded-lg bg-white p-2 sm:size-[200px]"
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
                    className="size-[min(200px,70vw)] rounded-lg bg-white p-2 sm:size-[200px]"
                  />
                  <CopyableAddress value={ONCHAIN_ADDRESS} />
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogMarquees>
      </div>
    </ModalOverlay>
  );
}
