"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FoundBlock } from "@/lib/mock-data";

export function BlocksFoundCard({
  count,
  blocks,
}: {
  count: number;
  blocks: FoundBlock[];
}) {
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

  return (
    <>
      <button
        type="button"
        className="group/card flex w-full flex-col overflow-hidden rounded-xl border border-border bg-transparent text-left shadow-none transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(true)}
      >
        <div className="grid gap-1 px-4 pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Blocks found</p>
          <p className="text-2xl font-medium tabular-nums tracking-tight">{count}</p>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Found blocks"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle>Blocks found</CardTitle>
                <CardDescription>
                  Solo blocks submitted by workers on this pool.
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Height</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="w-[160px]">Worker</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                          No blocks found yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      blocks.map((block) => (
                        <TableRow key={`${block.height}-${block.worker}-${block.address}`}>
                          <TableCell className="tabular-nums">
                            {block.height.toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate font-mono text-xs">
                            {block.address || "n/a"}
                          </TableCell>
                          <TableCell>{block.worker || "n/a"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
