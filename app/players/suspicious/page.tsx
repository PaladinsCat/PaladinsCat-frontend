"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { fetchCheaterPlayers, fetchPrivateAccountsDirectory, type CheaterPlayer, type PrivateAccountSummary } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";

const FETCH_PAGE_SIZE = 100;
const DISPLAY_PAGE_SIZE = 32;
const SUSPICIOUS_TAG_MINIMUM_FLAGS = 5;

async function fetchAllSuspiciousPlayers(name: string): Promise<CheaterPlayer[]> {
  const players: CheaterPlayer[] = [];
  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const page = await fetchCheaterPlayers({
      name: name || undefined,
      susOnly: true,
      limit: FETCH_PAGE_SIZE,
      offset,
    });
    players.push(...page);
    if (page.length < FETCH_PAGE_SIZE) return players;
  }
}

async function fetchAllSuspiciousPrivateAccounts(name: string): Promise<PrivateAccountSummary[]> {
  const accounts: PrivateAccountSummary[] = [];
  for (let page = 1; ; page += 1) {
    const result = await fetchPrivateAccountsDirectory({
      suspicious: true,
      page,
      pageSize: FETCH_PAGE_SIZE,
      query: name || undefined,
    });
    accounts.push(...result.items);
    if (page >= result.totalPages || result.items.length < FETCH_PAGE_SIZE) return accounts;
  }
}

export default function SuspiciousPage() {
  const { t , formatNumber} = useLocalization();
  const [data, setData] = useState<CheaterPlayer[]>([]);
  const [privateData, setPrivateData] = useState<PrivateAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const normalizedQuery = query.trim();
      Promise.all([
        fetchAllSuspiciousPlayers(normalizedQuery),
        fetchAllSuspiciousPrivateAccounts(normalizedQuery),
      ])
        .then(([players, privateAccounts]) => {
          if (!active) return;
          setData(players);
          setPrivateData(privateAccounts);
        })
        .catch(() => {
          if (!active) return;
          setData([]);
          setPrivateData([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const entries = useMemo(() => [
    ...data.map((player) => ({ kind: "player" as const, id: player.id, player })),
    ...privateData.map((account) => ({ kind: "private" as const, id: account.id, account })),
  ].sort((left, right) => {
    const leftCount = left.kind === "player" ? left.player.susCount : left.account.susCount;
    const rightCount = right.kind === "player" ? right.player.susCount : right.account.susCount;
    return rightCount - leftCount;
  }), [data, privateData]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.suspiciousPlayers")}</h1>
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-50 backdrop-blur-md" role="note">
          {t("moderation.suspiciousThresholdNotice")}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">{t("generated.players.searchByInGameNameOrPlayerId")}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("generated.players.searchByInGameNameOrPlayerId")}
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
          />
        </label>
        <span className="flex items-center gap-2 text-xs text-pc-text-muted">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          {formatNumber(entries.length)} {t("generated.players.flagged")}
        </span>
      </div>

      {loading && entries.length === 0 ? (
        <LoadingPanel compact />
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.players.noSuspiciousPlayersFound")}</div>
      ) : (
        <PlayerDirectoryGrid
          items={entries}
          getKey={(entry) => `${entry.kind}:${entry.id}`}
          loading={loading}
          pageSize={DISPLAY_PAGE_SIZE}
          gridClassName="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {(entry) => {
            const isPrivate = entry.kind === "private";
            const susCount = isPrivate ? entry.account.susCount : entry.player.susCount;
            const visibleSusCount = susCount >= SUSPICIOUS_TAG_MINIMUM_FLAGS ? susCount : 0;
            const reasons = isPrivate ? entry.account.topReasons : entry.player.topReasons;
            return (
            <Link
              href={isPrivate ? `/players/private-accounts/${entry.account.id}` : `/players/${entry.player.id}`}
              className="flex h-full min-h-24 flex-col gap-2 rounded-xl border border-amber-500/20 bg-pc-bg-elevated p-3 transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.04]"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                  {isPrivate
                    ? <PlayerName playerId={0} cheater={entry.account.cheater} susCount={visibleSusCount} verified={false}>{entry.account.displayName}</PlayerName>
                    : <PlayerName playerId={entry.player.id} cheater={entry.player.cheater} susCount={visibleSusCount}>{entry.player.name}</PlayerName>}
                </div>
                <span className="w-fit shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300">
                  {formatNumber(susCount)} {susCount === 1 ? t("moderation.suspiciousVote") : t("moderation.suspiciousVotes")}
                </span>
              </div>
              <div className="min-w-0">
                {reasons.length > 0 ? (
                  <ul className="flex min-w-0 flex-wrap gap-1.5">
                    {reasons.map((reason) => (
                      <li
                        key={reason.reason}
                        className="max-w-full break-words rounded-md border border-pc-border bg-pc-bg px-2 py-1 text-xs leading-relaxed text-pc-text-secondary [overflow-wrap:anywhere]"
                      >
                        {reason.reason}
                        {reason.count > 1 && <span className="ml-1 text-pc-text-muted">×{reason.count}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-pc-text-muted">{t("generated.players.noReasonRecorded")}</span>
                )}
              </div>
            </Link>
            );
          }}
        </PlayerDirectoryGrid>
      )}
    </div>
  );
}
