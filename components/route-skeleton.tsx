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
