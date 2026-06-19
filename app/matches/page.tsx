"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchReferenceRegions,
  fetchMatchSearch,
  fetchRecentMatches,
  fetchMatchHourlyStats,
  type MatchSearchResult,
  type MatchData,
  type MatchHourlyStats,
} from "@/lib/api-client";
import { useChampions } from "@/lib/champion-names";

const RANKED_QUEUE_ID = "486";
const TIMEZONES = [
  { offset: -12, label: "UTC-12" }, { offset: -11, label: "UTC-11" }, { offset: -10, label: "UTC-10" },
  { offset: -9, label: "UTC-9" }, { offset: -8, label: "UTC-8 (PST)" }, { offset: -7, label: "UTC-7 (MST)" },
  { offset: -6, label: "UTC-6 (CST)" }, { offset: -5, label: "UTC-5 (EST)" }, { offset: -4, label: "UTC-4" },
  { offset: -3, label: "UTC-3" }, { offset: -2, label: "UTC-2" }, { offset: -1, label: "UTC-1" },
  { offset: 0, label: "UTC+0" }, { offset: 1, label: "UTC+1 (CET)" }, { offset: 2, label: "UTC+2" },
  { offset: 3, label: "UTC+3" }, { offset: 4, label: "UTC+4" }, { offset: 5, label: "UTC+5" },
  { offset: 5.5, label: "UTC+5:30 (IST)" }, { offset: 6, label: "UTC+6" }, { offset: 7, label: "UTC+7" },
  { offset: 8, label: "UTC+8 (CST)" }, { offset: 9, label: "UTC+9 (JST)" }, { offset: 10, label: "UTC+10" },
  { offset: 11, label: "UTC+11" }, { offset: 12, label: "UTC+12" },
];

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [championId, setChampionId] = useState("");
  const [region, setRegion] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hasFilters, setHasFilters] = useState(false);
  const { champions, loading: championsLoading } = useChampions();
  const [referenceRegions, setReferenceRegions] = useState<Array<{ region?: string; region_code?: string; name?: string; region_name?: string }>>([]);

  const [hourlyStats, setHourlyStats] = useState<MatchHourlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tzOffset, setTzOffset] = useState(() => -new Date().getTimezoneOffset() / 60);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatsLoading(true);
      try {
        const stats = await fetchMatchHourlyStats();
        if (active) setHourlyStats(stats);
      } catch {} finally {
        if (active) setStatsLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    fetchReferenceRegions().then(setReferenceRegions).catch(() => {});
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (hasFilters) {
        const result = await fetchMatchSearch({
          championId: championId || undefined,
          queueId: RANKED_QUEUE_ID,
          region: region || undefined,
          from: from || undefined,
          to: to || undefined,
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
  }, [hasFilters, championId, region, from, to, page, perPage]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const handleSearch = () => { setHasFilters(!!championId || !!region || !!from || !!to); setPage(1); };
  const handleReset = () => { setChampionId(""); setRegion(""); setFrom(""); setTo(""); setHasFilters(false); setPage(1); };
  useEffect(() => { if (hasFilters) loadMatches(); }, [page, hasFilters, loadMatches]);

  const hourly = hourlyStats?.hourly ?? [];
  const maxHourly = Math.max(...hourly.map((h: any) => h.NA + h.EU), 1);

  // Convert UTC hour to local time with offset
  const formatHour = (utcHour: number) => {
    let h = (utcHour + tzOffset) % 24;
    if (h < 0) h += 24;
    return `${String(Math.floor(h)).padStart(2, "0")}:00`;
  };

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
                  {referenceRegions.map((r) => {
                    const value = r.region ?? r.region_code ?? "";
                    if (!value) return null;
                    return <option key={value} value={value}>{r.name ?? r.region_name ?? value}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-pc-text-muted mb-1">From</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent" />
              </div>
              <div>
                <label className="block text-xs text-pc-text-muted mb-1">To</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleSearch}
                className="flex-1 px-4 py-1.5 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm hover:bg-pc-accent-secondary transition-colors">
                Search
              </button>
              <button onClick={handleReset}
                className="px-4 py-1.5 rounded-lg bg-pc-bg border border-pc-border text-pc-text-secondary text-sm hover:bg-pc-bg-elevated transition-colors">
                Reset
              </button>
            </div>
          </div>

          {/* Results */}
          {loading && <div className="text-center py-12 text-pc-text-secondary text-sm">Loading matches...</div>}
          {error && <div className="text-center py-12 text-red-400 text-sm">{error}</div>}
          {!loading && !error && matches.length === 0 && (
            <div className="text-center py-12 text-pc-text-secondary text-sm">
              {hasFilters ? "No matches found for these filters." : "No ranked matches available."}
            </div>
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
            <select
              value={tzOffset}
              onChange={(e) => setTzOffset(Number(e.target.value))}
              className="text-[10px] px-1.5 py-0.5 rounded bg-pc-bg border border-pc-border text-pc-text-muted focus:outline-none focus:border-pc-accent"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.offset} value={tz.offset}>{tz.label}</option>
              ))}
            </select>
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
              <div className="text-pc-text-muted text-sm text-center py-8">Loading…</div>
            ) : (
              <div className="space-y-px">
                {/* Header */}
                <div className="flex items-center gap-2 px-1 pb-1 border-b border-pc-border/30">
                  <span className="w-10 text-[10px] text-pc-text-muted font-medium" />
                  <span className="flex-1 text-[10px] text-pc-text-muted font-medium text-center">NA</span>
                  <span className="w-px h-3 bg-pc-border/30" />
                  <span className="flex-1 text-[10px] text-pc-text-muted font-medium text-center">EU</span>
                  <span className="w-px h-3 bg-pc-border/30" />
                  <span className="w-8 text-[10px] text-pc-text-muted font-medium text-right">Σ</span>
                </div>
                {hourly.map((entry: any, idx: number) => {
                  const na = entry.NA ?? 0;
                  const eu = entry.EU ?? 0;
                  const sum = na + eu;
                  const naW = maxHourly > 0 ? (na / maxHourly) * 100 : 0;
                  const euW = maxHourly > 0 ? (eu / maxHourly) * 100 : 0;
                  const now = isCurrentHour(entry, idx);
                  const active = sum > 0;
                  const time = formatHour(entry.hour);
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
                        <span className={`w-5 text-right text-[11px] font-mono shrink-0 ${na > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>
                          {na > 0 ? na : "0"}
                        </span>
                      </div>
                      <span className="w-px h-3 bg-pc-border/20 shrink-0" />
                      {/* EU */}
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-3 bg-pc-bg rounded-full overflow-hidden">
                          {eu > 0 && <div className="h-full rounded-full bg-sky-500/80 transition-all duration-500" style={{ width: `${euW}%` }} />}
                        </div>
                        <span className={`w-5 text-right text-[11px] font-mono shrink-0 ${eu > 0 ? "text-pc-text" : "text-pc-text-muted/30"}`}>
                          {eu > 0 ? eu : "0"}
                        </span>
                      </div>
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
                    <div className="text-[10px] text-pc-text-muted uppercase tracking-wider">{r.region}</div>
                    <div className="text-lg font-mono font-bold text-pc-accent">{r.totalToday.toLocaleString()}</div>
                    <div className="text-[10px] text-pc-text-muted">{r.matchesPerHour}/hr</div>
                  </div>
                ))}
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
  const date = new Date(match.entry_datetime).toLocaleString();
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
