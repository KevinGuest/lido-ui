"use client";

import { useState } from "react";
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

      <ModalOverlay
        open={open}
        onClose={() => setOpen(false)}
        label="Found blocks"
      >
        <div className="w-[min(100%,48rem)] min-w-0 overflow-hidden rounded-xl bg-background lido-dialog-shell">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-6 pt-6">
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
            <CardContent className="px-6 pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Height</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="w-[140px]">Worker</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                        No blocks found yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    blocks.map((block) => (
                      <TableRow
                        key={`${block.height}-${block.worker}-${block.address}-${block.device ?? ""}`}
                      >
                        <TableCell className="tabular-nums">
                          {block.height.toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate font-mono text-xs">
                          {block.address || "n/a"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate">
                          {block.worker || "n/a"}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-muted-foreground">
                          {block.device || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ModalOverlay>
    </>
  );
}
