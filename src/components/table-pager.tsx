"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TablePager({
  pageIndex,
  pageCount,
  pageSize,
  total,
  noun = "items",
  onPageChange,
}: {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  total: number;
  noun?: string;
  onPageChange: (page: number) => void;
}) {
  if (total <= pageSize) return null;

  const safePage = Math.min(pageIndex, pageCount - 1);

  return (
    <>
      <div className="mt-4 hidden items-center justify-center gap-1 md:flex">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous page"
          disabled={safePage === 0}
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-[10rem] text-center text-xs tabular-nums text-muted-foreground">
          Showing {safePage * pageSize + 1}–
          {Math.min((safePage + 1) * pageSize, total)} of {total} {noun}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next page"
          disabled={safePage >= pageCount - 1}
          onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 md:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-1.5"
          aria-label="Previous page"
          disabled={safePage === 0}
          onClick={() => onPageChange(Math.max(0, safePage - 1))}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
          {safePage + 1} / {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 gap-1.5"
          aria-label="Next page"
          disabled={safePage >= pageCount - 1}
          onClick={() => onPageChange(Math.min(pageCount - 1, safePage + 1))}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </>
  );
}
