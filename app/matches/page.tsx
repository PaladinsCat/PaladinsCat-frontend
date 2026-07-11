"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchMatchSearch,
  fetchRecentMatches,
  fetchMatchHourlyStats,
  fetchDroppedMatchSummary,
  fetchDroppedMatches,
  type MatchSearchResult,
  type MatchData,
  type MatchHourlyStats,
} from "@/lib/api-client";
import { useChampions } from "@/lib/champion-names";
import { useTimeZone } from "@/lib/time-zone-context";
import { formatLocalDateTime, formatLocalHourFromUtcBucket } from "@/lib/time-format";
import { AsyncButton, EmptyState, ErrorState, LoadingPanel } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";

const RANKED_QUEUE_ID = "486";
export default function MatchesPage() {
  const { timeZone } = useTimeZone();
  const [matches, setMatches] = useState<MatchSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [championId, setChampionId] = useState("");
  const [region, setRegion] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    championId: string;
    region: string;
    date: string;
    hour: string;
  } | null>(null);
  const { champions, loading: championsLoading } = useChampions();

  const [hourlyStats, setHourlyStats] = useState<MatchHourlyStats | null>(null);
  const [droppedByHour, setDroppedByHour] = useState<Record<string, number>>({});
  const [droppedIdsByHour, setDroppedIdsByHour] = useState<Record<string, string[]>>({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatsLoading(true);
      try {
        const stats = await fetchMatchHourlyStats();
        const dates = Array.from(new Set((stats.hourly ?? []).map((entry) => entry.date).filter(Boolean))) as string[];
        const droppedSummaries = await Promise.all(
          dates.map((date) => fetchDroppedMatchSummary({ date, queueId: Number(RANKED_QUEUE_ID) }).catch(() => null)),
        );
        const droppedLists = await Promise.all(
          dates.map((date) => fetchDroppedMatches({
            date,
            queueId: Number(RANKED_QUEUE_ID),
            status: "dropped",
            limit: 500,
            refresh: false,
          }).catch(() => null)),
        );
        const nextDroppedByHour: Record<string, number> = {};
        for (const day of droppedSummaries) {
          if (!day) continue;
          for (const entry of day.summary ?? []) {
            nextDroppedByHour[`${day.date}|${entry.hour}`] = Number(entry.dropped ?? 0);
          }
        }
        const nextDroppedIdsByHour: Record<string, string[]> = {};
        for (const day of droppedLists) {
          if (!day) continue;
          for (const match of day.matches ?? []) {
            const key = `${day.date}|${match.hour}`;
            nextDroppedIdsByHour[key] = [...(nextDroppedIdsByHour[key] ?? []), String(match.match_id)];
          }
        }
        if (active) {
          setHourlyStats(stats);
          setDroppedByHour(nextDroppedByHour);
          setDroppedIdsByHour(nextDroppedIdsByHour);
        }
      } catch {} finally {
        if (active) setStatsLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (appliedFilters) {
        const result = await fetchMatchSearch({
          championId: appliedFilters.championId || undefined,
          queueId: RANKED_QUEUE_ID,
          region: appliedFilters.region || undefined,
          date: appliedFilters.date || undefined,
          hour: appliedFilters.hour || undefined,
          timeZone,
          page: String(page),
          perPage: String(perPage),
        });
        setMatches(result.data);
        setTotal(result.total);
        setTotalPages(result.page.totalPages);
      } else {
        const recent = await fetchRecentMatches(perPage);
        if (recent.length > 0) {
          setMatches(recent.map((m: MatchData) => ({
            match_id: m.match_id, entry_datetime: m.entry_datetime, map: m.map,
            queue_id: m.queue_id, duration_seconds: m.duration_seconds, region: m.region,
            champion_id: 0, champion_name: "", win_status: "", kills: 0, deaths: 0, assists: 0, player_count: 10,
          })));
          setTotal(recent.length);
          setTotalPages(1);
        } else {
          setMatches([]); setTotal(0); setTotalPages(1);
        }
      }
    } catch {
      setMatches([]); setTotal(0); setTotalPages(1);
      setError("Match data unavailable. Start the PaladinsCat API on port 3005.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, timeZone, page, perPage]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const hasFilters = appliedFilters !== null;
  const handleSearch = () => {
    setAppliedFilters({ championId, region, date, hour });
    setPage(1);
  };
  const handleReset = () => {
    setChampionId("");
    setRegion("");
    setDate("");
    setHour("");
    setAppliedFilters(null);
    setPage(1);
  };

  const hourly = hourlyStats?.hourly ?? [];
  const maxHourly = Math.max(...hourly.map((h: any) => h.NA + h.EU), 1);
  const droppedRows = hourly
    .map((entry: any) => {
      const ids = droppedIdsByHour[`${entry.date}|${entry.hour}`] ?? [];
      return { ...entry, droppedIds: ids };
    })
    .filter((entry: any) => entry.droppedIds.length > 0);

  const formatHour = (date: string | undefined, utcHour: number) => formatLocalHourFromUtcBucket(date, utcHour);

  const isCurrentHour = (entry: any, idx: number) => idx === hourly.length - 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Matches</h1>
        <p className="text-pc-text-secondary text-sm mt-1">Search ranked match history and view live activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search + Results (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Filters */}
          <div className="pc-card">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-pc-text-muted mb-1">Champion</label>
                <select value={championId} onChange={(e) => setChampionId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
                  disabled={championsLoading}>
                  <option value="">All</option>
                  {champions?.sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-pc-text-muted mb-1">Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent">
                  <option value="">All</option>
                  <option value="NA">NA</option>
                  <option value="EU">EU</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-pc-text-muted mb-1">Date ({timeZone})</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent" />
              </div>
              <div>
                <label className="block text-xs text-pc-text-muted mb-1">Hour ({timeZone})</label>
                <select value={hour} onChange={(e) => setHour(e.target.value)} disabled={!date}
                  className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent disabled:opacity-50">
                  <option value="">All hours</option>
                  {Array.from({ length: 24 }, (_, value) => (
                    <option key={value} value={String(value)}>
                      {String(value).padStart(2, "0")}:00 – {String(value).padStart(2, "0")}:59
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <AsyncButton onClick={handleSearch} loading={loading} loadingLabel="Searching…"
                className="flex-1 px-4 py-1.5 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm hover:bg-pc-accent-secondary transition-colors">
                Search
              </AsyncButton>
              <button onClick={handleReset}
                className="px-4 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text-secondary text-sm hover:bg-pc-bg-elevated transition-colors">
                Reset
              </button>
            </div>
          </div>

          {/* Results */}
          {loading && <DataTableSkeleton rows={8} />}
          {error && !loading && <ErrorState message={error} onRetry={() => void loadMatches()} />}
          {!loading && !error && matches.length === 0 && (
            <EmptyState
              title={hasFilters ? "No matching games" : "No ranked matches available"}
              description={hasFilters ? "Try widening the champion, region, date, or hour filters." : "New ranked matches will appear here after ingestion."}
            />
          )}
          {!loading && !error && matches.length > 0 && (
            <>
              {hasFilters && (
                <div className="text-xs text-pc-text-muted">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total.toLocaleString()} ranked matches
                </div>
              )}
              <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-pc-border bg-pc-bg-secondary text-pc-text-muted text-left text-xs">
                        <th className="px-4 py-3">Match ID</th>
                        <th className="px-4 py-3">Map</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m) => <MatchRow key={m.match_id} match={m} />)}
                    </tbody>
                  </table>
                </div>
              </div>
              {hasFilters && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text text-xs disabled:opacity-50 hover:bg-pc-bg-secondary transition-colors">
                    ← Prev
                  </button>
                  <span className="text-xs text-pc-text-secondary px-4">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text text-xs disabled:opacity-50 hover:bg-pc-bg-secondary transition-colors">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Hourly Activity (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Title outside card */}
          <div className="flex items-center justify-between">
            <h2 className="pc-card-title mb-0 shadow-sm">24h Ranked Activity</h2>
            <span className="text-xs uppercase tracking-wider text-pc-text-muted">Local time</span>
          </div>

          <div className="pc-card p-3">
            {/* Region legend + total */}
            <div className="flex items-center gap-4 mb-3 pb-2 border-b border-pc-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-pc-text-muted">NA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                <span className="text-xs text-pc-text-muted">EU</span>
              </div>
              {!statsLoading && hourlyStats && (
                <span className="ml-auto text-xs text-pc-accent font-mono">{hourlyStats.totalToday ?? 0} total</span>
              )}
            </div>

            {statsLoading ? (
              <LoadingPanel compact label="Loading activity…" detail="Combining regional and dropped-match totals." />
            ) : (
              <div className="space-y-px">
                {/* Header */}
                <div className="flex items-center gap-2 px-1 pb-1 border-b border-pc-border/30">
                  <span className="w-10 text-xs text-pc-text-muted font-medium" />
                  <span className="flex-1 text-xs text-pc-text-muted font-medium text-center">NA</span>
                  <span className="w-px h-3 bg-pc-border/30" />
                  <span className="flex-1 text-xs text-pc-text-muted font-medium text-center">EU</span>
                  <span className="w-px h-3 bg-pc-border/30" />
                  <span className="w-8 text-xs text-pc-text-muted font-medium text-right">Drop</span>
                  <span className="w-px h-3 bg-pc-border/30" />
                  <span className="w-8 text-xs text-pc-text-muted font-medium text-right">Σ</span>
                </div>
                {hourly.map((entry: any, idx: number) => {
                  const na = entry.NA ?? 0;
                  const eu = entry.EU ?? 0;
                  const dropped = droppedByHour[`${entry.date}|${entry.hour}`] ?? 0;
                  const sum = na + eu;
                  const naW = maxHourly > 0 ? (na / maxHourly) * 100 : 0;
                  const euW = maxHourly > 0 ? (eu / maxHourly) * 100 : 0;
                  const now = isCurrentHour(entry, idx);
                  const active = sum > 0;
                  const time = formatHour(entry.date, entry.hour);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded px-1 py-0.5 transition-colors ${
                        now ? "bg-pc-accent/8 ring-1 ring-pc-accent/20" : active ? "hover:bg-pc-bg-secondary/50" : ""
                      }`}
                    >
                      <span className={`w-10 text-right text-xs font-mono shrink-0 ${now ? "text-pc-accent font-semibold" : "text-pc-text-muted"}`}>
                        {time}
                      </span>
                      {/* NA */}
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-3 bg-pc-bg rounded-full overflow-hidden">
                          {na > 0 && <div className="h-full rounded-full bg-emerald-500/80 transition-all duration-500" style={{ width: `${naW}%` }} />}
                        </div>
                        <span className={`w-5 text-right text-xs font-mono shrink-0 ${na > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>
                          {na > 0 ? na : "0"}
                        </span>
                      </div>
                      <span className="w-px h-3 bg-pc-border/20 shrink-0" />
                      {/* EU */}
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-3 bg-pc-bg rounded-full overflow-hidden">
                          {eu > 0 && <div className="h-full rounded-full bg-sky-500/80 transition-all duration-500" style={{ width: `${euW}%` }} />}
                        </div>
                        <span className={`w-5 text-right text-xs font-mono shrink-0 ${eu > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>
                          {eu > 0 ? eu : "0"}
                        </span>
                      </div>
                      <span className="w-px h-3 bg-pc-border/20 shrink-0" />
                      {/* Dropped/corrupt match debt is operator-visible only: this number is sourced from
                         dropped_matches via the canonical debt ledger and must not drive any frontend fetch loop. */}
                      <span className={`w-8 text-right text-xs font-mono shrink-0 ${dropped > 0 ? "text-amber-300" : "text-pc-text-muted/30"}`}>
                        {dropped > 0 ? dropped : "-"}
                      </span>
                      <span className="w-px h-3 bg-pc-border/20 shrink-0" />
                      {/* Total */}
                      <span className={`w-8 text-right text-xs font-mono font-semibold shrink-0 ${now ? "text-pc-accent" : sum > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>
                        {sum > 0 ? sum : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Region totals */}
            {!statsLoading && hourlyStats && (
              <div className="mt-3 pt-3 border-t border-pc-border/50 grid grid-cols-2 gap-3">
                {hourlyStats.regions.filter((r) => r.region === "NA" || r.region === "EU").map((r) => (
                  <div key={r.region} className="pc-surface-light rounded-lg p-2 text-center border border-pc-border/50">
                    <div className="text-xs text-pc-text-muted uppercase tracking-wider">{r.region}</div>
                    <div className="text-lg font-mono font-bold text-pc-accent">{r.totalToday.toLocaleString()}</div>
                    <div className="text-xs text-pc-text-muted">{r.matchesPerHour}/hr</div>
                  </div>
                ))}
              </div>
            )}

            {!statsLoading && droppedRows.length > 0 && (
              <div className="mt-3 pt-3 border-t border-pc-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-amber-300/90">True dropped</span>
                  <span className="text-xs text-pc-text-muted">
                    {droppedRows.reduce((sum: number, row: any) => sum + row.droppedIds.length, 0)} IDs
                  </span>
                </div>
                <div className="space-y-1">
                  {droppedRows.map((row: any) => (
                    <div key={`${row.date}|${row.hour}`} className="flex items-start gap-2 text-xs">
                      <span className="w-10 shrink-0 text-right font-mono text-pc-text-muted">{formatHour(row.date, row.hour)}</span>
                      <div className="flex flex-wrap gap-1">
                        {row.droppedIds.map((id: string) => (
                          <Link
                            key={id}
                            href={`/matches/${id}`}
                            className="font-mono text-amber-200 hover:text-pc-accent transition-colors"
                          >
                            #{id}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Discovery logic note */}
          <div className="pc-card p-3">
            <div className="text-xs text-pc-text-secondary leading-relaxed">
              <span className="text-pc-text font-medium">Discovery runs hourly at HH:30</span> for the previous hour. The 30-minute offset allows matches to finish for the hour period — e.g. waiting for matches started at HH:59. Expect global tracking to be up to 1h 30m behind real time. However, you can search your match as soon as it ends — it will be immediately included in statistics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: MatchSearchResult }) {
  const duration = formatDuration(match.duration_seconds);
  const date = formatLocalDateTime(match.entry_datetime);
  const href = `/matches/${match.match_id}`;
  return (
    <tr className="group border-b border-pc-border/50 hover:bg-pc-bg-secondary transition-colors">
      <td className="px-4 py-3">
        <Link href={href} className="font-medium text-pc-accent group-hover:text-pc-accent-secondary transition-colors text-xs">#{match.match_id}</Link>
      </td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs"><Link href={href}>{match.map}</Link></td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs"><Link href={href}>{match.region}</Link></td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs"><Link href={href}>{duration}</Link></td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs"><Link href={href}>{date}</Link></td>
    </tr>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
