"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";

export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("pc-content-fade", className)}>
      {children}
    </div>
  );
}

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

export function LoadingIndicator({ className }: { className?: string }) {
  const { t } = useLocalization();
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-3 text-sm font-medium text-pc-text", className)}>
      <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-pc-accent" aria-hidden="true" />
      <span>{t("async.loading")}</span>
    </span>
  );
}

export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="pc-overlay-fade absolute inset-0 z-30 flex items-center justify-center rounded-[inherit] pc-glass-dark" aria-live="polite" aria-busy="true">
      <LoadingIndicator className="gap-2" />
    </div>
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
