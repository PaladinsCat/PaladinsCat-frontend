"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Search, UsersRound } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import { fetchPartyPairsDirectory, type PartyPairSummary } from "@/lib/api-client";

const PAGE_SIZE = 24;

function observedAt(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PartyPairsPage() {
  const [pairs, setPairs] = useState<PartyPairSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPartyPairsDirectory({ page, pageSize: PAGE_SIZE, query: debouncedQuery })
      .then((result) => {
        if (cancelled) return;
        setPairs(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError("Party pairs could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, page]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">← Players</Link>
        <div className="flex items-start gap-3">
          <UsersRound aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-cyan-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <h1 className="pc-heading pc-heading-lg text-pc-accent">Party Pairs</h1>
            <p className="mt-1 max-w-3xl text-sm text-pc-text-secondary">Ranked teammates observed sharing a party at least once. Match totals include every ranked teammate match stored for that pair.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search either player…"
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
          />
        </label>
        <div className="text-xs text-pc-text-muted">{loading && pairs.length === 0 ? "Loading…" : `${total.toLocaleString()} known pair${total === 1 ? "" : "s"}`}</div>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && pairs.length === 0 ? (
        <LoadingPanel compact />
      ) : pairs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">No party pairs match this search.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {pairs.map((pair) => (
            <article key={`${pair.sourcePlayerId}-${pair.targetPlayerId}`} className="overflow-hidden rounded-xl border border-cyan-500/20 bg-pc-bg-elevated p-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">Known party pair</div>
                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                    <Link href={`/players/${pair.sourcePlayerId}`} className="min-w-0 break-words text-pc-text transition-colors hover:text-pc-accent [overflow-wrap:anywhere]"><PlayerName playerId={pair.sourcePlayerId}>{pair.sourcePlayerName}</PlayerName></Link>
                    <span className="shrink-0 text-cyan-300">+</span>
                    <Link href={`/players/${pair.targetPlayerId}`} className="min-w-0 break-words text-pc-text transition-colors hover:text-pc-accent [overflow-wrap:anywhere]"><PlayerName playerId={pair.targetPlayerId}>{pair.targetPlayerName}</PlayerName></Link>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300">{pair.matchCount.toLocaleString()} matches</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-y border-pc-border py-3 text-xs">
                <Link href={`/players/${pair.sourcePlayerId}`} className="min-w-0 truncate rounded-lg bg-pc-bg/50 px-3 py-2 text-pc-text-secondary transition-colors hover:text-pc-accent">View {pair.sourcePlayerName}</Link>
                <Link href={`/players/${pair.targetPlayerId}`} className="min-w-0 truncate rounded-lg bg-pc-bg/50 px-3 py-2 text-pc-text-secondary transition-colors hover:text-pc-accent">View {pair.targetPlayerName}</Link>
              </div>

              <div className="mt-3 flex items-start gap-2 text-xs text-pc-text-muted">
                <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <div><div>First observed <span className="text-pc-text-secondary">{observedAt(pair.firstSeen)}</span></div><div className="mt-1">Last observed <span className="text-pc-text-secondary">{observedAt(pair.lastSeen)}</span></div></div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
