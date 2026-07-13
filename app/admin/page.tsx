"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, Database, Eye, Gamepad2, Gauge, KeyRound, Languages, RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchAdminDashboard, type AdminDashboard } from "@/lib/admin-dashboard-api";
import { ContentFade, ErrorState, LoadingPanel } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { formatLocalDateTime } from "@/lib/time-format";

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value;
  let index = -1;
  do { amount /= 1024; index += 1; } while (amount >= 1024 && index < units.length - 1);
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${units[index]}`;
}

function shortDay(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(date);
}

export default function AdminDashboardPage() {
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
      setError(reason instanceof Error ? reason.message : "Admin dashboard unavailable.");
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
  if (!dashboard && error) return <ErrorState title="Admin dashboard unavailable" message={error} onRetry={() => void load()} />;
  if (!dashboard) return null;

  const { summary } = dashboard.traffic;
  const totals = dashboard.site.totals;
  const pipeline = dashboard.site.pipeline;
  const budgetPercent = apiBudget.limit > 0 ? Math.min(100, (apiBudget.used / apiBudget.limit) * 100) : 0;

  return (
    <ContentFade className="space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-pc-text-muted">Private operations</div>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-pc-text-secondary">Traffic, platform health, ingestion, and Hi-Rez quota telemetry.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/notifications" className="pc-btn-secondary inline-flex items-center gap-2 text-sm"><Bell className="h-4 w-4" /> Notifications</Link>
          <Link href="/admin/localization" className="pc-btn-secondary inline-flex items-center gap-2 text-sm"><Languages className="h-4 w-4" /> Localization</Link>
          <button type="button" onClick={() => void load()} disabled={loading} className="pc-btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      {error && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">Showing the previous snapshot. Refresh failed: {error}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Users} label="Visitors today" value={summary.visitorsToday.toLocaleString()} detail={`${summary.visitorsYesterday.toLocaleString()} yesterday`} />
        <MetricCard icon={Eye} label="Page views today" value={summary.viewsToday.toLocaleString()} detail={`${summary.views7d.toLocaleString()} over 7 days`} />
        <MetricCard icon={Gamepad2} label="Tracked matches" value={totals.matches.toLocaleString()} detail={`${totals.rankedMatches.toLocaleString()} ranked`} />
        <MetricCard icon={Gauge} label="Hi-Rez budget" value={apiBudget.remaining.toLocaleString()} detail={`${apiBudget.used.toLocaleString()} / ${apiBudget.limit.toLocaleString()} used`} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="pc-card xl:col-span-2">
          <SectionTitle icon={Activity} title="Traffic — 14 days" subtitle="Anonymous browser visitors and page views" />
          <TrafficChart dashboard={dashboard} />
        </div>
        <div className="pc-card">
          <SectionTitle icon={Eye} title="Top pages — 7 days" subtitle="Normalized public routes" />
          <div className="mt-4 space-y-2">
            {dashboard.traffic.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center gap-3 rounded-lg border border-pc-border/50 bg-pc-bg/35 px-3 py-2">
                <span className="w-5 text-xs font-bold text-pc-text-muted">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-pc-text" title={page.path}>{page.path}</span>
                <span className="text-xs font-semibold tabular-nums text-pc-accent">{page.pageViews.toLocaleString()}</span>
              </div>
            ))}
            {dashboard.traffic.topPages.length === 0 && <div className="py-10 text-center text-xs text-pc-text-muted">Traffic collection begins after this update is deployed.</div>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="pc-card xl:col-span-2">
          <SectionTitle icon={KeyRound} title="Hi-Rez API keys" subtitle="Stored relay state; viewing this page does not spend quota" />
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {dashboard.hirez.keys.map((key) => <ApiKeyCard key={key.devId} apiKey={key} />)}
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-[11px] text-pc-text-muted"><span>Combined daily budget</span><span>{budgetPercent.toFixed(1)}% used</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-pc-bg"><div className="h-full rounded-full bg-pc-accent transition-all duration-500" style={{ width: `${budgetPercent}%` }} /></div>
          </div>
        </div>
        <div className="pc-card">
          <SectionTitle icon={Activity} title="API calls — 24 hours" subtitle="All keys combined" />
          <HourlyBars rows={dashboard.hirez.hourly} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="pc-card">
          <SectionTitle icon={Database} title="Website & database" subtitle="Current stored platform totals" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SmallStat label="Players" value={totals.players.toLocaleString()} />
            <SmallStat label="Users" value={totals.registeredUsers.toLocaleString()} />
            <SmallStat label="Builds" value={totals.communityBuilds.toLocaleString()} />
            <SmallStat label="Database" value={formatBytes(totals.databaseBytes)} />
            <SmallStat label="Buffer pending" value={pipeline.bufferPending.toLocaleString()} tone={pipeline.bufferPending > 0 ? "warn" : "normal"} />
            <SmallStat label="Buffer failed" value={pipeline.bufferFailed.toLocaleString()} tone={pipeline.bufferFailed > 0 ? "bad" : "normal"} />
          </div>
        </div>
        <div className="pc-card">
          <SectionTitle icon={Gauge} title="Hi-Rez endpoints — 24 hours" subtitle="Calls and mean relay response time" />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="border-b border-pc-border text-left text-pc-text-muted"><th className="py-2 pr-3">Endpoint</th><th className="px-3 py-2 text-right">Calls</th><th className="py-2 pl-3 text-right">Avg ms</th></tr></thead>
              <tbody>{dashboard.hirez.endpoints.map((endpoint) => <tr key={endpoint.endpoint} className="border-b border-pc-border/40"><td className="max-w-64 truncate py-2 pr-3 font-mono text-pc-text">{endpoint.endpoint}</td><td className="px-3 py-2 text-right tabular-nums text-pc-accent">{endpoint.calls.toLocaleString()}</td><td className="py-2 pl-3 text-right tabular-nums text-pc-text-secondary">{endpoint.avgResponseMs.toLocaleString()}</td></tr>)}</tbody>
            </table>
            {dashboard.hirez.endpoints.length === 0 && <div className="py-8 text-center text-xs text-pc-text-muted">No API calls recorded in the last 24 hours.</div>}
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-pc-text-muted">
        <span>Signed in as {user.username}. This route and its data endpoint require an admin session.</span>
        <span>Snapshot {formatLocalDateTime(dashboard.generatedAt)}</span>
      </footer>
      {loading && <LoadingPanel compact className="fixed bottom-20 right-5 z-50 rounded-xl border border-pc-border bg-pc-bg-elevated px-4 shadow-xl" />}
    </ContentFade>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) {
  return <div className="pc-card p-4"><div className="flex items-center gap-2 text-xs text-pc-text-muted"><Icon className="h-4 w-4 text-pc-accent" />{label}</div><div className="mt-2 text-2xl font-bold tabular-nums text-pc-text">{value}</div><div className="mt-1 text-[10px] text-pc-text-muted">{detail}</div></div>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: typeof Activity; title: string; subtitle: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 text-pc-accent" /><div><h2 className="text-sm font-bold text-pc-text">{title}</h2><p className="text-[10px] text-pc-text-muted">{subtitle}</p></div></div>;
}

function TrafficChart({ dashboard }: { dashboard: AdminDashboard }) {
  const max = Math.max(1, ...dashboard.traffic.daily.map((row) => Math.max(row.pageViews, row.visitors)));
  return <div className="mt-5 flex h-52 items-end gap-1.5 overflow-x-auto border-b border-pc-border pb-2">{dashboard.traffic.daily.map((row) => <div key={row.date} className="group flex min-w-9 flex-1 flex-col items-center justify-end gap-1"><div className="text-[9px] text-pc-text-muted opacity-0 transition-opacity group-hover:opacity-100">{row.visitors}/{row.pageViews}</div><div className="relative flex h-36 w-full max-w-9 items-end justify-center"><div className="w-5 rounded-t bg-pc-accent-deep/70" style={{ height: `${Math.max(2, (row.pageViews / max) * 100)}%` }} /><div className="absolute bottom-0 w-2 rounded-t bg-pc-accent" style={{ height: `${Math.max(2, (row.visitors / max) * 100)}%` }} /></div><span className="text-[9px] text-pc-text-muted">{shortDay(row.date)}</span><span className="text-[8px] tabular-nums text-pc-text-secondary">{row.matches}</span></div>)}</div>;
}

function ApiKeyCard({ apiKey }: { apiKey: AdminDashboard["hirez"]["keys"][number] }) {
  const percent = apiKey.dailyLimit > 0 ? Math.min(100, (apiKey.used / apiKey.dailyLimit) * 100) : 0;
  const color = percent >= 90 ? "bg-rose-400" : percent >= 75 ? "bg-amber-400" : "bg-pc-accent";
  return <div className="rounded-xl border border-pc-border bg-pc-bg/35 p-3"><div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-pc-text">Key {apiKey.devId}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${apiKey.status === "healthy" ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"}`}>{apiKey.status}</span></div><div className="mt-3 flex items-end justify-between"><div><div className="text-lg font-bold tabular-nums text-pc-text">{apiKey.remaining.toLocaleString()}</div><div className="text-[9px] text-pc-text-muted">remaining</div></div><div className="text-right text-[10px] text-pc-text-secondary">{apiKey.used.toLocaleString()} / {apiKey.dailyLimit.toLocaleString()}</div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pc-bg"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div><div className="mt-2 truncate text-[9px] text-pc-text-muted">Synced {apiKey.lastSyncAt ? formatLocalDateTime(apiKey.lastSyncAt) : "never"}</div></div>;
}

function HourlyBars({ rows }: { rows: Array<{ hour: string; calls: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.calls));
  return <div className="mt-5 flex h-40 items-end gap-1">{rows.map((row, index) => <div key={row.hour} className="group flex h-full min-w-0 flex-1 items-end"><div className="relative w-full rounded-t bg-pc-accent-mid/70 transition-colors group-hover:bg-pc-accent" style={{ height: `${Math.max(2, (row.calls / max) * 100)}%` }} title={`${formatLocalDateTime(row.hour)}: ${row.calls} calls`}><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-pc-text-muted opacity-0 group-hover:opacity-100">{row.calls}</span></div>{index % 6 === 0 && <span className="absolute text-[8px] text-pc-text-muted" />}</div>)}</div>;
}

function SmallStat({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warn" | "bad" }) {
  const color = tone === "bad" ? "text-rose-400" : tone === "warn" ? "text-amber-300" : "text-pc-text";
  return <div className="rounded-lg border border-pc-border/60 bg-pc-bg/35 p-3"><div className="text-[10px] text-pc-text-muted">{label}</div><div className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{value}</div></div>;
}
