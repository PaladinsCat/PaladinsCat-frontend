/** Recent confirmed-cheater directory. */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerDirectorySearch from "@/components/player-directory-search";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { fetchActiveCheaters, type CheaterPortalEntry } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

const PAGE_SIZE = 24;

function entryHref(entry: CheaterPortalEntry): string {
  return entry.kind === "private" ? `/players/private-accounts/${entry.subjectId}` : `/players/cheaters/${entry.playerId ?? entry.subjectId}`;
}

export default function ActiveCheatersPage() {
  const { formatNumber } = useLocalization();
  const [page, setPage] = usePersistentDirectoryPage();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<CheaterPortalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let active = true;
    fetchActiveCheaters({ q: debouncedQuery, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [debouncedQuery, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PlayersPageHeader title="Active cheaters" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PlayerDirectorySearch label="Search by name or player ID" value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <span className="text-xs text-pc-text-muted">{formatNumber(total)} active records</span>
      </div>
      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">The active cheater directory could not be loaded.</div>}
      {loading && items.length === 0 ? <LoadingPanel compact /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">No active cheaters in the last 30 days.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {items.map((entry) => (
            <Link key={`${entry.kind}:${entry.subjectId}`} href={entryHref(entry)} className="group flex min-h-24 items-center justify-between gap-3 rounded-xl border border-red-400/25 bg-pc-bg-elevated p-4 transition-[border-color,background-color] duration-[200ms] hover:border-red-400/60 hover:bg-red-500/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
              <div className="flex min-w-0 items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-pc-text group-hover:text-red-100">{entry.name}</h2>
                  <p className="mt-1 truncate text-xs text-pc-text-secondary">{entry.reason || "Confirmed cheater"}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-pc-text-muted transition-[transform,color] duration-[120ms] group-hover:translate-x-1 group-hover:text-red-200" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
