"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";

export default function CheatersPage() {
  const { t } = useLocalization();
  const [data, setData] = useState<CheaterPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cheaters = await fetchCheaterPlayers({ cheater: true, limit: 100 });
        setData(cheaters.filter(c => c.cheater));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.confirmedCheaters")}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          {t("generated.players.confirmedCheatingAccountsAndTheirPrimaryReportReason")}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-pc-text-muted text-xs">{data.length} {t("generated.players.confirmed")}</span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.players.noConfirmedCheatersFound")}</div>
      ) : (
        <div className="space-y-2">
          {data.map((player) => {
            const topReason = player.topReasons[0];
            return (
              <article
                key={player.id}
                className="grid gap-3 rounded-xl border border-red-500/20 bg-pc-bg-elevated p-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-start"
              >
                <Link
                  href={`/players/${player.id}`}
                  className="min-w-0 truncate text-sm font-semibold text-pc-text transition-colors hover:text-pc-accent"
                >
                  <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount}>
                    {player.name}
                  </PlayerName>
                </Link>

                <div className="min-w-0">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-pc-text-muted">{t("generated.players.topReason")}</div>
                  {topReason ? (
                    <span className="inline-block max-w-full break-words rounded-md border border-pc-border bg-pc-bg px-2 py-1 text-xs leading-relaxed text-pc-text-secondary [overflow-wrap:anywhere]">
                      {topReason.reason}
                    </span>
                  ) : (
                    <span className="text-xs text-pc-text-muted">{t("generated.players.noReasonRecorded")}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
