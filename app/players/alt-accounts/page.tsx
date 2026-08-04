"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Search, UserRound } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import {
  fetchAltAccountRelationsDirectory,
  type AltAccountDirectoryGroup,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation } from "@/components/aceternity";


const PAGE_SIZE = 24;

export default function AltAccountsPage() {
  const { t , formatNumber} = useLocalization();
  const [groups, setGroups] = useState<AltAccountDirectoryGroup[]>([]);
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
    let active = true;
    setLoading(true);
    setError(null);
    fetchAltAccountRelationsDirectory({ page, pageSize: PAGE_SIZE, query: debouncedQuery })
      .then((result) => {
        if (!active) return;
        setGroups(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => {
        if (active) setError(t("moderation.altDirectoryLoadFailed"));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedQuery, page, t]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <div className="flex items-start gap-3">
          <Copy aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-fuchsia-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("moderation.altAccountsTitle")}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-pc-text-secondary">{t("moderation.altRelationshipDirectoryDescription")}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder={t("moderation.searchMainOrAlt")}
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none placeholder:text-pc-text-muted focus:border-fuchsia-400/55"
          />
        </label>
        <span className="text-xs text-pc-text-muted">{t("moderation.mainAccountGroups", { value1: formatNumber(total) })}</span>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && groups.length === 0 ? (
        <LoadingPanel compact />
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">{t("moderation.noAltRelationships")}</div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {groups.map((group) => (
            <article key={group.main.id} className="min-w-0 overflow-hidden rounded-xl border border-fuchsia-400/20 bg-pc-bg-elevated">
              <div className="flex items-start justify-between gap-3 border-b border-pc-border p-4">
                <div className="min-w-0">
                  <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-300">{t("moderation.mainAccount")}</div>
                  <Link href={`/players/${group.main.id}`} className="block truncate text-base font-bold text-pc-text hover:text-pc-accent">
                    <PlayerName playerId={group.main.id} cheater={group.main.cheater} susCount={group.main.susCount} dropper={group.main.dropper} afkWintrade={group.main.afkWintrade} altAccount={group.main.altAccount}>{group.main.name}</PlayerName>
                  </Link>
                  <p className="mt-1 text-xs text-pc-text-muted">{group.main.region} · {group.main.platform}</p>
                </div>
                <span className="shrink-0 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2 py-1 text-xs font-semibold text-fuchsia-200">{t("moderation.relationshipVotes", { value1: formatNumber(group.totalVotes) })}</span>
              </div>

              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-pc-text-muted">
                  <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
                  {t("moderation.altAccountList", { value1: formatNumber(group.altAccounts.length) })}
                </div>
                <div className="space-y-2">
                  {group.altAccounts.map((alt) => (
                    <Link key={alt.id} href={`/players/${alt.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-pc-border bg-pc-bg/45 px-3 py-2.5 transition-colors hover:border-fuchsia-400/35 hover:bg-fuchsia-400/[0.05]">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-pc-text">
                          <PlayerName playerId={alt.id} cheater={alt.cheater} susCount={alt.susCount} dropper={alt.dropper} afkWintrade={alt.afkWintrade} altAccount={true}>{alt.name}</PlayerName>
                        </div>
                        <div className="mt-0.5 text-xs text-pc-text-muted">{alt.region} · {alt.platform}</div>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-fuchsia-200">{t("moderation.relationshipVotes", { value1: formatNumber(alt.voteCount) })}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
