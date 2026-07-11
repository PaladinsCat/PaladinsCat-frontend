import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("pc-skeleton rounded-lg", className)} />;
}

export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 w-full", className)} />;
}
