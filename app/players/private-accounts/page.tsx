"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination from "@/components/player-directory-pagination";
import { fetchPrivateAccountsDirectory, type PrivateAccountSummary } from "@/lib/api-client";
import { TIER_NAMES, getTierColor } from "@/lib/tier-utils";

const PAGE_SIZE = 24;

function observedAt(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function PrivateAccountsPage() {
  const [accounts, setAccounts] = useState<PrivateAccountSummary[]>([]);
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
    fetchPrivateAccountsDirectory({ page, pageSize: PAGE_SIZE, query: debouncedQuery })
      .then((result) => {
        if (cancelled) return;
        setAccounts(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError("Private accounts could not be loaded.");
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
          <LockKeyhole aria-hidden="true" className="mt-1 h-9 w-9 shrink-0 text-slate-300" strokeWidth={1.5} />
          <div className="min-w-0">
            <h1 className="pc-heading pc-heading-lg text-pc-accent">Private Accounts</h1>
            <p className="mt-1 max-w-2xl text-sm text-pc-text-secondary">Pseudonymous accounts observed in match data while their Paladins profiles were private.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search private alias…"
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
          />
        </label>
        <div className="text-xs text-pc-text-muted">{loading && accounts.length === 0 ? "Loading…" : `${total.toLocaleString()} tracked account${total === 1 ? "" : "s"}`}</div>
      </div>

      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && accounts.length === 0 ? (
        <LoadingPanel compact />
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">No private accounts match this search.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {accounts.map((account) => {
            const tierName = TIER_NAMES[account.leagueTier] || "Unranked";
            return (
              <Link href={`/players/private-accounts/${account.id}`} key={account.id} className="group block overflow-hidden rounded-xl border border-slate-400/20 bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent-mid">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">Private profile</div>
                    <h2 className="mt-1 flex items-center gap-1.5 truncate text-base font-semibold text-pc-text group-hover:text-pc-accent">
                      <span className="truncate">{account.displayName}</span>
                      {account.verifiedName && <ShieldCheck aria-label="Verified from submitted evidence" className="h-4 w-4 shrink-0 text-emerald-300" />}
                    </h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-1 text-xs font-semibold text-slate-300">{account.matchCount.toLocaleString()} matches</span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-pc-border py-3 text-xs">
                  <div><dt className="text-pc-text-muted">Account level</dt><dd className="mt-0.5 font-semibold text-pc-text">{account.accountLevel.toLocaleString()}</dd></div>
                  <div><dt className="text-pc-text-muted">Mastery level</dt><dd className="mt-0.5 font-semibold text-pc-text">{account.masteryLevel.toLocaleString()}</dd></div>
                  <div><dt className="text-pc-text-muted">Rank</dt><dd className={`mt-0.5 font-semibold ${getTierColor(account.leagueTier)}`}>{tierName}</dd></div>
                  <div><dt className="text-pc-text-muted">League points</dt><dd className="mt-0.5 font-semibold text-pc-text">{account.leaguePoints.toLocaleString()}</dd></div>
                </dl>

                <div className="mt-3 flex items-start gap-2 text-xs text-pc-text-muted">
                  <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  <div><div>First observed <span className="text-pc-text-secondary">{observedAt(account.firstSeen)}</span></div><div className="mt-1">Last observed <span className="text-pc-text-secondary">{observedAt(account.lastSeen)}</span></div></div>
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
