import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RouteSkeletonVariant = "dashboard" | "list" | "profile" | "match" | "detail";

function HeadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-56 max-w-[70%]" />
      <Skeleton className="h-3 w-80 max-w-full" />
    </div>
  );
}

function CardSkeleton({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("pc-card space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-2/5" />
          <SkeletonLine className="w-3/5" />
        </div>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }, (_, index) => (
          <SkeletonLine key={index} className={index % 2 === 0 ? "w-full" : "w-4/5"} />
        ))}
      </div>
    </div>
  );
}

export function DataTableSkeleton({ rows = 7, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated", className)} role="status" aria-label="Loading table data">
      <div className="grid grid-cols-4 gap-4 border-b border-pc-border bg-pc-bg-secondary px-4 py-3">
        {Array.from({ length: 4 }, (_, index) => <SkeletonLine key={index} className="w-2/3" />)}
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 border-b border-pc-border/30 px-4 py-3 last:border-0">
          <SkeletonLine className="w-4/5" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-3/5" />
          <SkeletonLine className="w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function RouteSkeleton({ variant = "dashboard" }: { variant?: RouteSkeletonVariant }) {
  if (variant === "profile") {
    return (
      <div className="space-y-5" role="status" aria-label="Loading player profile">
        <div className="pc-card flex flex-col gap-5 min-[420px]:flex-row">
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-52 max-w-full" />
            <SkeletonLine className="w-72 max-w-full" />
            <SkeletonLine className="w-96 max-w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2"><CardSkeleton /><CardSkeleton lines={6} /></div>
          <div className="space-y-5"><CardSkeleton lines={5} /><CardSkeleton lines={5} /></div>
        </div>
      </div>
    );
  }

  if (variant === "match") {
    return (
      <div className="space-y-6" role="status" aria-label="Loading match details">
        <HeadingSkeleton />
        <CardSkeleton lines={3} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><CardSkeleton lines={7} /><CardSkeleton lines={7} /></div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-6" role="status" aria-label="Loading list">
        <HeadingSkeleton />
        <div className="pc-card space-y-3">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 border-b border-pc-border/30 py-3 last:border-0">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <SkeletonLine className="w-1/3" />
              <SkeletonLine className="ml-auto w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <HeadingSkeleton />
      <div className={cn("grid grid-cols-1 gap-5", variant === "detail" ? "lg:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>
        {Array.from({ length: variant === "detail" ? 4 : 6 }, (_, index) => <CardSkeleton key={index} lines={index % 2 === 0 ? 4 : 6} />)}
      </div>
    </div>
  );
}
