/**
 * Wrap children in the shared content-fade container, merging optional classes.
 * refs: none
 */
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";

/**
 * Wrap children in the shared content-fade container, merging optional classes.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ children, className }: { children: ReactNode; className?: string } -> JSX.Element`.
 */
export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("pc-content-fade", className)}>
      {children}
    </div>
  );
}

/**
 * Render a tabular metric with a minimum character width and a value-keyed fade transition to keep layout stable as the value changes.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ value, className, minWidthCh = 4, }: { value: string | number; className?: string; minWidthCh?: number; } -> JSX.Element`.
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
  return (
    <span className={cn("inline-grid tabular-nums", className)} style={{ minWidth: `${minWidthCh}ch` }}>
      <span
        key={String(value)}
        className="pc-metric-fade col-start-1 row-start-1 whitespace-nowrap"
      >
        {value}
      </span>
    </span>
  );
}

/**
 * Render the shared loading indicator inside a faded panel, selecting compact padding or the normal minimum height.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ compact = false, className, }: { compact?: boolean; className?: string; } -> JSX.Element`.
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

/**
 * Render a spinner and localized loading text in a polite live status region.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ className }: { className?: string } -> JSX.Element`.
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

/**
 * Return null when hidden; otherwise render an absolute loading overlay with aria-busy and a polite live region.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ visible }: { visible: boolean } -> JSX.Element | null`.
 */
export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pc-overlay-fade absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] pc-glass-dark" aria-live="polite" aria-busy="true">
      <LoadingIndicator className="gap-2" />
    </div>
  );
}

/**
 * Render an empty-data card with title, optional description, and optional caller-provided action.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ title, description, action, className, }: { title: string; description?: string; action?: ReactNode; className?: string; } -> JSX.Element`.
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

/**
 * Render a localized error card with optional message; show a retry button invoking onRetry only when supplied.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ title, message, onRetry, className, }: { title?: string; message?: string; onRetry?: () => void; className?: string; } -> JSX.Element`.
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

/**
 * Render a native button, forwarding its attributes and callbacks. Disable it while loading or explicitly disabled, set aria-busy, and replace children with localized loading text and a spinner during work.
 * refs: doc: documents/06-reference/design/frontend-async-ui.md
 * I/O types: `{ loading = false, children, className, disabled, ...props }: AsyncButtonProps -> JSX.Element`.
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
