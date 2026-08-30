import { cn } from "@/lib/utils";
import { LoadingIndicator } from "@/components/async-state";

type RouteSkeletonVariant = "dashboard" | "list" | "profile" | "match" | "detail";

export function DataCardSkeleton({
  rows = 5,
  columns = 1,
  className,
}: {
  rows?: number;
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("grid min-h-56 gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4", columns === 2 && "sm:grid-cols-2", className)}>
      {Array.from({ length: columns }, (_, column) => (
        <div key={column} className="space-y-3">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex h-7 items-center gap-3">
              <span className="pc-skeleton h-3 w-14 rounded" />
              <span className="pc-skeleton h-2 flex-1 rounded-full" />
              <span className="pc-skeleton h-3 w-10 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex min-h-56 items-end gap-2 rounded-xl border border-pc-border bg-pc-bg-elevated p-4", className)}>
      {[38, 62, 48, 82, 70, 54, 74].map((height, index) => <span key={index} className="pc-skeleton flex-1 rounded-t" style={{ height: `${height}%` }} />)}
    </div>
  );
}

export function DataTableSkeleton({ rows = 7, className }: { rows?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated", className)}>
      <div className="grid h-11 grid-cols-[2fr_1fr_1fr] gap-4 border-b border-pc-border px-4 py-3">
        <span className="pc-skeleton rounded" /><span className="pc-skeleton rounded" /><span className="pc-skeleton rounded" />
      </div>
      {Array.from({ length: rows }, (_, row) => <div key={row} className="grid h-12 grid-cols-[2fr_1fr_1fr] gap-4 border-b border-pc-border/50 px-4 py-3 last:border-0"><span className="pc-skeleton rounded" /><span className="pc-skeleton rounded" /><span className="pc-skeleton rounded" /></div>)}
    </div>
  );
}

export function RouteSkeleton({ variant = "dashboard" }: { variant?: RouteSkeletonVariant }) {
  if (variant === "profile") {
    return (
      <div
        data-route-loading="profile"
        className="min-h-[80rem] space-y-5"
        aria-busy="true"
      >
        <div className="flex h-5 items-center justify-between">
          <span aria-hidden="true" className="pc-skeleton h-3 w-28 rounded" />
          <LoadingIndicator className="gap-2 text-pc-text-secondary" />
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div aria-hidden="true" className="pc-card min-h-40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="order-2 flex flex-wrap justify-end gap-2">
                  <span className="pc-skeleton h-9 w-24 rounded-lg" />
                  <span className="pc-skeleton h-9 w-24 rounded-lg" />
                  <span className="pc-skeleton h-9 w-24 rounded-lg" />
                </div>
                <div className="order-1 flex min-w-0 flex-1 items-start gap-4">
                  <span className="pc-skeleton h-[7rem] w-[5.2rem] shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-3 py-2">
                    <span className="pc-skeleton block h-8 w-3/5 max-w-72 rounded" />
                    <span className="pc-skeleton block h-4 w-2/5 max-w-48 rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div aria-hidden="true">
              <span className="pc-skeleton mb-2 block h-4 w-24 rounded" />
              <DataCardSkeleton rows={5} columns={2} className="min-h-64" />
            </div>

            <div aria-hidden="true">
              <span className="pc-skeleton mb-2 block h-4 w-32 rounded" />
              <DataTableSkeleton rows={6} className="min-h-96" />
            </div>
          </div>

          <div aria-hidden="true" className="space-y-5 lg:col-span-1">
            {["h-20", "h-20", "h-44", "h-52", "h-36"].map((height, index) => (
              <div key={index}>
                <span className="pc-skeleton mb-2 block h-4 w-28 rounded" />
                <div className={cn("rounded-xl border border-pc-border bg-pc-bg-elevated p-4", height)}>
                  <div className="flex h-full items-start gap-3">
                    <span className="pc-skeleton h-11 w-11 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2 pt-1">
                      <span className="pc-skeleton block h-3 w-3/4 rounded" />
                      <span className="pc-skeleton block h-2 w-full rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-route-loading={variant}
      className="flex min-h-[clamp(18rem,55vh,34rem)] items-center justify-center px-4 py-16"
      aria-busy="true"
    >
      <LoadingIndicator className="text-pc-text-secondary" />
    </div>
  );
}
