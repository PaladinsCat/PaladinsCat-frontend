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
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";

export default function CheatersPage() {
  const { t } = useLocalization();
  const [data, setData] = useState<CheaterPlayer[]>([]);
  const [privateData, setPrivateData] = useState<PrivateAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cheaters, privateCheaters] = await Promise.all([
          fetchCheaterPlayers({ cheater: true, limit: 100 }),
          fetchPrivateAccountsDirectory({ cheater: true, pageSize: 100 }),
        ]);
        setData(cheaters.filter(c => c.cheater));
        setPrivateData(privateCheaters.items.filter(account => account.cheater));
      } catch {
        setData([]);
        setPrivateData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const entries = useMemo(() => [
    ...data.map((player) => ({ kind: "player" as const, id: player.id, player })),
    ...privateData.map((account) => ({ kind: "private" as const, id: account.id, account })),
  ], [data, privateData]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.confirmedCheaters")}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          {t("generated.players.confirmedCheatingAccountsAndTheirPrimaryReportReason")}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-pc-text-muted text-xs">{data.length + privateData.length} {t("generated.players.confirmed")}</span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : data.length + privateData.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.players.noConfirmedCheatersFound")}</div>
      ) : (
        <PlayerDirectoryGrid items={entries} getKey={(entry) => `${entry.kind}:${entry.id}`}>
          {(entry) => {
            const isPrivate = entry.kind === "private";
            const reason = isPrivate ? entry.account.cheaterReason : entry.player.topReasons[0]?.reason;
            return (
              <Link
                href={isPrivate ? `/players/private-accounts/${entry.account.id}` : `/players/${entry.player.id}`}
                className="grid h-full min-h-24 gap-3 rounded-xl border border-red-500/20 bg-pc-bg-elevated p-4 transition-colors hover:border-red-400/40 hover:bg-red-500/[0.04] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start"
              >
                <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                  {isPrivate ? (
                    <PlayerName playerId={0} cheater={true} susCount={0} verified={false}>{entry.account.displayName}</PlayerName>
                  ) : (
                    <PlayerName playerId={entry.player.id} cheater={entry.player.cheater} susCount={entry.player.susCount}>{entry.player.name}</PlayerName>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-pc-text-muted">{t("generated.players.topReason")}</div>
                  {reason ? (
                    <span className="inline-block max-w-full break-words rounded-md border border-pc-border bg-pc-bg px-2 py-1 text-xs leading-relaxed text-pc-text-secondary [overflow-wrap:anywhere]">{reason}</span>
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
