"use client";

import { createContext, Fragment, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMatchesOverview, fetchPresenceHourlyStats, fetchPresenceStats, type MatchHourlyStats, type MatchQueueActivity, type PresenceHourlyStats, type PresenceStats } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import CardDetailLink from "@/components/card-detail-link";
import { useLocalization } from "@/lib/localization-context";

const REGION_COLORS: Record<string, string> = {
  NA: "bg-emerald-500",
  EU: "bg-sky-500",
  SEA: "bg-violet-500",
  JPN: "bg-fuchsia-500",
  RUS: "bg-indigo-500",
  BR: "bg-amber-500",
  OCE: "bg-cyan-500",
  LATAM: "bg-orange-500",
  Unknown: "bg-slate-500",
};

const PALADINS_2_STATEMENT = "PaladinsCat does not support Paladins 2 Project";
const ActivityStatementContext = createContext(true);

type DisplayActivity = {
  total24h: number;
  regions: Array<{ region: string; total24h: number; matchesPerHour: number }>;
  hourly: Array<{ hour: number; date: string; total: number; regions: Record<string, number> }>;
};

function rankedFallback(stats: MatchHourlyStats | null): MatchQueueActivity[] {
  if (!stats) return [];
  return [{
    queueId: 486,
    queueName: "Ranked Siege",
    ranked: true,
    total24h: stats.rankedToday ?? 0,
    regions: stats.regions.map(region => ({
      region: region.region,
      total24h: region.totalToday,
      matchesPerHour: region.matchesPerHour,
    })),
    hourly: (stats.hourly ?? []).map(entry => ({
      date: entry.date ?? "",
      hour: entry.hour,
      total: entry.total,
      regions: {
        NA: entry.NA,
        EU: entry.EU,
        SEA: entry.Asia,
        BR: entry.BR,
        OCE: entry.OCE,
        LATAM: entry.LATAM,
      },
    })),
  }];
}

function aggregateQueues(queues: MatchQueueActivity[]): DisplayActivity {
  const totals: Record<string, number> = {};
  const hourly = Array.from({ length: 24 }, (_, index) => {
    const template = queues.find(queue => queue.hourly[index])?.hourly[index];
    const regions: Record<string, number> = {};
    let total = 0;
    for (const queue of queues) {
      const entry = queue.hourly[index];
      if (!entry) continue;
      total += entry.total;
      for (const [region, value] of Object.entries(entry.regions)) {
        regions[region] = (regions[region] ?? 0) + value;
      }
    }
    for (const [region, value] of Object.entries(regions)) totals[region] = (totals[region] ?? 0) + value;
    return { date: template?.date ?? "", hour: template?.hour ?? index, total, regions };
  });
  return {
    total24h: queues.reduce((sum, queue) => sum + queue.total24h, 0),
    regions: Object.entries(totals).map(([region, total24h]) => ({
      region,
      total24h,
      matchesPerHour: Math.round(total24h / 24),
    })),
    hourly,
  };
}

export default function PlayerActivityPanel({ showStatements = true }: { showStatements?: boolean }) {
  const { t, formatNumber, formatHourFromUtcBucket } = useLocalization();
  const [hourlyStats, setHourlyStats] = useState<MatchHourlyStats | null>(null);
  const [droppedIdsByHour, setDroppedIdsByHour] = useState<Record<string, string[]>>({});
  const [presence, setPresence] = useState<PresenceStats | null>(null);
  const [presenceHourly, setPresenceHourly] = useState<PresenceHourlyStats | null>(null);
  const [activityUnavailable, setActivityUnavailable] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<"all" | number>("all");
  const [loading, setLoading] = useState(true);
  // The data request is the only loading authority here. A missed route
  // transition timer must not keep this high-traffic page blank indefinitely.
  const displayLoading = loading;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        // Activity is a global match-count surface. Lobby tier preferences are
        // intentionally not sent because ID-only casual discovery has no
        // player-detail/tier data and must remain comparable with ranked.
        const [overview, presenceResult, presenceHourlyResult] = await Promise.all([
          fetchMatchesOverview({ view: "activity-v3" }),
          fetchPresenceStats().catch(() => null),
          fetchPresenceHourlyStats().catch(() => null),
        ]);
        if (!active) return;
        if (!overview.hourly) {
          setActivityUnavailable(true);
          return;
        }
        setHourlyStats(overview.hourly);
        setDroppedIdsByHour(overview.droppedIdsByHour);
        setPresence(presenceResult);
        setPresenceHourly(presenceHourlyResult);
        setActivityUnavailable(false);
      } catch {
        // Keep the last confirmed activity visible during a transient API
        // outage. On the first load, make the failure explicit instead of
        // rendering an empty chart as if no matches were played.
        if (active) setActivityUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const queues = hourlyStats?.queues ?? rankedFallback(hourlyStats);
  const display = useMemo(() => {
    if (selectedQueue === "all") return aggregateQueues(queues);
    return queues.find(queue => queue.queueId === selectedQueue) ?? aggregateQueues(queues);
  }, [queues, selectedQueue]);
  const activeRegions = display.regions
    .filter(region => region.total24h > 0)
    .sort((left, right) => right.total24h - left.total24h);
  const maxHourly = Math.max(...display.hourly.map(entry => entry.total), 1);
  const playerHourly = useMemo(() => {
    const rows = new Map((presenceHourly?.hourly_by_region ?? []).map(entry => [`${entry.date}|${entry.hour}`, entry]));
    return display.hourly.map(slot => rows.get(`${slot.date}|${slot.hour}`) ?? {
      date: slot.date,
      hour: slot.hour,
      total: 0,
      regions: {},
    });
  }, [display.hourly, presenceHourly?.hourly_by_region]);
  const weekly = useMemo(() => (hourlyStats?.weekly ?? []).map(day => ({
    ...day,
    displayTotal: selectedQueue === "all"
      ? day.total
      : Number(day.queues[String(selectedQueue)] ?? 0),
    displayPlayers: selectedQueue === "all"
      ? Number(day.players ?? 0)
      : Number(day.playerQueues?.[String(selectedQueue)] ?? 0),
  })), [hourlyStats?.weekly, selectedQueue]);
  const rankedHourly = hourlyStats?.hourly ?? [];
  const droppedRows = useMemo(() => rankedHourly
    .map((entry: any) => ({ ...entry, droppedIds: droppedIdsByHour[`${entry.date}|${entry.hour}`] ?? [] }))
    .filter((entry: any) => entry.droppedIds.length > 0), [droppedIdsByHour, rankedHourly]);
  const showRankedHealth = selectedQueue === 486;

  return (
    <ActivityStatementContext.Provider value={showStatements}>
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("menu.playerActivity")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("playerActivity.description")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="pc-card min-w-0 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-pc-border/50 pb-3">
          <div className="mr-auto">
            <h2 className="text-sm font-bold text-pc-text">{t("playerActivity.matches24h")}</h2>
            <p className="mt-0.5 text-xs text-pc-text-muted">{t("playerActivity.queueAndRegion")}</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-pc-text-secondary">
            {t("playerActivity.queue")}
            <select
              value={selectedQueue}
              onChange={event => setSelectedQueue(event.target.value === "all" ? "all" : Number(event.target.value))}
              className="rounded-lg border border-pc-border bg-pc-bg px-2.5 py-1.5 text-xs text-pc-text"
            >
              <option value="all">{t("playerActivity.allQueues")}</option>
              {queues.map(queue => <option key={queue.queueId} value={queue.queueId}>{queue.queueName} ({queue.queueId})</option>)}
            </select>
          </label>
          {!displayLoading && <span className="font-mono text-sm font-bold text-pc-accent">{formatNumber(display.total24h)}</span>}
        </div>

        {displayLoading ? <LoadingPanel compact className="min-h-[30rem]" /> : activityUnavailable && !hourlyStats ? <div role="status" className="flex min-h-[30rem] items-center justify-center text-center text-sm text-pc-text-muted">{t("playerActivity.retrying")}</div> : <div className={showStatements ? "" : "space-y-1"}>
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
            {activeRegions.map(region => <span key={region.region} className="inline-flex items-center gap-1.5 text-xs text-pc-text-muted"><span className={`h-2 w-2 rounded-full ${REGION_COLORS[region.region] ?? REGION_COLORS.Unknown}`} />{region.region} · {formatNumber(region.total24h)}</span>)}
            {activeRegions.length === 0 && !activityUnavailable && <span className="text-xs text-pc-text-muted">{t("playerActivity.noMatches")}</span>}
            {activityUnavailable && hourlyStats && <span role="status" className="text-xs text-amber-300">{t("playerActivity.showingConfirmedWhileRetrying")}</span>}
          </div>
          <ActivityChartStatement className="mb-3 text-center" />
          <div className="grid grid-cols-[3.5rem_1fr_2.5rem] gap-2 border-b border-pc-border/30 px-1 pb-1 text-center text-xs uppercase text-pc-text-muted">
            <span>{t("generated.matches.localTime")}</span><span>{t("playerActivity.region")}</span><span>Σ</span>
          </div>
          {display.hourly.map((entry, index) => {
            const current = index === display.hourly.length - 1;
            return <Fragment key={`${entry.date}|${entry.hour}`}>
              <div className={`grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-2 rounded px-1 py-1 ${current ? "bg-pc-accent/8 ring-1 ring-pc-accent/20" : "hover:bg-pc-bg-secondary/50"}`}>
                <span className={`text-right font-mono text-xs ${current ? "font-semibold text-pc-accent" : "text-pc-text-muted"}`}>{formatHourFromUtcBucket(entry.date, entry.hour)}</span>
                <ActivityBar entry={entry} max={maxHourly} formatNumber={formatNumber} />
                <span className={`text-right font-mono text-xs font-semibold ${entry.total > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>{entry.total || "-"}</span>
              </div>
              {index < display.hourly.length - 1 && <ActivityChartStatement className="px-1 py-0.5 text-center" />}
            </Fragment>;
          })}
          <ActivityChartStatement className="px-1 py-0.5 text-center" />
        </div>}
      </section>

      <PlayerHourlyRegionCard
        loading={displayLoading}
        presence={presence}
        hourly={playerHourly}
        title={t("playerActivity.players24h")}
        subtitle={t("playerActivity.playersByRegion")}
        timeLabel={t("generated.matches.localTime")}
        regionLabel={t("playerActivity.region")}
        formatNumber={formatNumber}
        formatHour={formatHourFromUtcBucket}
      />
      </div>

      <WeeklyTrend
        loading={displayLoading}
        days={weekly}
        title={t("playerActivity.weeklyTrend")}
        subtitle={selectedQueue === "all"
          ? t("playerActivity.allQueues")
          : queues.find(queue => queue.queueId === selectedQueue)?.queueName ?? ""}
        matchesLabel={t("playerActivity.weeklyMatches")}
        playersLabel={t("playerActivity.weeklyPlayers")}
        formatNumber={formatNumber}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="pc-card p-3 sm:p-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <h2 className="shrink-0 text-sm font-bold text-pc-text">{t("playerActivity.regions24h")}</h2>
            <ActivityChartStatement className="min-w-0 text-right" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {display.regions.map((region, index) => <Fragment key={region.region}>
              <div className="pc-surface-light rounded-lg border border-pc-border/50 p-3 text-center"><div className="text-xs uppercase text-pc-text-muted">{region.region}</div><div className="font-mono text-xl font-bold text-pc-accent">{formatNumber(region.total24h)}</div><div className="text-xs text-pc-text-muted">{formatNumber(region.matchesPerHour)}{t("generated.matches.hr")}</div></div>
              {index % 2 === 1 && index < display.regions.length - 1 && <ActivityChartStatement className="col-span-full text-center sm:hidden" />}
              {index % 3 === 2 && index < display.regions.length - 1 && <ActivityChartStatement className="col-span-full hidden text-center sm:block" />}
            </Fragment>)}
            {display.regions.length > 0 && <ActivityChartStatement className="col-span-full text-center" />}
          </div>
        </section>

        <aside className="space-y-3">
          {showRankedHealth && droppedRows.length > 0 && <section className="pc-card p-3 sm:p-4"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">{t("generated.matches.trueDropped")}</h2><span className="text-xs text-pc-text-muted">{droppedRows.reduce((sum: number, row: any) => sum + row.droppedIds.length, 0)} {t("generated.matches.ids")}</span></div><div className="space-y-2">{droppedRows.map((row: any) => <div key={`${row.date}|${row.hour}`} className="flex gap-2 text-xs"><span className="w-10 shrink-0 text-right font-mono text-pc-text-muted">{formatHourFromUtcBucket(row.date, row.hour)}</span><div className="flex flex-wrap gap-1">{row.droppedIds.map((id: string) => <Link key={id} href={`/matches/${id}`} className="font-mono text-amber-200 hover:text-pc-accent">#{id}</Link>)}</div></div>)}</div></section>}
          <section className="pc-card p-3 text-xs leading-relaxed text-pc-text-secondary sm:p-4"><span className="font-medium text-pc-text">{t("generated.matches.discoveryRunsHourlyAtHh30")}</span> {t("playerActivity.discoveryDescription")}</section>
        </aside>
      </div>

      {!displayLoading && presence && <PlayerPresenceBreakdown
        presence={presence}
        formatNumber={formatNumber}
        title={t("playerActivity.players24h")}
        queueTitle={t("playerActivity.playersByQueue")}
        platformTitle={t("playerActivity.playersByPlatform")}
        regionTitle={t("playerActivity.playersByRegion")}
        publicLabel={t("playerActivity.publicPlayers24h")}
        privateLabel={t("playerActivity.privatePlayers24h")}
        unresolvedLabel={t("playerActivity.unresolvedPrivate24h")}
        unresolvedRangeLabel={t("playerActivity.unresolvedPlayerRange")}
        possibleTotalLabel={t("playerActivity.possiblePlayerTotal")}
        coverageLabel={t("playerActivity.platformCoverage")}
        overlapNote={t("playerActivity.queueOverlapNote")}
        detailsLabel={t("playerActivity.viewDetails")}
      />}
    </div>
    </ActivityStatementContext.Provider>
  );
}

function ActivityBar({
  entry,
  max,
  formatNumber,
}: {
  entry: DisplayActivity["hourly"][number];
  max: number;
  formatNumber: (value: number) => string;
}) {
  const parts = Object.entries(entry.regions).filter(([, value]) => value > 0);
  return <div className="relative h-3 min-w-0 rounded-full bg-pc-bg">
    <div className="flex h-full rounded-full" style={{ width: `${(entry.total / max) * 100}%` }}>
      {parts.map(([region, value], index) => <span
        key={region}
        className={`group relative h-full ${REGION_COLORS[region] ?? REGION_COLORS.Unknown} ${
          index === 0 ? "rounded-l-full" : ""
        } ${index === parts.length - 1 ? "rounded-r-full" : ""}`}
        style={{ width: `${(value / entry.total) * 100}%` }}
      >
        <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-pc-border bg-pc-bg-secondary px-2 py-1 font-mono text-xs font-semibold text-pc-text opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover:visible group-hover:-translate-y-0.5 group-hover:opacity-100">
          {region} · {formatNumber(value)}
        </span>
      </span>)}
    </div>
  </div>;
}

function PlayerHourlyRegionCard({
  loading,
  presence,
  hourly,
  title,
  subtitle,
  timeLabel,
  regionLabel,
  formatNumber,
  formatHour,
}: {
  loading: boolean;
  presence: PresenceStats | null;
  hourly: DisplayActivity["hourly"];
  title: string;
  subtitle: string;
  timeLabel: string;
  regionLabel: string;
  formatNumber: (value: number) => string;
  formatHour: (date: string, hour: number) => string;
}) {
  const regions = [...(presence?.public_by_region ?? [])].filter(row => row.players > 0);
  const maxHourly = Math.max(...hourly.map(entry => entry.total), 1);
  return <section className="pc-card min-w-0 p-3 sm:p-4">
    <div className="mb-3 flex items-center gap-3 border-b border-pc-border/50 pb-3">
      <div className="mr-auto">
        <h2 className="text-sm font-bold text-pc-text">{title}</h2>
        <p className="mt-0.5 text-xs text-pc-text-muted">{subtitle}</p>
      </div>
      {!loading && presence && <span className="font-mono text-sm font-bold text-pc-accent">{formatNumber(presence.public_players)}</span>}
    </div>
    {loading ? <LoadingPanel compact className="min-h-[30rem]" /> : !presence ? <div role="status" className="flex min-h-[30rem] items-center justify-center text-center text-sm text-pc-text-muted">—</div> : <div>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
        {regions.map(row => <span key={row.region} className="inline-flex items-center gap-1.5 text-xs text-pc-text-muted"><span className={`h-2 w-2 rounded-full ${REGION_COLORS[row.region] ?? REGION_COLORS.Unknown}`} />{row.region} · {formatNumber(row.players)}</span>)}
      </div>
      <ActivityChartStatement className="mb-3 text-center" />
      <div className="grid grid-cols-[3.5rem_1fr_2.5rem] gap-2 border-b border-pc-border/30 px-1 pb-1 text-center text-xs uppercase text-pc-text-muted">
        <span>{timeLabel}</span><span>{regionLabel}</span><span>Σ</span>
      </div>
      {hourly.map((entry, index) => {
        const current = index === hourly.length - 1;
        return <Fragment key={`${entry.date}|${entry.hour}`}>
          <div className={`grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-2 rounded px-1 py-1 ${current ? "bg-pc-accent/8 ring-1 ring-pc-accent/20" : "hover:bg-pc-bg-secondary/50"}`}>
            <span className={`text-right font-mono text-xs ${current ? "font-semibold text-pc-accent" : "text-pc-text-muted"}`}>{formatHour(entry.date, entry.hour)}</span>
            <ActivityBar entry={entry} max={maxHourly} formatNumber={formatNumber} />
            <span className={`text-right font-mono text-xs font-semibold ${entry.total > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>{entry.total || "-"}</span>
          </div>
          {index < hourly.length - 1 && <ActivityChartStatement className="px-1 py-0.5 text-center" />}
        </Fragment>;
      })}
      <ActivityChartStatement className="px-1 py-0.5 text-center" />
    </div>}
  </section>;
}

function WeeklyTrend({
  loading,
  days,
  title,
  subtitle,
  matchesLabel,
  playersLabel,
  formatNumber,
}: {
  loading: boolean;
  days: Array<{ date: string; displayTotal: number; displayPlayers: number }>;
  title: string;
  subtitle: string;
  matchesLabel: string;
  playersLabel: string;
  formatNumber: (value: number) => string;
}) {
  return <section className="pc-card min-w-0 p-3 sm:p-4">
    <div className="border-b border-pc-border/50 pb-3">
      <h2 className="text-sm font-bold text-pc-text">{title}</h2>
      <p className="mt-0.5 text-xs text-pc-text-muted">{subtitle}</p>
    </div>
    {loading ? <LoadingPanel compact className="min-h-[30rem]" /> : <div className="flex min-h-[30rem] flex-col">
      {days.length > 0 ? <>
        <WeeklySeriesChart
          days={days}
          label={matchesLabel}
          getValue={day => day.displayTotal}
          formatNumber={formatNumber}
          tone="matches"
        />
        <div className="my-4 border-t border-pc-border/60" />
        <WeeklySeriesChart
          days={days}
          label={playersLabel}
          getValue={day => day.displayPlayers}
          formatNumber={formatNumber}
          tone="players"
        />
      </> : <div className="flex flex-1 items-center justify-center text-sm text-pc-text-muted">—</div>}
    </div>}
  </section>;
}

function WeeklySeriesChart({
  days,
  label,
  getValue,
  formatNumber,
  tone,
}: {
  days: Array<{ date: string; displayTotal: number; displayPlayers: number }>;
  label: string;
  getValue: (day: { date: string; displayTotal: number; displayPlayers: number }) => number;
  formatNumber: (value: number) => string;
  tone: "matches" | "players";
}) {
  const max = Math.max(...days.map(getValue), 1);
  const isPlayers = tone === "players";
  const showStatements = useContext(ActivityStatementContext);

  if (!showStatements) {
    return <div className="flex min-h-0 flex-1 flex-col pt-4">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pc-text-muted">
        <span className={`h-2 w-2 rounded-full ${isPlayers ? "bg-violet-400" : "bg-pc-accent"}`} />
        {label}
      </div>
      <div className="mt-3 grid min-h-[8rem] flex-1 grid-cols-7 items-end gap-2 border-b border-pc-border/50 px-1">
        {days.map(day => {
          const value = getValue(day);
          const height = value > 0 ? Math.max(5, (value / max) * 100) : 1;
          return <div key={day.date} className="group flex h-full min-w-0 flex-col text-center">
            <div className={`mb-2 truncate font-mono text-xs font-semibold transition-colors ${
              isPlayers ? "text-violet-300 group-hover:text-violet-200" : "text-pc-text group-hover:text-pc-accent"
            }`}>
              {formatNumber(value)}
            </div>
            <div className="flex min-h-0 flex-1 items-end justify-center">
              <div
                className={`h-full w-4 max-w-[50%] min-h-px rounded-t-md transition-[height,filter] duration-500 ease-out group-hover:brightness-125 ${
                  isPlayers
                    ? "bg-gradient-to-t from-violet-500/45 to-violet-400"
                    : "bg-gradient-to-t from-pc-accent/45 to-pc-accent"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          </div>;
        })}
      </div>
      <div className="grid grid-cols-7 gap-2 px-1 pt-2">
        {days.map(day => <div key={day.date} className="truncate text-center text-xs text-pc-text-muted">
          {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}
        </div>)}
      </div>
    </div>;
  }

  return <div className="flex min-h-0 flex-1 flex-col pt-4">
    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pc-text-muted">
      <span className={`h-2 w-2 rounded-full ${isPlayers ? "bg-violet-400" : "bg-pc-accent"}`} />
      {label}
    </div>
    <div className="mt-3 grid grid-cols-7 gap-2 px-1">
      {days.map(day => {
        const value = getValue(day);
        return <div key={day.date} className={`truncate text-center font-mono text-xs font-semibold ${
          isPlayers ? "text-violet-300" : "text-pc-text"
        }`}>
          {formatNumber(value)}
        </div>;
      })}
    </div>
    <ActivityChartStatement className="my-2 text-center" />
    <div className="grid min-h-[6rem] flex-1 grid-cols-7 items-end gap-2 border-b border-pc-border/50 px-1">
      {days.map(day => {
        const value = getValue(day);
        const height = value > 0 ? Math.max(5, (value / max) * 100) : 1;
        return <div key={day.date} className="group flex h-full min-w-0 items-end justify-center text-center">
          <div
            className={`h-full w-4 max-w-[50%] min-h-px rounded-t-md transition-[height,filter] duration-500 ease-out group-hover:brightness-125 ${
              isPlayers
                ? "bg-gradient-to-t from-violet-500/45 to-violet-400"
                : "bg-gradient-to-t from-pc-accent/45 to-pc-accent"
            }`}
            style={{ height: `${height}%` }}
          />
        </div>;
      })}
    </div>
    <div className="grid grid-cols-7 gap-2 px-1 pt-2">
      {days.map(day => <div key={day.date} className="truncate text-center text-xs text-pc-text-muted">
        {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}
      </div>
      )}
    </div>
  </div>;
}

function PlayerPresenceBreakdown({
  presence,
  formatNumber,
  title,
  queueTitle,
  platformTitle,
  regionTitle,
  publicLabel,
  privateLabel,
  unresolvedLabel,
  unresolvedRangeLabel,
  possibleTotalLabel,
  coverageLabel,
  overlapNote,
  detailsLabel,
}: {
  presence: PresenceStats;
  formatNumber: (value: number) => string;
  title: string;
  queueTitle: string;
  platformTitle: string;
  regionTitle: string;
  publicLabel: string;
  privateLabel: string;
  unresolvedLabel: string;
  unresolvedRangeLabel: string;
  possibleTotalLabel: string;
  coverageLabel: string;
  overlapNote: string;
  detailsLabel: string;
}) {
  const showStatements = useContext(ActivityStatementContext);
  const queues = presence.public_by_queue ?? [];
  const platforms = presence.public_by_platform ?? [];
  const regions = [...(presence.public_by_region ?? [])]
    .sort((left, right) => Number(right.players) - Number(left.players));
  const coverage = presence.profile_coverage;
  const maxQueue = Math.max(...queues.map(queue => Number(queue.players)), 1);
  const maxPlatform = Math.max(...platforms.map(platform => Number(platform.players)), 1);
  const maxRegion = Math.max(...regions.map(region => Number(region.players)), 1);
  const known = coverage?.platform_known ?? platforms
    .filter(row => row.platform !== "Unknown")
    .reduce((sum, row) => sum + Number(row.players), 0);
  const coverageTotal = coverage?.total ?? presence.public_players;
  const coveragePercent = coverageTotal > 0 ? Math.round((known / coverageTotal) * 100) : 0;
  // Frontend and backend containers roll independently during deployment.
  // Preserve the confirmed count while an older cached/API response briefly
  // lacks the new uncertainty fields.
  const unresolvedUpper = Number(presence.unresolved_player_slots_upper ?? 0);
  const playerLowerBound = Number(
    presence.public_players_lower_bound ?? presence.public_players,
  );
  const playerUpperBound = Number(
    presence.public_players_upper_bound ?? playerLowerBound + unresolvedUpper,
  );

  return <section className="pc-card overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-pc-border/50 p-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{title}</div>
        <ActivityChartStatement className="mt-1" />
        <div className="mt-1 font-mono text-3xl font-bold text-pc-accent">{formatNumber(presence.public_players)}</div>
        <ActivityChartStatement className="mt-1" />
        <div className="text-xs text-pc-text-muted">{publicLabel}</div>
        <div className="mt-2 text-xs text-pc-text-secondary">
          {possibleTotalLabel}:{" "}
          <span className="font-mono text-pc-text">
            {formatNumber(playerLowerBound)}
            {"–"}
            {formatNumber(playerUpperBound)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <CardDetailLink href="/stats/activity/details" label={detailsLabel} />
        <div className="flex flex-wrap justify-end gap-2 text-xs">
          <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 text-violet-200">
            {privateLabel}: {formatNumber(presence.private_players)}
          </span>
          <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-amber-200">
            {unresolvedLabel}: {formatNumber(presence.unresolved_private_observations)}
          </span>
          <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-rose-200">
            {unresolvedRangeLabel}: +0–{formatNumber(unresolvedUpper)}
          </span>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 divide-y divide-pc-border/50 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      <div className="p-4">
        <h2 className="text-sm font-bold text-pc-text">{queueTitle}</h2>
        <p className="mt-1 text-xs text-pc-text-muted">{overlapNote}</p>
        <div className={`mt-4 ${showStatements ? "space-y-1" : "space-y-3"}`}>
          {queues.length > 0 && <ActivityChartStatement className="text-right" />}
          {queues.map((queue, index) => <Fragment key={queue.queue_id}>
            <MetricBar
              label={queue.queue_name}
              value={Number(queue.players)}
              max={maxQueue}
              detail={String(queue.queue_id)}
              formatNumber={formatNumber}
            />
            {index < queues.length - 1 && <ActivityChartStatement className="text-right" />}
          </Fragment>)}
          {queues.length > 0 && <ActivityChartStatement className="text-right" />}
          {queues.length === 0 && <span className="text-xs text-pc-text-muted">—</span>}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-bold text-pc-text">{platformTitle}</h2>
          <span className="font-mono text-xs text-pc-text-muted">{coverageLabel}: {coveragePercent}%</span>
        </div>
        <div className={`mt-4 ${showStatements ? "space-y-1" : "space-y-3"}`}>
          {platforms.length > 0 && <ActivityChartStatement className="text-right" />}
          {platforms.map((platform, index) => <Fragment key={platform.platform}>
            <MetricBar
              label={platform.platform}
              value={Number(platform.players)}
              max={maxPlatform}
              formatNumber={formatNumber}
              muted={platform.platform === "Unknown"}
            />
            {index < platforms.length - 1 && <ActivityChartStatement className="text-right" />}
          </Fragment>)}
          {platforms.length > 0 && <ActivityChartStatement className="text-right" />}
          {platforms.length === 0 && <span className="text-xs text-pc-text-muted">—</span>}
        </div>
        <div className="mt-6 border-t border-pc-border/50 pt-4">
          <h2 className="text-sm font-bold text-pc-text">{regionTitle}</h2>
          <div className={`mt-4 ${showStatements ? "space-y-1" : "space-y-3"}`}>
            {regions.length > 0 && <ActivityChartStatement className="text-right" />}
            {regions.map((region, index) => <Fragment key={region.region}>
              <MetricBar
                label={region.region}
                value={Number(region.players)}
                max={maxRegion}
                formatNumber={formatNumber}
                muted={region.region === "Unknown"}
              />
              {index < regions.length - 1 && <ActivityChartStatement className="text-right" />}
            </Fragment>)}
            {regions.length > 0 && <ActivityChartStatement className="text-right" />}
            {regions.length === 0 && <span className="text-xs text-pc-text-muted">—</span>}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function ActivityChartStatement({ className = "" }: { className?: string }) {
  const showStatements = useContext(ActivityStatementContext);
  if (!showStatements) return null;
  return <p className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold leading-none text-[var(--pc-status-live)] ${className}`}>
    {PALADINS_2_STATEMENT}
  </p>;
}

function MetricBar({
  label,
  value,
  max,
  detail,
  formatNumber,
  muted = false,
}: {
  label: string;
  value: number;
  max: number;
  detail?: string;
  formatNumber: (value: number) => string;
  muted?: boolean;
}) {
  return <div>
    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
      <span className="truncate font-medium text-pc-text">{label}</span>
      <span className="shrink-0 font-mono text-pc-text-secondary">{formatNumber(value)} {detail && <span className="text-pc-text-muted">#{detail}</span>}</span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-pc-bg">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${muted ? "bg-slate-500" : "bg-pc-accent"}`}
        style={{ width: `${Math.max(value > 0 ? 2 : 0, (value / max) * 100)}%` }}
      />
    </div>
  </div>;
}
