/** wall-shooter-directory component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingPanel } from "@/components/async-state";
import { PLAYER_DIRECTORY_CARD_CLASS } from "@/components/player-directory-grid";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import { fetchWallShooterPlayers, type AutomaticWallShooterPlayer } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { hasPlayerTag } from "@/lib/player-tag-threshold";
import PlayersPageHeader from "@/components/ui/players-page-header";
import PlayerDirectorySearch from "@/components/player-directory-search";

const PAGE_SIZE = 32;

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function WallShooterDirectory() {
  const { t, formatNumber } = useLocalization();
  const [players, setPlayers] = useState<AutomaticWallShooterPlayer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = usePersistentDirectoryPage("wallShooterPage");
  const normalizedQuery = query.trim();
  const requestKey = `${normalizedQuery}:${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      fetchWallShooterPlayers({
        name: normalizedQuery || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
        .then((result) => {
          if (!active) return;
          setPlayers(result.players);
          setTotalCount(result.totalCount);
          setLoadedKey(requestKey);
        })
        .catch(() => {
          if (!active) return;
          setPlayers([]);
          setTotalCount(0);
          setLoadedKey(requestKey);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [normalizedQuery, page, requestKey]);

  return (
    <div className="space-y-6">
      <PlayersPageHeader title={t("moderation.wallShooterTitle")} />
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-50" role="note">
        {t("moderation.wallShooterNotice")}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PlayerDirectorySearch label={t("generated.players.searchByInGameNameOrPlayerId")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-xs text-pc-text-muted">{t("moderation.value1AutomaticallyFlaggedPlayers", { value1: formatNumber(totalCount) })}</span>
        </span>
      </div>

      {loading && players.length === 0 ? <LoadingPanel compact /> : players.length === 0 ? (
        <div className="py-8 text-center text-sm text-pc-text-secondary">{t("moderation.noWallShooters")}</div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {players.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className={`${PLAYER_DIRECTORY_CARD_CLASS} items-center justify-between gap-2 border-cyan-400/20 hover:border-cyan-400/40`}>
                <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                    <PlayerName
                      playerId={player.id}
                      cheater={player.cheater}
                      susCount={player.susCount}
                      dropper={player.dropper}
                      dropperVoteCount={player.dropperVoteCount}
                      afkWintrade={player.afkWintrade}
                      afkWintradeVoteCount={player.afkWintradeVoteCount}
                      wallShooter={hasPlayerTag(player.wallShooterCount)}
                      wallShooterCount={player.wallShooterCount}
                      boosted={player.boosted}
                      altAccount={player.altAccount}
                    >
                      {player.name}
                    </PlayerName>
                </div>
                <span className="w-fit shrink-0 text-xs font-semibold tabular-nums text-cyan-200">
                  {formatNumber(player.wallShooterCount)} {t("generated.players.matches.9f3e924")}
                </span>
              </Link>
            ))}
          </div>
          <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
