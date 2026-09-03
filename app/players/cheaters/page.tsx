/**
 * Define the player route surface for cheaters page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchCheaterPlayers,
  fetchPrivateAccountsDirectory,
  type CheaterPlayer,
  type PrivateAccountSummary,
} from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid, { PLAYER_DIRECTORY_CARD_CLASS } from "@/components/player-directory-grid";
import { getCoreCheaterReason } from "@/lib/cheater-reasons";
import { useLocalization } from "@/lib/localization-context";
import PlayersPageHeader from "@/components/ui/players-page-header";
import PlayerDirectorySearch from "@/components/player-directory-search";


const FETCH_PAGE_SIZE = 100;
const DISPLAY_PAGE_SIZE = 32;

async function fetchAllCheaterPlayers(name: string): Promise<CheaterPlayer[]> {
  const players: CheaterPlayer[] = [];
  const seenPlayerIds = new Set<string>();
  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const page = await fetchCheaterPlayers({ name: name || undefined, cheater: true, limit: FETCH_PAGE_SIZE, offset });
    const newPlayers = page.filter((player) => player.cheater && !seenPlayerIds.has(String(player.id)));
    newPlayers.forEach((player) => seenPlayerIds.add(String(player.id)));
    players.push(...newPlayers);
    if (page.length < FETCH_PAGE_SIZE || newPlayers.length === 0) return players;
  }
}

async function fetchAllCheaterPrivateAccounts(name: string): Promise<PrivateAccountSummary[]> {
  const accounts: PrivateAccountSummary[] = [];
  for (let page = 1; ; page += 1) {
    const result = await fetchPrivateAccountsDirectory({
      cheater: true,
      page,
      pageSize: FETCH_PAGE_SIZE,
      query: name || undefined,
    });
    accounts.push(...result.items.filter((account) => account.cheater));
    if (page >= result.totalPages || result.items.length < FETCH_PAGE_SIZE) return accounts;
  }
}

/**
 * Render the CheatersPage view for the player cheaters page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function CheatersPage() {
  const { t, formatNumber } = useLocalization();
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
        fetchAllCheaterPlayers(normalizedQuery),
        fetchAllCheaterPrivateAccounts(normalizedQuery),
      ])
        .then(([cheaters, privateAccounts]) => {
          if (!active) return;
          setData(cheaters);
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
  ], [data, privateData]);

  return (
    <div className="space-y-6">
      <PlayersPageHeader title={t("generated.players.confirmedCheaters")} />
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-50" role="note">
        {t("moderation.cheaterAssignmentNotice")}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PlayerDirectorySearch label={t("generated.players.searchByInGameNameOrPlayerId")} value={query} onChange={setQuery} />
        <span className="flex items-center gap-2 text-xs text-pc-text-muted">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {formatNumber(data.length + privateData.length)} {t("generated.players.confirmed")}
        </span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : data.length + privateData.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.players.noConfirmedCheatersFound")}</div>
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
            const reason = getCoreCheaterReason(isPrivate ? entry.account.cheaterReason : entry.player.topReasons[0]?.reason);
            return (
              <Link
                href={isPrivate ? `/players/private-accounts/${entry.account.id}` : `/players/${entry.player.id}`}
                className={`${PLAYER_DIRECTORY_CARD_CLASS} flex-col justify-center gap-1 border-red-500/20 hover:border-red-400/40 hover:bg-red-500/[0.04]`}
              >
                <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                  {isPrivate ? (
                    <PlayerName playerId={0} cheater={true} susCount={entry.account.susCount} verified={false}>{entry.account.displayName}</PlayerName>
                  ) : (
                    <PlayerName playerId={entry.player.id} cheater={entry.player.cheater} susCount={entry.player.susCount}>{entry.player.name}</PlayerName>
                  )}
                </div>
                <div className="min-w-0">
                  {reason ? (
                    <span className="block max-w-full truncate rounded-md border border-pc-border bg-pc-bg px-2 py-0.5 text-xs leading-tight text-pc-text-secondary" title={reason}>{reason}</span>
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
