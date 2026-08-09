"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Search, UsersRound } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import {
  fetchPartyPairsDirectory,
  fetchPartyStacksDirectory,
  type PartyPairSummary,
  type PartyStackSummary,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";


const PAGE_SIZE = 24;
type DirectoryMode = "stacks" | "pairs";

function MatchCount({ count }: { count: number }) {
  const { t, formatNumber } = useLocalization();
  return <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300">{formatNumber(count)} {t("generated.players.match")}{count === 1 ? "" : t("generated.players.es")}</span>;
}

export default function RankedPartiesPage() {
  const { t, formatDateTime, formatNumber } = useLocalization();
  const observedAt = formatDateTime;
  const [mode, setMode] = useState<DirectoryMode>("stacks");
  const [pairs, setPairs] = useState<PartyPairSummary[]>([]);
  const [stacks, setStacks] = useState<PartyStackSummary[]>([]);
  const [stackSize, setStackSize] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = usePersistentDirectoryPage();
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
    const request = mode === "stacks"
      ? fetchPartyStacksDirectory({ page, pageSize: PAGE_SIZE, query: debouncedQuery, size: stackSize })
      : fetchPartyPairsDirectory({ page, pageSize: PAGE_SIZE, query: debouncedQuery });
    request
      .then((result) => {
        if (cancelled) return;
        if (mode === "stacks") setStacks(result.items as PartyStackSummary[]);
        else setPairs(result.items as PartyPairSummary[]);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError(t("generated.players.rankedPartiesCouldNotBeLoaded"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, mode, page, stackSize]);

  const itemsEmpty = mode === "stacks" ? stacks.length === 0 : pairs.length === 0;
  const changeMode = (nextMode: DirectoryMode) => {
    setMode(nextMode);
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <div className="flex items-start gap-3">
          <UsersRound aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-cyan-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.rankedParties")}</h1>
            <p className="mt-1 max-w-3xl text-sm text-pc-text-secondary">{t("generated.players.searchExact25PlayerStacksOrEveryCanonicalPair")}</p>
          </div>
        </div>
      </header>

      <div className="inline-flex rounded-xl border border-pc-border bg-pc-bg-elevated p-1 text-xs font-semibold">
        {(["stacks", "pairs"] as DirectoryMode[]).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => changeMode(option)}
            className={`rounded-lg px-4 py-2 capitalize transition-colors ${mode === option ? "bg-cyan-500/15 text-cyan-300" : "text-pc-text-muted hover:text-pc-text"}`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder={mode === "stacks" ? t("generated.players.searchAnyStackMember") : t("generated.players.searchEitherPlayer")}
              className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
            />
          </label>
          {mode === "stacks" && (
            <select
              value={stackSize ?? ""}
              onChange={(event) => { setStackSize(event.target.value ? Number(event.target.value) : null); setPage(1); }}
              className="rounded-xl border border-pc-border bg-pc-bg-elevated px-3 py-2.5 text-sm text-pc-text outline-none focus:border-pc-accent-mid"
              aria-label={t("generated.players.stackSize")}
            >
              <option value="">{t("generated.players.allSizes")}</option>
              {[2, 3, 4, 5].map(size => <option key={size} value={size}>{size}{t("generated.players.stack")}</option>)}
            </select>
          )}
        </div>
        <div className="text-xs text-pc-text-muted">{loading && itemsEmpty ? t("generated.players.loading") : t(mode === "stacks" ? (total === 1 ? "common.count.knownStackOne" : "common.count.knownStackMany") : (total === 1 ? "common.count.knownPairOne" : "common.count.knownPairMany"), { count: formatNumber(total) })}</div>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && itemsEmpty ? (
        <LoadingPanel compact />
      ) : itemsEmpty ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">{t("generated.players.noRanked")}{" "}{mode} {t("generated.players.matchThisSearch")}</div>
      ) : mode === "stacks" ? (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {stacks.map(stack => (
            <article key={stack.groupKey} className="overflow-hidden rounded-xl border border-cyan-500/20 bg-pc-bg-elevated p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-pc-text-muted">{t("generated.players.exactRanked")}{" "}{stack.stackSize}{t("generated.players.stack")}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stack.players.map(player => (
                      <Link key={player.id} href={`/players/${player.id}`} className="rounded-lg border border-pc-border bg-pc-bg/50 px-2.5 py-1.5 text-sm font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent">
                        <PlayerName playerId={player.id}>{player.name}</PlayerName>
                      </Link>
                    ))}
                  </div>
                </div>
                <MatchCount count={stack.matchCount} />
              </div>
              <div className="mt-4 flex items-start gap-2 border-t border-pc-border pt-3 text-xs text-pc-text-muted">
                <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <div><div>{t("generated.players.firstObserved")}{" "}<span className="text-pc-text-secondary">{observedAt(stack.firstSeen)}</span></div><div className="mt-1">{t("generated.players.lastObserved")}{" "}<span className="text-pc-text-secondary">{observedAt(stack.lastSeen)}</span></div></div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {pairs.map((pair) => (
            <article key={`${pair.sourcePlayerId}-${pair.targetPlayerId}`} className="overflow-hidden rounded-xl border border-cyan-500/20 bg-pc-bg-elevated p-4">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-pc-text-muted">{t("generated.players.canonicalPartyPair")}</div>
                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                    <Link href={`/players/${pair.sourcePlayerId}`} className="min-w-0 break-words text-pc-text transition-colors hover:text-pc-accent [overflow-wrap:anywhere]"><PlayerName playerId={pair.sourcePlayerId}>{pair.sourcePlayerName}</PlayerName></Link>
                    <span className="shrink-0 text-cyan-300">+</span>
                    <Link href={`/players/${pair.targetPlayerId}`} className="min-w-0 break-words text-pc-text transition-colors hover:text-pc-accent [overflow-wrap:anywhere]"><PlayerName playerId={pair.targetPlayerId}>{pair.targetPlayerName}</PlayerName></Link>
                  </div>
                </div>
                <MatchCount count={pair.matchCount} />
              </div>
              <div className="mt-4 flex items-start gap-2 border-t border-pc-border pt-3 text-xs text-pc-text-muted">
                <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <div><div>{t("generated.players.firstObserved")}{" "}<span className="text-pc-text-secondary">{observedAt(pair.firstSeen)}</span></div><div className="mt-1">{t("generated.players.lastObserved")}{" "}<span className="text-pc-text-secondary">{observedAt(pair.lastSeen)}</span></div></div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
