import { LoadingPanel } from "@/components/async-state";

type RouteSkeletonVariant = "dashboard" | "list" | "profile" | "match" | "detail";

export function DataCardSkeleton({
  rows: _rows = 5,
  columns: _columns = 1,
  className,
}: {
  rows?: number;
  columns?: 1 | 2;
  className?: string;
}) {
  return <LoadingPanel className={className} />;
}

export function ChartCardSkeleton({ className }: { className?: string }) {
  return <LoadingPanel className={className} />;
}

export function DataTableSkeleton({ rows: _rows = 7, className }: { rows?: number; className?: string }) {
  return <LoadingPanel className={className} />;
}

export function RouteSkeleton({ variant: _variant = "dashboard" }: { variant?: RouteSkeletonVariant }) {
  return <LoadingPanel />;
}
