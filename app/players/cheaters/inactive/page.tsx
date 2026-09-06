/** Historical confirmed-cheater directory. */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerDirectorySearch from "@/components/player-directory-search";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { fetchInactiveCheaters, type CheaterPortalEntry } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

const PAGE_SIZE = 24;

function entryHref(entry: CheaterPortalEntry): string {
  return entry.kind === "private" ? `/players/private-accounts/${entry.subjectId}` : `/players/${entry.playerId ?? entry.subjectId}`;
}

export default function InactiveCheatersPage() {
  const { formatDateTime, formatNumber } = useLocalization();
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
    fetchInactiveCheaters({ q: debouncedQuery, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
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
      <PlayersPageHeader title="Inactive cheater database" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PlayerDirectorySearch label="Search by name or player ID" value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <span className="text-xs text-pc-text-muted">{formatNumber(total)} historical records</span>
      </div>
      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">The inactive database could not be loaded.</div>}
      {loading && items.length === 0 ? <LoadingPanel compact /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">No inactive cheaters match this search.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {items.map((entry) => (
            <Link key={`${entry.kind}:${entry.subjectId}`} href={entryHref(entry)} className="group rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-violet-400/50 hover:bg-violet-500/[0.05]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <History className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                  <h2 className="truncate text-sm font-semibold text-pc-text group-hover:text-violet-100">{entry.name}</h2>
                </div>
                <span className="shrink-0 text-xs text-pc-text-muted">Historical</span>
              </div>
              <p className="mt-3 truncate text-xs text-pc-text-secondary">{entry.reason || "Confirmed cheater"}</p>
              <p className="mt-2 text-xs text-pc-text-muted">Last observed {formatDateTime(entry.lastSeen)}</p>
            </Link>
          ))}
        </div>
      )}
      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
