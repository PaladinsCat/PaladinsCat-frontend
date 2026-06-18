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

/**
 * Matches Page — /matches
 *
 * Left: search filters. Right: live ranked match stats by region (real data).
 * Bottom: paginated results table (ranked only since DB only tracks ranked).
 */
export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters — queueId defaults to ranked and is hidden since DB is ranked-only
  const [championId, setChampionId] = useState("");
  const [region, setRegion] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hasFilters, setHasFilters] = useState(false);
  const { champions, loading: championsLoading } = useChampions();
  const [referenceRegions, setReferenceRegions] = useState<Array<{ region?: string; region_code?: string; name?: string; region_name?: string }>>([]);

  // Live hourly stats from backend
  const [hourlyStats, setHourlyStats] = useState<MatchHourlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch hourly stats on mount + every 60s
  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatsLoading(true);
      try {
        const stats = await fetchMatchHourlyStats();
        if (active) setHourlyStats(stats);
      } catch {
        // Silently degrade — stats card shows zeros
      } finally {
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
          const mapped: MatchSearchResult[] = recent.map((m: MatchData) => ({
            match_id: m.match_id,
            entry_datetime: m.entry_datetime,
            map: m.map,
            queue_id: m.queue_id,
            duration_seconds: m.duration_seconds,
            region: m.region,
            champion_id: 0,
            champion_name: "",
            win_status: "",
            kills: 0,
            deaths: 0,
            assists: 0,
            player_count: 10,
          }));
          setMatches(mapped);
          setTotal(recent.length);
          setTotalPages(1);
        } else {
          setMatches([]);
          setTotal(0);
          setTotalPages(1);
        }
      }
    } catch {
      setMatches([]);
      setTotal(0);
      setTotalPages(1);
      setError("Match data unavailable. Start the PaladinsCat API on port 3005 to load ranked matches.");
    } finally {
      setLoading(false);
    }
  }, [hasFilters, championId, region, from, to, page, perPage]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleSearch = () => {
    const filtered = !!championId || !!region || !!from || !!to;
    setHasFilters(filtered);
    setPage(1);
  };

  const handleReset = () => {
    setChampionId("");
    setRegion("");
    setFrom("");
    setTo("");
    setHasFilters(false);
    setPage(1);
  };

  useEffect(() => {
    if (hasFilters) loadMatches();
  }, [page, hasFilters, loadMatches]);

  const maxMatches = hourlyStats
    ? Math.max(...hourlyStats.regions.map((r) => r.matchesPerHour), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Matches</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Search ranked match history and view live activity by region
        </p>
      </div>

      {/* ── Top: Search (left) + Stats (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Search Filters (3/5) */}
        <div className="lg:col-span-3 bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-pc-text-muted mb-1.5">Champion</label>
              <select
                value={championId}
                onChange={(e) => setChampionId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
                disabled={championsLoading}
              >
                <option value="">All champions</option>
                {champions?.sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-pc-text-muted mb-1.5">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
              >
                <option value="">All regions</option>
                {referenceRegions.map((region) => {
                  const value = region.region ?? region.region_code ?? "";
                  if (!value) return null;
                  return (
                    <option key={value} value={value}>
                      {region.name ?? region.region_name ?? value}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-pc-text-muted mb-1.5">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
                />
              </div>
              <div>
                <label className="block text-xs text-pc-text-muted mb-1.5">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-pc-bg border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm hover:bg-pc-accent-secondary transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-pc-bg border border-pc-border text-pc-text-secondary text-sm hover:bg-pc-bg-elevated transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right: Live Match Stats (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-pc-text font-semibold text-sm">Ranked Activity Today</h2>
            </div>
            <div className="mb-4">
              <div className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-0.5">Total Ranked</div>
              <div className="text-pc-accent font-bold text-lg">
                {statsLoading ? "…" : (hourlyStats?.totalToday ?? 0).toLocaleString()}
              </div>
            </div>
            {/* Region bars */}
            <div className="space-y-2">
              {(hourlyStats?.regions ?? []).map((r) => (
                <div key={r.region} className="flex items-center gap-3 text-xs">
                  <span className="text-pc-text w-10 shrink-0 font-medium">{r.region}</span>
                  <div className="flex-1 h-2 bg-pc-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pc-accent-deep to-pc-accent transition-all duration-500"
                      style={{ width: `${(r.matchesPerHour / maxMatches) * 100}%` }}
                    />
                  </div>
                  <span className="text-pc-accent font-medium w-12 text-right shrink-0">{r.matchesPerHour}/hr</span>
                </div>
              ))}
              {statsLoading && (
                <div className="text-pc-text-muted text-xs text-center py-2">Loading…</div>
              )}
            </div>
          </div>
          {/* Per-region totals */}
          {!statsLoading && hourlyStats && hourlyStats.regions.some(r => r.totalToday > 0) && (
            <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
              <h3 className="text-pc-text-muted text-[10px] uppercase tracking-wider mb-2">Today by Region</h3>
              <div className="grid grid-cols-3 gap-2">
                {hourlyStats.regions.map((r) => (
                  <div key={r.region} className="text-center">
                    <div className="text-pc-text text-xs font-medium">{r.region}</div>
                    <div className="text-pc-text-muted text-[10px]">{r.totalToday.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Results ── */}
      {loading && (
        <div className="text-center py-12 text-pc-text-secondary text-sm">Loading matches...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      )}

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
                  {matches.map((m) => (
                    <MatchRow key={m.match_id} match={m} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {hasFilters && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text text-xs disabled:opacity-50 hover:bg-pc-bg-secondary transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-pc-text-secondary px-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text text-xs disabled:opacity-50 hover:bg-pc-bg-secondary transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
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
        <Link href={href} className="block font-medium text-pc-accent group-hover:text-pc-accent-secondary transition-colors text-xs">
            #{match.match_id}
        </Link>
      </td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs">
        <Link href={href} className="block">
          {match.map}
        </Link>
      </td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs">
        <Link href={href} className="block">
          {match.region}
        </Link>
      </td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs">
        <Link href={href} className="block">
          {duration}
        </Link>
      </td>
      <td className="px-4 py-3 text-pc-text-secondary text-xs">
        <Link href={href} className="block">
          {date}
        </Link>
      </td>
    </tr>
  );
}

/* ── Helpers ── */

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
