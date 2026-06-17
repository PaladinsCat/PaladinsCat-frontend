"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  fetchMatchSearch,
  fetchRecentMatches,
  type MatchSearchResult,
  type MatchData,
} from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { useChampions } from "@/lib/champion-names";

/**
 * Match Search Page — /matches
 *
 * Lists recent matches with search filters (champion, queue, region, date range).
 * Paginated results with clickable rows linking to /matches/[id].
 *
 * Data sources:
 *   GET /api/matches/recent          → default recent matches
 *   GET /api/matches/search          → filtered search
 *   @/lib/champion-names             → champion name dropdown
 */
export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [championId, setChampionId] = useState("");
  const [queueId, setQueueId] = useState("");
  const [region, setRegion] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hasFilters, setHasFilters] = useState(false);
  const { champions, loading: championsLoading } = useChampions();

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (hasFilters) {
        const result = await fetchMatchSearch({
          championId: championId || undefined,
          queueId: queueId || undefined,
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
        // Default: show recent matches
        const recent = await fetchRecentMatches(perPage);
        if (recent.length > 0) {
          // Map to MatchSearchResult shape for the table
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
    } catch (err: any) {
      setMatches([]);
      setTotal(0);
      setTotalPages(1);
      setError(err.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [hasFilters, championId, queueId, region, from, to, page, perPage]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleSearch = () => {
    const filtered = !!championId || !!queueId || !!region || !!from || !!to;
    setHasFilters(filtered);
    setPage(1);
  };

  const handleReset = () => {
    setChampionId("");
    setQueueId("");
    setRegion("");
    setFrom("");
    setTo("");
    setHasFilters(false);
    setPage(1);
  };

  // Reload after filter/page changes
  useEffect(() => {
    if (hasFilters) loadMatches();
  }, [page, hasFilters, loadMatches]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-pc-text">
          <ScrambleText text="Matches" speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <p className="text-pc-text-secondary mt-1">
          Search and browse match history
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm text-pc-text-secondary mb-1">Champion</label>
            <select
              value={championId}
              onChange={(e) => setChampionId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pc-bg-secondary border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
              disabled={championsLoading}
            >
              <option value="">All champions</option>
              {champions?.sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-pc-text-secondary mb-1">Queue ID</label>
            <input
              type="number"
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
              placeholder="486 = Ranked"
              className="w-full px-3 py-2 rounded-lg bg-pc-bg-secondary border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-pc-text-secondary mb-1">Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. na"
              className="w-full px-3 py-2 rounded-lg bg-pc-bg-secondary border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-pc-text-secondary mb-1">From</label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pc-bg-secondary border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-pc-text-secondary mb-1">To</label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-pc-bg-secondary border border-pc-border text-pc-text text-sm focus:outline-none focus:border-pc-accent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm hover:bg-pc-accent-secondary transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-pc-bg-secondary border border-pc-border text-pc-text-secondary text-sm hover:bg-pc-bg-elevated transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {loading && (
        <div className="text-center py-12 text-pc-text-secondary">Loading matches...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400">{error}</div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="text-center py-12 text-pc-text-secondary">
          {hasFilters ? "No matches found for these filters." : "No matches available."}
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <>
          {/* Results count */}
          {hasFilters && (
            <div className="text-sm text-pc-text-secondary">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} matches
            </div>
          )}

          {/* Table */}
          <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pc-border bg-pc-bg-secondary text-pc-text-secondary text-left">
                    <th className="px-4 py-3">Match ID</th>
                    <th className="px-4 py-3">Queue</th>
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

          {/* Pagination */}
          {hasFilters && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text text-sm disabled:opacity-50 hover:bg-pc-bg-secondary transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-pc-text-secondary px-4">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text text-sm disabled:opacity-50 hover:bg-pc-bg-secondary transition-colors"
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
  const queueLabel = queueName(match.queue_id);
  const duration = formatDuration(match.duration_seconds);
  const date = new Date(match.entry_datetime).toLocaleString();

  return (
    <Link
      href={`/matches/${match.match_id}`}
      className="group"
    >
      <tr className="border-b border-pc-border/50 hover:bg-pc-bg-secondary transition-colors cursor-pointer">
        <td className="px-4 py-3">
          <span className="font-medium text-pc-accent group-hover:text-pc-accent-secondary transition-colors">
            #{match.match_id}
          </span>
        </td>
        <td className="px-4 py-3 text-pc-text-secondary">{queueLabel}</td>
        <td className="px-4 py-3 text-pc-text-secondary">{match.map}</td>
        <td className="px-4 py-3 text-pc-text-secondary">{match.region}</td>
        <td className="px-4 py-3 text-pc-text-secondary">{duration}</td>
        <td className="px-4 py-3 text-pc-text-secondary">{date}</td>
      </tr>
    </Link>
  );
}

/* ── Helpers ── */

function queueName(id: number): string {
  const map: Record<number, string> = {
    486: "Ranked 10v10",
    487: "Casual 10v10",
    488: "Custom Game",
    489: "Tournament",
  };
  return map[id] || `Queue ${id}`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}