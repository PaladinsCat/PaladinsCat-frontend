"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const transition = { duration: 0.2, ease: "easeOut" as const };

export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LoadingPanel({
  label = "Loading data…",
  detail,
  compact = false,
  className,
}: {
  label?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <ContentFade
      className={cn(
        "flex items-center justify-center gap-3 text-pc-text-secondary",
        compact ? "py-5" : "pc-card min-h-40 py-10",
        className,
      )}
    >
      <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-pc-accent" aria-hidden="true" />
      <div role="status" aria-live="polite">
        <div className="text-sm font-medium text-pc-text">{label}</div>
        {detail && <div className="mt-0.5 text-xs text-pc-text-muted">{detail}</div>}
      </div>
    </ContentFade>
  );
}

export function LoadingOverlay({ visible, label = "Updating…" }: { visible: boolean; label?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] bg-pc-bg/70 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-xl border border-pc-border bg-pc-bg-elevated px-4 py-2 text-sm font-medium text-pc-text shadow-xl">
            <LoaderCircle className="h-4 w-4 animate-spin text-pc-accent" aria-hidden="true" />
            {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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

export function ErrorState({
  title = "Could not load this data",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ContentFade className={cn("pc-card flex min-h-40 flex-col items-center justify-center px-5 py-10 text-center", className)}>
      <AlertTriangle className="mb-3 h-7 w-7 text-amber-400" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-pc-text">{title}</h2>
      {message && <p className="mt-1 max-w-lg text-xs leading-relaxed text-pc-text-muted">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="pc-btn-secondary mt-4 inline-flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </ContentFade>
  );
}

interface AsyncButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export function AsyncButton({ loading = false, loadingLabel = "Working…", children, className, disabled, ...props }: AsyncButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn("inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60", className)}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {loading ? loadingLabel : children}
    </button>
  );
}
