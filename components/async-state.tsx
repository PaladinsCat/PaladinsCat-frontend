/** async-state component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettled } from "@/lib/route-transition-context";

const transition = { duration: 0.2, ease: "easeOut" as const };

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const routeSettled = useRouteSettled();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={routeSettled ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function StableMetricValue({
  value,
  className,
  minWidthCh = 4,
}: {
  value: string | number;
  className?: string;
  minWidthCh?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <span className={cn("inline-grid tabular-nums", className)} style={{ minWidth: `${minWidthCh}ch` }}>
      <motion.span
        key={String(value)}
        className="col-start-1 row-start-1 whitespace-nowrap"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition}
      >
        {value}
      </motion.span>
    </span>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function LoadingPanel({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <ContentFade
      className={cn(
        "flex items-center justify-center gap-3 text-pc-text-secondary",
        compact ? "py-5" : "min-h-40 py-10",
        className,
      )}
    >
      <LoadingIndicator />
    </ContentFade>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function LoadingIndicator({ className }: { className?: string }) {
  const { t } = useLocalization();
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-3 text-sm font-medium text-pc-text", className)}>
      <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-pc-accent" aria-hidden="true" />
      <span>{t("async.loading")}</span>
    </span>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function LoadingOverlay({ visible }: { visible: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] pc-glass-dark"
          aria-live="polite"
          aria-busy="true"
        >
          <LoadingIndicator className="gap-2" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <ContentFade className={cn("pc-card flex min-h-40 flex-col items-center justify-center px-5 py-10 text-center", className)}>
      <Inbox className="mb-3 h-7 w-7 text-pc-text-muted" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-pc-text">{title}</h2>
      {description && <p className="mt-1 max-w-md text-xs leading-relaxed text-pc-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </ContentFade>
  );
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useLocalization();
  return (
    <ContentFade className={cn("pc-card flex min-h-40 flex-col items-center justify-center px-5 py-10 text-center", className)}>
      <AlertTriangle className="mb-3 h-7 w-7 text-amber-400" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-pc-text">{title ?? t("async.couldNotLoad")}</h2>
      {message && <p className="mt-1 max-w-lg text-xs leading-relaxed text-pc-text-muted">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="pc-btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t("async.tryAgain")}
        </button>
      )}
    </ContentFade>
  );
}

interface AsyncButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function AsyncButton({ loading = false, children, className, disabled, ...props }: AsyncButtonProps) {
  const { t } = useLocalization();
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn("inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60", className)}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin text-pc-accent" aria-hidden="true" />}
      {loading ? t("async.loading") : children}
    </button>
  );
}
