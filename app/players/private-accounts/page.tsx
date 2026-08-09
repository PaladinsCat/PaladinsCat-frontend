"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Info, LockKeyhole, Search } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { fetchPrivateAccountsDirectory, type PrivateAccountSummary } from "@/lib/api-client";
import { TIER_NAMES, getRankIconPath, getTierColor } from "@/lib/tier-utils";
import { useLocalization } from "@/lib/localization-context";
import { PlayerModerationTag } from "@/components/player-name";


const PAGE_SIZE = 24;

export default function PrivateAccountsPage() {
  const { t, formatDateTime, formatNumber } = useLocalization();
  const observedAt = formatDateTime;
  const [accounts, setAccounts] = useState<PrivateAccountSummary[]>([]);
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
    fetchPrivateAccountsDirectory({ page, pageSize: PAGE_SIZE, query: debouncedQuery })
      .then((result) => {
        if (cancelled) return;
        setAccounts(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError(t("generated.players.privateAccountsCouldNotBeLoaded"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, page]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <div className="flex items-start gap-3">
          <LockKeyhole aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-slate-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.privateAccounts")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-pc-text-secondary">{t("generated.players.pseudonymousAccountsObservedInMatchDataWhileTheirPaladinsProfiles")}</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-400/[0.08] to-pc-bg-elevated p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-pc-text">{t("generated.players.howPrivateAccountTrackingWorks")}</h2>
            <p className="mt-1 text-sm leading-6 text-pc-text-secondary">{t("generated.players.paladinsHidesThePlayerIdAndNameButCompletedMatches")}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder={t("generated.players.searchPrivateAlias")}
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
          />
        </label>
        <div className="text-xs text-pc-text-muted">{loading && accounts.length === 0 ? t("generated.players.loading") : t(total === 1 ? "common.count.trackedAccountOne" : "common.count.trackedAccountMany", { count: formatNumber(total) })}</div>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && accounts.length === 0 ? (
        <LoadingPanel compact />
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">{t("generated.players.noPrivateAccountsMatchThisSearch")}</div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {accounts.map((account) => {
            const tierName = TIER_NAMES[account.leagueTier] || "Unranked";
            return (
              <Link href={`/players/private-accounts/${account.id}`} key={account.id} className="group block overflow-hidden rounded-xl border border-slate-400/20 bg-pc-bg-elevated p-3 transition-colors hover:border-pc-accent-mid">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <h2 className="mr-0.5 truncate text-base font-semibold text-pc-text group-hover:text-pc-accent">{account.alias || account.displayName}</h2>
                    <PlayerModerationTag playerId={0} cheater={account.cheater} susCount={account.susCount} verified={false} />
                    <span className="rounded border border-pc-border bg-pc-bg/50 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-pc-text-secondary">{t("generated.players.level")}{" "}{formatNumber(account.accountLevel)}</span>
                    <span className="rounded border border-pc-border bg-pc-bg/50 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-pc-text-secondary">{t("generated.players.mastery")}{" "}{formatNumber(account.masteryLevel)}</span>
                    <span className={`ml-1 flex min-w-0 items-center gap-1 text-xs font-semibold ${getTierColor(account.leagueTier)}`}>
                      <img src={getRankIconPath(account.leagueTier, 0)} alt="" className="h-5 w-5 shrink-0 object-contain" />
                      <span className="truncate">{tierName}</span>
                      <span className="text-pc-text-muted">·</span>
                      <span className="whitespace-nowrap text-pc-text-secondary">{formatNumber(account.leaguePoints)} {t("generated.players.tp")}</span>
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-1 text-xs font-semibold text-slate-300">{formatNumber(account.matchCount)} {t("generated.players.matches.9f3e924")}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-pc-border pt-2 text-xs text-pc-text-muted">
                  <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  <span>{t("generated.players.firstObserved")}{" "}<span className="text-pc-text-secondary">{observedAt(account.firstSeen)}</span></span>
                  <span>{t("generated.players.lastObserved")}{" "}<span className="text-pc-text-secondary">{observedAt(account.lastSeen)}</span></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
