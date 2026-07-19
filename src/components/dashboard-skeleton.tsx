import { Skeleton } from "@/components/ui/skeleton";

/** Layout stand-in while the boot splash runs / data settles. */
export function DashboardSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6"
      aria-hidden="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="size-10 rounded-md" />
          <Skeleton className="size-10 rounded-md" />
          <Skeleton className="size-10 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border/40 p-4"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-border/40 p-4 lg:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="space-y-3 rounded-xl border border-border/40 p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mx-auto size-28 rounded-full" />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>

      <div className="space-y-3 rounded-xl border border-border/40 p-4">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
