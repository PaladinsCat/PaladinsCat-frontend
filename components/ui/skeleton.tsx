/** Define lightweight loading placeholders that share the application's class-merging rules. */
import { cn } from "@/lib/utils";

/** Render an accessible loading placeholder with optional additional classes.  Returns: `React.JSX.Element`. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("pc-skeleton rounded-lg", className)} />;
}

/** Render a full-width short loading line by composing Skeleton with height classes.  Returns: `React.JSX.Element`. */
export function SkeletonLine({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3 w-full", className)} />;
}
