"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, fetchPrivateAccountsDirectory, type CheaterPlayer, type PrivateAccountSummary } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import PlayerDirectoryGrid from "@/components/player-directory-grid";
import { useLocalization } from "@/lib/localization-context";


export default function SuspiciousPage() {
  const { t , formatNumber} = useLocalization();
  const [data, setData] = useState<CheaterPlayer[]>([]);
  const [privateData, setPrivateData] = useState<PrivateAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [players, privateAccounts] = await Promise.all([
          fetchCheaterPlayers({ susOnly: true, limit: 100 }),
          fetchPrivateAccountsDirectory({ suspicious: true, pageSize: 100 }),
        ]);
        setData(players);
        setPrivateData(privateAccounts.items);
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
  ].sort((left, right) => {
    const leftCount = left.kind === "player" ? left.player.susCount : left.account.susCount;
    const rightCount = right.kind === "player" ? right.player.susCount : right.account.susCount;
    return rightCount - leftCount;
  }), [data, privateData]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.players.suspiciousPlayers")}</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          {t("generated.players.playersFlaggedForUnusualBehaviorUnderInvestigation")}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-pc-text-muted text-xs">{entries.length} {t("generated.players.flagged")}</span>
      </div>

      {loading ? (
        <LoadingPanel compact />
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">{t("generated.players.noSuspiciousPlayersFound")}</div>
      ) : (
        <PlayerDirectoryGrid items={entries} getKey={(entry) => `${entry.kind}:${entry.id}`}>
          {(entry) => {
            const isPrivate = entry.kind === "private";
            const susCount = isPrivate ? entry.account.susCount : entry.player.susCount;
            const reasons = isPrivate ? entry.account.topReasons : entry.player.topReasons;
            return (
            <Link
              href={isPrivate ? `/players/private-accounts/${entry.account.id}` : `/players/${entry.player.id}`}
              className="flex h-full min-h-28 flex-col gap-3 rounded-xl border border-amber-500/20 bg-pc-bg-elevated p-4 transition-colors hover:border-amber-400/40 hover:bg-amber-500/[0.04]"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                  {isPrivate
                    ? <PlayerName playerId={0} cheater={entry.account.cheater} susCount={entry.account.susCount} verified={false}>{entry.account.displayName}</PlayerName>
                    : <PlayerName playerId={entry.player.id} cheater={entry.player.cheater} susCount={entry.player.susCount}>{entry.player.name}</PlayerName>}
                </div>
                <span className="w-fit shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300">
                  {formatNumber(susCount)} {susCount === 1 ? t("generated.players.flag") : t("generated.players.flags")}
                </span>
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{t("generated.players.topReasons")}</div>
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
