"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";

export default function SuspiciousPage() {
  const { t , formatNumber} = useLocalization();
  const [data, setData] = useState<CheaterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const players = await fetchCheaterPlayers({ susOnly: true, limit: 100 });
        setData(players);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.suspiciousPlayers")}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          {t("generated.players.playersFlaggedForUnusualBehaviorUnderInvestigation")}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-pc-text-muted text-xs">{data.length} {t("generated.players.flagged")}</span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.players.noSuspiciousPlayersFound")}</div>
      ) : (
        <PlayerDirectoryGrid items={data} getKey={(player) => player.id}>
          {(player) => (
            <Link
              href={`/players/${player.id}`}
              className="grid h-full min-h-28 gap-3 rounded-xl border border-amber-500/20 bg-pc-bg-elevated p-4 transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.04] sm:grid-cols-[minmax(0,10rem)_auto] sm:items-start"
            >
              <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount}>{player.name}</PlayerName>
              </div>

              <span className="w-fit shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300">
                {formatNumber(player.susCount)} {player.susCount === 1 ? t("generated.players.flag") : t("generated.players.flags")}
              </span>

              <div className="min-w-0 sm:col-span-2">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{t("generated.players.topReasons")}</div>
                {player.topReasons.length > 0 ? (
                  <ul className="flex min-w-0 flex-wrap gap-1.5">
                    {player.topReasons.map((reason) => (
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
          )}
        </PlayerDirectoryGrid>
      )}
    </div>
  );
}
