"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, Database, Eye, Gamepad2, Gauge, HeartPulse, KeyRound, RefreshCw, ScrollText, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchAdminDashboard, type AdminDashboard } from "@/lib/admin-dashboard-api";
import { ContentFade, ErrorState, LoadingPanel } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { formatLocalDateTime } from "@/lib/time-format";
import { useLocalization } from "@/lib/localization-context";

export default function AdminDashboardPage() {
  const { t, formatNumber , formatDateTime} = useLocalization();
  const formatBytes = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 2, style: "unit", unit: "byte", unitDisplay: "short" });
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.isAdmin ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await fetchAdminDashboard());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("generated.admin.page.admindashboardunavailable"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!isAdmin) { router.replace("/"); return; }
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [authLoading, user, isAdmin, load, router]);

  const apiBudget = useMemo(() => {
    const keys = dashboard?.hirez.keys ?? [];
    return keys.reduce((total, key) => ({
      used: total.used + key.used,
      limit: total.limit + key.dailyLimit,
      remaining: total.remaining + key.remaining,
    }), { used: 0, limit: 0, remaining: 0 });
  }, [dashboard]);

  if (authLoading || !user || !isAdmin) return <RouteSkeleton variant="dashboard" />;
  if (!dashboard && loading) return <RouteSkeleton variant="dashboard" />;
  if (!dashboard && error) return <ErrorState title={t("generated.admin.adminDashboardUnavailable")} message={error} onRetry={() => void load()} />;
  if (!dashboard) return null;

  const { summary } = dashboard.traffic;
  const totals = dashboard.site.totals;
  const pipeline = dashboard.site.pipeline;
  const budgetPercent = apiBudget.limit > 0 ? Math.min(100, (apiBudget.used / apiBudget.limit) * 100) : 0;
  const activeWindowMinutes = Math.ceil(summary.activeWindowSeconds / 60);

  return (
    <ContentFade className="space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-pc-text-muted">{t("generated.admin.privateOperations")}</div>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.admin.adminDashboard")}</h1>
          <p className="mt-1 text-sm text-pc-text-secondary">{t("generated.admin.trafficPlatformHealthIngestionAndHiRezQuotaTelemetry")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/notifications" className="pc-btn-secondary inline-flex items-center gap-2 text-sm"><Bell className="h-4 w-4" /> {t("generated.admin.notifications")}</Link>
          <Link href="/admin/changelog" className="pc-btn-secondary inline-flex items-center gap-2 text-sm"><ScrollText className="h-4 w-4" /> {t("generated.admin.changelog")}</Link>
          <button type="button" onClick={() => void load()} disabled={loading} className="pc-btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {t("generated.admin.refresh")}</button>
        </div>
      </header>

      {error && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">{t("generated.admin.showingThePreviousSnapshotRefreshFailed")}{" "}{error}</div>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard icon={HeartPulse} label={t("operations.activeUsers")} value={formatNumber(summary.activeUsers)} detail={t("operations.activeWindow", { minutes: activeWindowMinutes })} />
        <MetricCard icon={Users} label={t("generated.admin.visitorsToday")} value={formatNumber(summary.visitorsToday)} detail={t("generated.admin.valueYesterday", { value: formatNumber(summary.visitorsYesterday) })} />
        <MetricCard icon={Eye} label={t("generated.admin.pageViewsToday")} value={formatNumber(summary.viewsToday)} detail={t("generated.admin.valueOverSevenDays", { value: formatNumber(summary.views7d) })} />
        <MetricCard icon={Gamepad2} label={t("generated.admin.trackedMatches")} value={formatNumber(totals.matches)} detail={t("generated.admin.valueRanked", { value: formatNumber(totals.rankedMatches) })} />
        <MetricCard icon={Gauge} label={t("generated.admin.hiRezBudget")} value={formatNumber(apiBudget.remaining)} detail={t("generated.admin.budgetUsed", { used: formatNumber(apiBudget.used), limit: formatNumber(apiBudget.limit) })} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="pc-card xl:col-span-2">
          <SectionTitle icon={Activity} title={t("generated.admin.traffic14Days")} subtitle={t("generated.admin.trafficSubtitle")} />
          <TrafficChart dashboard={dashboard} />
        </div>
        <div className="pc-card">
          <SectionTitle icon={Eye} title={t("generated.admin.topPages7Days")} subtitle={t("generated.admin.topPagesSubtitle")} />
          <div className="mt-4 space-y-2">
            {dashboard.traffic.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center gap-3 rounded-lg border border-pc-border/50 bg-pc-bg/35 px-3 py-2">
                <span className="w-5 text-xs font-bold text-pc-text-muted">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-pc-text" title={page.path}>{page.path}</span>
                <span className="text-xs font-semibold tabular-nums text-pc-accent">{formatNumber(page.pageViews)}</span>
              </div>
            ))}
            {dashboard.traffic.topPages.length === 0 && <div className="py-10 text-center text-xs text-pc-text-muted">{t("generated.admin.trafficCollectionBeginsAfterThisUpdateIsDeployed")}</div>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="pc-card xl:col-span-2">
          <SectionTitle icon={KeyRound} title={t("generated.admin.hiRezApiKeys")} subtitle={t("generated.admin.apiKeysSubtitle")} />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {dashboard.hirez.keys.map((key) => <ApiKeyCard key={key.devId} apiKey={key} />)}
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-pc-text-muted"><span>{t("generated.admin.combinedDailyBudget")}</span><span>{formatNumber(budgetPercent, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{t("generated.admin.used")}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-pc-bg"><div className="h-full rounded-full bg-pc-accent transition-all duration-500" style={{ width: `${budgetPercent}%` }} /></div>
          </div>
        </div>
        <div className="pc-card">
          <SectionTitle icon={Activity} title={t("generated.admin.apiCalls24Hours")} subtitle={t("generated.admin.allKeysCombined")} />
          <HourlyBars rows={dashboard.hirez.hourly} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="pc-card">
          <SectionTitle icon={Database} title={t("generated.admin.websiteDatabase")} subtitle={t("generated.admin.databaseSubtitle")} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SmallStat label={t("generated.admin.players")} value={formatNumber(totals.players)} />
            <SmallStat label={t("generated.admin.users")} value={formatNumber(totals.registeredUsers)} />
            <SmallStat label={t("generated.admin.builds")} value={formatNumber(totals.communityBuilds)} />
            <SmallStat label={t("generated.admin.database")} value={formatBytes(totals.databaseBytes)} />
            <SmallStat label={t("generated.admin.bufferPending")} value={formatNumber(pipeline.bufferPending)} tone={pipeline.bufferPending > 0 ? "warn" : "normal"} />
            <SmallStat label={t("generated.admin.bufferFailed")} value={formatNumber(pipeline.bufferFailed)} tone={pipeline.bufferFailed > 0 ? "bad" : "normal"} />
          </div>
        </div>
        <div className="pc-card">
          <SectionTitle icon={Gauge} title={t("generated.admin.hiRezEndpoints24Hours")} subtitle={t("generated.admin.endpointsSubtitle")} />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="border-b border-pc-border text-left text-pc-text-muted"><th className="py-2 pr-3">{t("generated.admin.endpoint")}</th><th className="px-3 py-2">Consumer</th><th className="px-3 py-2 text-right">{t("generated.admin.calls")}</th><th className="py-2 pl-3 text-right">{t("generated.admin.avgMs")}</th></tr></thead>
              <tbody>{dashboard.hirez.endpoints.map((endpoint) => <tr key={`${endpoint.consumer}:${endpoint.endpoint}`} className="border-b border-pc-border/40"><td className="max-w-64 truncate py-2 pr-3 font-mono text-pc-text">{endpoint.endpoint}</td><td className="max-w-48 truncate px-3 py-2 font-mono text-pc-text-secondary">{endpoint.consumer}</td><td className="px-3 py-2 text-right tabular-nums text-pc-accent">{formatNumber(endpoint.calls)}</td><td className="py-2 pl-3 text-right tabular-nums text-pc-text-secondary">{formatNumber(endpoint.avgResponseMs)}</td></tr>)}</tbody>
            </table>
            {dashboard.hirez.endpoints.length === 0 && <div className="py-8 text-center text-xs text-pc-text-muted">{t("generated.admin.noApiCallsRecordedInTheLast24Hours")}</div>}
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-pc-text-muted">
        <span>{t("generated.admin.signedInAs")}{" "}{user.username}{t("generated.admin.thisRouteAndItsDataEndpointRequireAnAdminSession")}</span>
        <span>{t("generated.admin.snapshot")}{" "}{formatDateTime(dashboard.generatedAt)}</span>
      </footer>
      {loading && <LoadingPanel compact className="fixed bottom-20 right-5 z-50" />}
    </ContentFade>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return <div className="pc-card p-4"><div className="flex items-center gap-2 text-xs text-pc-text-muted"><Icon className="h-4 w-4 text-pc-accent" />{label}</div><div className="mt-2 text-2xl font-bold tabular-nums text-pc-text">{value}</div><div className="mt-1 text-xs text-pc-text-muted">{detail}</div></div>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Activity; title: string; subtitle: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 text-pc-accent" /><div><h2 className="text-sm font-bold text-pc-text">{title}</h2><p className="text-xs text-pc-text-muted">{subtitle}</p></div></div>;
}

function TrafficChart({ dashboard }: { dashboard: AdminDashboard }) {
  const { formatNumber, locale } = useLocalization();
  const max = Math.max(1, ...dashboard.traffic.daily.map((row) => Math.max(row.pageViews, row.visitors)));
  return <div className="mt-5 flex h-52 items-end gap-1.5 overflow-x-auto border-b border-pc-border pb-2">{dashboard.traffic.daily.map((row) => <div key={row.date} className="group flex min-w-9 flex-1 flex-col items-center justify-end gap-1"><div className="text-xs text-pc-text-muted opacity-0 transition-opacity group-hover:opacity-100">{formatNumber(row.visitors)}/{formatNumber(row.pageViews)}</div><div className="relative flex h-36 w-full max-w-9 items-end justify-center"><div className="w-5 rounded-t bg-pc-accent-deep/70" style={{ height: `${Math.max(2, (row.pageViews / max) * 100)}%` }} /><div className="absolute bottom-0 w-2 rounded-t bg-pc-accent" style={{ height: `${Math.max(2, (row.visitors / max) * 100)}%` }} /></div><span className="text-xs text-pc-text-muted">{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(`${row.date}T00:00:00Z`))}</span><span className="text-xs tabular-nums text-pc-text-secondary">{formatNumber(row.matches)}</span></div>)}</div>;
}

function ApiKeyCard({ apiKey }: { apiKey: AdminDashboard["hirez"]["keys"][number] }) {
  const { t, formatNumber, formatDateTime } = useLocalization();
  const percent = apiKey.dailyLimit > 0 ? Math.min(100, (apiKey.used / apiKey.dailyLimit) * 100) : 0;
  const color = percent >= 90 ? "bg-rose-400" : percent >= 75 ? "bg-amber-400" : "bg-pc-accent";
  const statusLabel = apiKey.status === "healthy"
    ? t("common.status.healthy")
    : apiKey.status === "limited"
      ? t("common.status.limited")
      : apiKey.status === "unhealthy"
        ? t("common.status.unhealthy")
        : t("common.status.unknown");
  const statusColor = apiKey.status === "healthy"
    ? "bg-emerald-400/15 text-emerald-300"
    : apiKey.status === "unhealthy"
      ? "bg-rose-400/15 text-rose-300"
      : "bg-amber-400/15 text-amber-300";
  return <div className="rounded-xl border border-pc-border bg-pc-bg/35 p-3"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-pc-text">{t("generated.admin.key")}{" "}{apiKey.devId}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>{statusLabel}</span></div><div className="mt-3 flex items-end justify-between"><div><div className="text-lg font-bold tabular-nums text-pc-text">{formatNumber(apiKey.remaining)}</div><div className="text-xs text-pc-text-muted">{t("generated.admin.remaining")}</div></div><div className="text-right text-xs text-pc-text-secondary">{formatNumber(apiKey.used)} / {formatNumber(apiKey.dailyLimit)}</div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pc-bg"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div><div className="mt-2 truncate text-xs text-pc-text-muted">{t("generated.admin.synced")}{" "}{apiKey.lastSyncAt ? formatDateTime(apiKey.lastSyncAt) : t("generated.admin.never")}</div></div>;
}

function HourlyBars({ rows }: { rows: Array<{ hour: string; calls: number }> }) {
  const { t , formatDateTime} = useLocalization();
  const max = Math.max(1, ...rows.map((row) => row.calls));
  return <div className="mt-5 flex h-40 items-end gap-1">{rows.map((row, index) => <div key={row.hour} className="group flex h-full min-w-0 flex-1 items-end"><div className="relative w-full rounded-t bg-pc-accent-mid/70 transition-colors group-hover:bg-pc-accent" style={{ height: `${Math.max(2, (row.calls / max) * 100)}%` }} title={t("generated.admin.value1Value2Calls", { value1: formatDateTime(row.hour), value2: row.calls })}><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-pc-text-muted opacity-0 group-hover:opacity-100">{row.calls}</span></div>{index % 6 === 0 && <span className="absolute text-xs text-pc-text-muted" />}</div>)}</div>;
}

function SmallStat({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warn" | "bad" }) {
  const color = tone === "bad" ? "text-rose-400" : tone === "warn" ? "text-amber-300" : "text-pc-text";
  return <div className="rounded-lg border border-pc-border/60 bg-pc-bg/35 p-3"><div className="text-xs text-pc-text-muted">{label}</div><div className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{value}</div></div>;
}
