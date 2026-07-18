"use client";

import { useEffect, useState } from "react";
import { Database, HeartPulse, Users } from "lucide-react";
import { fetchPublicOperationsStats, type PublicOperationsStats } from "@/lib/operations-api";
import { ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { formatLocalDateTime } from "@/lib/time-format";
import { useLocalization } from "@/lib/localization-context";

function MetricCard({ label, value, companionValue, detail }: { label: string; value: number | string; companionValue?: number; detail?: string }) {
  const { formatNumber } = useLocalization();
  return <div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="text-xs text-pc-text-muted">{label}</div><div className="mt-1 text-2xl font-bold text-pc-text">{typeof value === "number" ? formatNumber(value) : value}{companionValue != null && <><span className="px-1.5 font-normal text-pc-text-muted">/</span><span>{formatNumber(companionValue)}</span></>}</div>{detail && <div className="mt-1 text-xs text-pc-text-muted">{detail}</div>}</div>;
}

export default function OperationsStatsPage() {
  const { t, formatDateTime, formatPercent } = useLocalization();
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
  if (error) return <ErrorState title={t("operations.title")} message={error} />;
  if (!data) return <RouteSkeleton variant="dashboard" />;
  const { totalMatches, directMatches, recoveredMatches } = data.ingestCoverage;
  const coveredMatches = directMatches + recoveredMatches;
  const shareOfTotal = (value: number) => totalMatches > 0 ? (value / totalMatches) * 100 : 0;

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="pc-heading pc-heading-lg text-pc-accent">{t("operations.title")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("operations.description")}</p></div><div className="rounded-xl border border-pc-border bg-pc-bg-elevated px-4 py-3 text-right"><div className="text-xs text-pc-text-muted">{t("operations.release")}</div><div className="font-mono text-lg font-bold text-pc-text">{data.release.version || "—"}{data.release.gitCommitShort && <span className="ml-2 text-xs font-normal text-pc-text-muted">{data.release.gitCommitShort}</span>}</div>{data.release.deployedAt && <div className="text-xs text-pc-text-muted">{t("operations.deployed", { date: formatDateTime(data.release.deployedAt) })}</div>}</div></div>

    <section><div className="mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.traffic")}</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"><MetricCard label={t("operations.activeUsers")} value={data.traffic.activeUsers} detail={t("operations.activeWindow", { minutes: Math.ceil(data.traffic.activeWindowSeconds / 60) })} /><MetricCard label={t("operations.visitorsToday")} value={data.traffic.visitorsToday} /><MetricCard label={t("operations.viewsToday")} value={data.traffic.viewsToday} /><MetricCard label={t("operations.visitorDays7d")} value={data.traffic.visitorDays7d} /><MetricCard label={t("operations.views7d")} value={data.traffic.views7d} /></div></section>

    <section><div className="mb-3 flex items-center gap-2"><Database className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.catalog")}</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><MetricCard label={t("operations.matches")} value={data.catalog.matches} /><MetricCard label={t("operations.rankedMatches")} value={data.catalog.rankedMatches} /><MetricCard label={t("operations.casualMatches")} value={data.catalog.casualMatches} /><MetricCard label={t("operations.players")} value={data.catalog.players} /><MetricCard label={t("operations.registeredVerifiedUsers")} value={data.catalog.registeredUsers} companionValue={data.catalog.verifiedUsers} /><MetricCard label={t("operations.builds")} value={data.catalog.communityBuilds} /><MetricCard label={t("operations.tierLists")} value={data.catalog.tierLists} /><MetricCard label={t("operations.posts")} value={data.catalog.communityPosts} /></div></section>

    <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-pc-accent" /><h2 className="text-sm font-bold text-pc-text">{t("operations.ingestCoverage")}</h2></div><p className="mt-1 text-xs text-pc-text-muted">{t("operations.ingestCoverageDescription")}</p></div><div className="rounded-lg border border-pc-accent/30 bg-pc-accent/10 px-3 py-2 text-right"><div className="text-xs text-pc-text-muted">{t("operations.recovery")}</div><div className="text-lg font-bold text-pc-accent">{formatPercent(shareOfTotal(coveredMatches))}</div></div></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><MetricCard label={t("operations.ingestTotal")} value={totalMatches} /><MetricCard label={t("operations.ingestDirect")} value={directMatches} detail={formatPercent(shareOfTotal(directMatches))} /><MetricCard label={t("operations.ingestRecovered")} value={recoveredMatches} detail={formatPercent(shareOfTotal(recoveredMatches))} /></div></section>
    <p className="text-right text-xs text-pc-text-muted">{t("operations.updated", { date: formatDateTime(data.generatedAt) })}</p>
  </div>;
}
