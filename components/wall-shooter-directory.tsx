"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import { fetchWallShooterPlayers, type AutomaticWallShooterPlayer } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { hasPlayerTag } from "@/lib/player-tag-threshold";

const PAGE_SIZE = 32;

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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("moderation.wallShooterTitle")}</h1>
        <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-50 backdrop-blur-md" role="note">
          {t("moderation.wallShooterNotice")}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">{t("generated.players.searchByInGameNameOrPlayerId")}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t("generated.players.searchByInGameNameOrPlayerId")}
            className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid"
          />
        </label>
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
              <Link key={player.id} href={`/players/${player.id}`} className="flex min-h-24 h-full flex-col gap-2 rounded-xl border border-cyan-400/20 bg-pc-bg-elevated p-3 transition-colors hover:border-cyan-400/40">
                <div className="flex min-w-0 items-start justify-between gap-2">
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
                  <span className="w-fit shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/15 px-2 py-1 text-xs font-semibold text-cyan-200">
                    {t("moderation.value1FlaggedMatches", { value1: formatNumber(player.wallShooterCount) })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
