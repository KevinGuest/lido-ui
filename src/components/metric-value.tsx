import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Metric display: loading → inline skeleton; settled empty → fallback; else children.
 * Uses <span> so it is safe inside <p> / heading text.
 */
export function MetricValue({
  loading,
  children,
  empty = "—",
  className,
  skeletonClassName,
}: {
  loading?: boolean;
  children?: ReactNode;
  empty?: ReactNode;
  className?: string;
  skeletonClassName?: string;
}) {
  if (loading) {
    return (
      <span
        data-slot="skeleton"
        className={cn(
          "inline-block h-[1.15em] w-20 animate-pulse rounded-md bg-muted align-middle",
          skeletonClassName,
        )}
        aria-hidden
      />
    );
  }

  if (children == null || children === false || children === "") {
    return <span className={className}>{empty}</span>;
  }

  return <span className={className}>{children}</span>;
}
