"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, Database, HeartPulse, Users } from "lucide-react";
import { fetchPublicOperationsStats, type PublicOperationsStats } from "@/lib/operations-api";
import { ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { formatLocalDateTime } from "@/lib/time-format";
import { useLocalization } from "@/lib/localization-context";

function MetricCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  const { formatNumber } = useLocalization();
  return <div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="text-xs text-pc-text-muted">{label}</div><div className="mt-1 text-2xl font-bold text-pc-text">{typeof value === "number" ? formatNumber(value) : value}</div>{detail && <div className="mt-1 text-xs text-pc-text-muted">{detail}</div>}</div>;
}

export default function OperationsStatsPage() {
  const { t, formatDateTime } = useLocalization();
  const [data, setData] = useState<PublicOperationsStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => fetchPublicOperationsStats()
      .then((next) => { if (active) { setData(next); setError(null); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : t("generated.operations.statsLoadFailed")); });
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [t]);
  const chartMax = useMemo(() => Math.max(1, ...(data?.traffic.daily.flatMap((point) => [point.visitors, point.matches]) ?? [1])), [data]);
  if (error) return <ErrorState title={t("operations.title")} message={error} />;
  if (!data) return <RouteSkeleton variant="dashboard" />;

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="pc-heading pc-heading-lg text-pc-accent">{t("operations.title")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("operations.description")}</p></div><div className="rounded-xl border border-pc-border bg-pc-bg-elevated px-4 py-3 text-right"><div className="text-xs text-pc-text-muted">{t("operations.release")}</div><div className="font-mono text-lg font-bold text-pc-text">{data.release.version || "—"}{data.release.gitCommitShort && <span className="ml-2 text-xs font-normal text-pc-text-muted">{data.release.gitCommitShort}</span>}</div>{data.release.deployedAt && <div className="text-xs text-pc-text-muted">{t("operations.deployed", { date: formatDateTime(data.release.deployedAt) })}</div>}</div></div>

    <section><div className="mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.traffic")}</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"><MetricCard label={t("operations.activeUsers")} value={data.traffic.activeUsers} detail={t("operations.activeWindow", { minutes: Math.ceil(data.traffic.activeWindowSeconds / 60) })} /><MetricCard label={t("operations.visitorsToday")} value={data.traffic.visitorsToday} /><MetricCard label={t("operations.viewsToday")} value={data.traffic.viewsToday} /><MetricCard label={t("operations.visitorDays7d")} value={data.traffic.visitorDays7d} /><MetricCard label={t("operations.views7d")} value={data.traffic.views7d} /></div></section>

    <section><div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.catalog")}</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><MetricCard label={t("operations.matches")} value={data.catalog.matches} /><MetricCard label={t("operations.rankedMatches")} value={data.catalog.rankedMatches} /><MetricCard label={t("operations.casualMatches")} value={data.catalog.casualMatches} /><MetricCard label={t("operations.players")} value={data.catalog.players} /><MetricCard label={t("operations.registeredUsers")} value={data.catalog.registeredUsers} /><MetricCard label={t("operations.builds")} value={data.catalog.communityBuilds} /><MetricCard label={t("operations.tierLists")} value={data.catalog.tierLists} /><MetricCard label={t("operations.posts")} value={data.catalog.communityPosts} /></div></section>

    <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,0.8fr)]"><div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="mb-1 flex items-center gap-2"><Activity className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.activity")}</h2></div><p className="mb-5 text-xs text-pc-text-muted">{t("operations.activityDescription")}</p><div className="flex h-52 items-end gap-1.5 border-b border-pc-border px-1">{data.traffic.daily.map((point) => <div key={point.date} className="group flex min-w-0 flex-1 items-end justify-center gap-px" title={t("operations.chartTooltip", { date: point.date, visitors: point.visitors, matches: point.matches })}><div className="w-1/2 min-w-1 rounded-t bg-pc-accent/80" style={{ height: `${Math.max(2, (point.visitors / chartMax) * 100)}%` }} /><div className="w-1/2 min-w-1 rounded-t bg-violet-400/70" style={{ height: `${Math.max(2, (point.matches / chartMax) * 100)}%` }} /></div>)}</div><div className="mt-3 flex flex-wrap gap-4 text-xs text-pc-text-muted"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-pc-accent" />{t("operations.visitors")}</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-violet-400" />{t("operations.newMatches")}</span></div></div><div className="space-y-4"><div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="mb-3 flex items-center gap-2"><HeartPulse className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.recovery")}</h2></div><div className="space-y-3"><MetricCard label={t("operations.recovered")} value={data.catalog.recoveredMatches} /><MetricCard label={t("operations.incomplete")} value={data.catalog.incompleteMatches} /><MetricCard label={t("operations.latestMatch")} value={data.catalog.latestMatchAt ? formatDateTime(data.catalog.latestMatchAt) : "—"} /></div></div><div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4 text-xs leading-relaxed text-pc-text-muted"><BookOpen className="mb-2 h-4 w-4 text-pc-accent" />{t("operations.publicContract")}</div></div></section>
    <p className="text-right text-xs text-pc-text-muted">{t("operations.updated", { date: formatDateTime(data.generatedAt) })}</p>
  </div>;
}
