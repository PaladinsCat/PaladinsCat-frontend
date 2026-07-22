"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMatchesOverview, type MatchHourlyStats, type MatchQueueActivity } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

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

export default function PlayerActivityPanel() {
  const { t, formatNumber, formatHourFromUtcBucket } = useLocalization();
  const [hourlyStats, setHourlyStats] = useState<MatchHourlyStats | null>(null);
  const [droppedIdsByHour, setDroppedIdsByHour] = useState<Record<string, string[]>>({});
  const [selectedQueue, setSelectedQueue] = useState<"all" | number>("all");
  const [loading, setLoading] = useState(true);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        // Activity is a global match-count surface. Lobby tier preferences are
        // intentionally not sent because ID-only casual discovery has no
        // player-detail/tier data and must remain comparable with ranked.
        const overview = await fetchMatchesOverview();
        if (!active) return;
        setHourlyStats(overview.hourly);
        setDroppedIdsByHour(overview.droppedIdsByHour);
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
  const rankedHourly = hourlyStats?.hourly ?? [];
  const droppedRows = useMemo(() => rankedHourly
    .map((entry: any) => ({ ...entry, droppedIds: droppedIdsByHour[`${entry.date}|${entry.hour}`] ?? [] }))
    .filter((entry: any) => entry.droppedIds.length > 0), [droppedIdsByHour, rankedHourly]);
  const showRankedHealth = selectedQueue === 486;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("menu.playerActivity")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("playerActivity.description")}</p>
      </header>

      <section className="pc-card p-3 sm:p-4">
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

        {displayLoading ? <LoadingPanel compact className="min-h-[30rem]" /> : <div className="space-y-1">
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
            {activeRegions.map(region => <span key={region.region} className="inline-flex items-center gap-1.5 text-xs text-pc-text-muted"><span className={`h-2 w-2 rounded-full ${REGION_COLORS[region.region] ?? REGION_COLORS.Unknown}`} />{region.region} · {formatNumber(region.total24h)}</span>)}
            {activeRegions.length === 0 && <span className="text-xs text-pc-text-muted">{t("playerActivity.noMatches")}</span>}
          </div>
          <div className="grid grid-cols-[4rem_1fr_4rem] gap-2 border-b border-pc-border/30 px-1 pb-1 text-center text-xs uppercase text-pc-text-muted">
            <span>{t("generated.matches.localTime")}</span><span>{t("playerActivity.region")}</span><span>Σ</span>
          </div>
          {display.hourly.map((entry, index) => {
            const current = index === display.hourly.length - 1;
            return <div key={`${entry.date}|${entry.hour}`} className={`grid grid-cols-[4rem_1fr_4rem] items-center gap-2 rounded px-1 py-1 ${current ? "bg-pc-accent/8 ring-1 ring-pc-accent/20" : "hover:bg-pc-bg-secondary/50"}`}>
              <span className={`text-right font-mono text-xs ${current ? "font-semibold text-pc-accent" : "text-pc-text-muted"}`}>{formatHourFromUtcBucket(entry.date, entry.hour)}</span>
              <ActivityBar entry={entry} max={maxHourly} />
              <span className={`text-right font-mono text-xs font-semibold ${entry.total > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>{entry.total || "-"}</span>
            </div>;
          })}
        </div>}
      </section>

      {!displayLoading && <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {queues.map(queue => <button
          key={queue.queueId}
          type="button"
          onClick={() => setSelectedQueue(queue.queueId)}
          className={`rounded-xl border p-3 text-left transition-colors ${selectedQueue === queue.queueId ? "border-pc-accent bg-pc-accent/10" : "border-pc-border bg-pc-bg-elevated hover:border-pc-accent-mid"}`}
        >
          <div className="truncate text-xs font-semibold text-pc-text">{queue.queueName}</div>
          <div className="mt-1 flex items-end justify-between gap-2"><span className="font-mono text-lg font-bold text-pc-accent">{formatNumber(queue.total24h)}</span><span className="font-mono text-xs text-pc-text-muted">#{queue.queueId}</span></div>
        </button>)}
      </section>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="pc-card p-3 sm:p-4">
          <h2 className="text-sm font-bold text-pc-text">{t("playerActivity.regions24h")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {display.regions.map(region => <div key={region.region} className="pc-surface-light rounded-lg border border-pc-border/50 p-3 text-center"><div className="text-xs uppercase text-pc-text-muted">{region.region}</div><div className="font-mono text-xl font-bold text-pc-accent">{formatNumber(region.total24h)}</div><div className="text-xs text-pc-text-muted">{formatNumber(region.matchesPerHour)}{t("generated.matches.hr")}</div></div>)}
          </div>
        </section>

        <aside className="space-y-3">
          {showRankedHealth && droppedRows.length > 0 && <section className="pc-card p-3 sm:p-4"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-amber-300">{t("generated.matches.trueDropped")}</h2><span className="text-xs text-pc-text-muted">{droppedRows.reduce((sum: number, row: any) => sum + row.droppedIds.length, 0)} {t("generated.matches.ids")}</span></div><div className="space-y-2">{droppedRows.map((row: any) => <div key={`${row.date}|${row.hour}`} className="flex gap-2 text-xs"><span className="w-10 shrink-0 text-right font-mono text-pc-text-muted">{formatHourFromUtcBucket(row.date, row.hour)}</span><div className="flex flex-wrap gap-1">{row.droppedIds.map((id: string) => <Link key={id} href={`/matches/${id}`} className="font-mono text-amber-200 hover:text-pc-accent">#{id}</Link>)}</div></div>)}</div></section>}
          <section className="pc-card p-3 text-xs leading-relaxed text-pc-text-secondary sm:p-4"><span className="font-medium text-pc-text">{t("generated.matches.discoveryRunsHourlyAtHh30")}</span> {t("playerActivity.discoveryDescription")}</section>
        </aside>
      </div>
    </div>
  );
}

function ActivityBar({ entry, max }: { entry: DisplayActivity["hourly"][number]; max: number }) {
  const parts = Object.entries(entry.regions).filter(([, value]) => value > 0);
  return <div className="h-3 min-w-0 overflow-hidden rounded-full bg-pc-bg"><div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(entry.total / max) * 100}%` }}>{parts.map(([region, value]) => <span key={region} className={REGION_COLORS[region] ?? REGION_COLORS.Unknown} style={{ width: `${(value / entry.total) * 100}%` }} />)}</div></div>;
}
