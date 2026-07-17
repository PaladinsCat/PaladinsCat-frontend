"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMatchesOverview, type MatchHourlyStats } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { formatLocalHourFromUtcBucket } from "@/lib/time-format";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

export default function PlayerActivityPanel() {
  const { t , formatNumber, formatHourFromUtcBucket} = useLocalization();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();
  const [hourlyStats, setHourlyStats] = useState<MatchHourlyStats | null>(null);
  const [droppedByHour, setDroppedByHour] = useState<Record<string, number>>({});
  const [droppedIdsByHour, setDroppedIdsByHour] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !lobbyTierReady) return;
    let active = true;
    const tierParams = isLoggedIn
      ? { tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax }
      : undefined;
    const load = async () => {
      setLoading(true);
      try {
        const overview = await fetchMatchesOverview(tierParams);
        if (!active) return;
        setHourlyStats(overview.hourly);
        setDroppedByHour(overview.droppedByHour);
        setDroppedIdsByHour(overview.droppedIdsByHour);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [authLoading, isLoggedIn, lobbyTierReady, lobbyTier.tierMin, lobbyTier.tierMax]);

  const hourly = hourlyStats?.hourly ?? [];
  const maxHourly = Math.max(...hourly.map((entry: any) => Number(entry.NA ?? 0) + Number(entry.EU ?? 0)), 1);
  const droppedRows = useMemo(() => hourly
    .map((entry: any) => ({ ...entry, droppedIds: droppedIdsByHour[`${entry.date}|${entry.hour}`] ?? [] }))
    .filter((entry: any) => entry.droppedIds.length > 0), [droppedIdsByHour, hourly]);
  const formatHour = (date: string | undefined, utcHour: number) => formatHourFromUtcBucket(date, utcHour);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("menu.playerActivity")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("playerActivity.description")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <section className="pc-card p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-pc-border/50 pb-3">
            <h2 className="mr-auto text-sm font-bold text-pc-text">{t("generated.matches.text24hRankedActivity")}</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-pc-text-muted"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t("generated.matches.na")}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-pc-text-muted"><span className="h-2 w-2 rounded-full bg-sky-500" />{t("generated.matches.eu")}</span>
            {!loading && hourlyStats && <span className="font-mono text-xs text-pc-accent">{hourlyStats.totalToday ?? 0} {t("generated.matches.total")}</span>}
          </div>

          {loading ? <LoadingPanel compact /> : <div className="space-y-1">
            <div className="grid grid-cols-[3.5rem_1fr_1fr_3rem_3rem] gap-2 border-b border-pc-border/30 px-1 pb-1 text-center text-xs uppercase text-pc-text-muted">
              <span>{t("generated.matches.localTime")}</span><span>{t("generated.matches.na")}</span><span>{t("generated.matches.eu")}</span><span>{t("generated.matches.drop")}</span><span>Σ</span>
            </div>
            {hourly.map((entry: any, index: number) => {
              const na = Number(entry.NA ?? 0);
              const eu = Number(entry.EU ?? 0);
              const total = na + eu;
              const dropped = droppedByHour[`${entry.date}|${entry.hour}`] ?? 0;
              const current = index === hourly.length - 1;
              return <div key={`${entry.date}|${entry.hour}`} className={`grid grid-cols-[3.5rem_1fr_1fr_3rem_3rem] items-center gap-2 rounded px-1 py-1 ${current ? "bg-pc-accent/8 ring-1 ring-pc-accent/20" : "hover:bg-pc-bg-secondary/50"}`}>
                <span className={`text-right font-mono text-xs ${current ? "font-semibold text-pc-accent" : "text-pc-text-muted"}`}>{formatHour(entry.date, entry.hour)}</span>
                <ActivityBar value={na} max={maxHourly} color="bg-emerald-500/80" />
                <ActivityBar value={eu} max={maxHourly} color="bg-sky-500/80" />
                <span className={`text-right font-mono text-xs ${dropped > 0 ? "text-amber-300" : "text-pc-text-muted/30"}`}>{dropped || "-"}</span>
                <span className={`text-right font-mono text-xs font-semibold ${current ? "text-pc-accent" : total > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>{total || "-"}</span>
              </div>;
            })}
          </div>}
        </section>

        <aside className="space-y-3">
          <section className="pc-card p-3 sm:p-4">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.matches.localTime")}</h2>
            {!loading && hourlyStats && <div className="mt-3 grid grid-cols-2 gap-3">
              {hourlyStats.regions.filter((region) => region.region === "NA" || region.region === "EU").map((region) => <div key={region.region} className="pc-surface-light rounded-lg border border-pc-border/50 p-3 text-center"><div className="text-xs uppercase text-pc-text-muted">{region.region}</div><div className="font-mono text-xl font-bold text-pc-accent">{formatNumber(region.totalToday)}</div><div className="text-xs text-pc-text-muted">{region.matchesPerHour}{t("generated.matches.hr")}</div></div>)}
            </div>}
          </section>

          {droppedRows.length > 0 && <section className="pc-card p-3 sm:p-4"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">{t("generated.matches.trueDropped")}</h2><span className="text-xs text-pc-text-muted">{droppedRows.reduce((sum: number, row: any) => sum + row.droppedIds.length, 0)} {t("generated.matches.ids")}</span></div><div className="space-y-2">{droppedRows.map((row: any) => <div key={`${row.date}|${row.hour}`} className="flex gap-2 text-xs"><span className="w-10 shrink-0 text-right font-mono text-pc-text-muted">{formatHour(row.date, row.hour)}</span><div className="flex flex-wrap gap-1">{row.droppedIds.map((id: string) => <Link key={id} href={`/matches/${id}`} className="font-mono text-amber-200 hover:text-pc-accent">#{id}</Link>)}</div></div>)}</div></section>}

          <section className="pc-card p-3 text-xs leading-relaxed text-pc-text-secondary sm:p-4"><span className="font-medium text-pc-text">{t("generated.matches.discoveryRunsHourlyAtHh30")}</span> {t("generated.matches.forThePreviousHourThe30MinuteOffsetAllowsMatches")}</section>
        </aside>
      </div>
    </div>
  );
}

function ActivityBar({ value, max, color }: { value: number; max: number; color: string }) {
  return <div className="flex min-w-0 items-center gap-1"><div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-pc-bg">{value > 0 && <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />}</div><span className={`w-6 text-right font-mono text-xs ${value > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>{value}</span></div>;
}
