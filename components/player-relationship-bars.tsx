"use client";

import Link from "next/link";
import PlayerName from "@/components/player-name";
import type { PlayerRelationshipRow } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

export default function PlayerRelationshipBars({
  rows,
  tone = "cyan",
  limit,
  showDetails = false,
}: {
  rows: PlayerRelationshipRow[];
  tone?: "cyan" | "violet" | "amber";
  limit?: number;
  showDetails?: boolean;
}) {
  const { formatDateTime, formatNumber, t } = useLocalization();
  const visible = limit ? rows.slice(0, limit) : rows;
  const maximum = Math.max(1, ...visible.map((row) => row.matchCount));
  const barClass = tone === "violet" ? "bg-violet-400" : tone === "amber" ? "bg-amber-400" : "bg-cyan-400";

  return (
    <div className="space-y-3">
      {visible.map((row) => (
        <div key={row.otherPlayerId} className="min-w-0">
          <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-xs">
            <Link href={`/players/${row.otherPlayerId}`} className="min-w-0 truncate font-semibold text-pc-text hover:text-pc-accent">
              <PlayerName playerId={row.otherPlayerId}>{row.otherPlayerName}</PlayerName>
            </Link>
            <span className="shrink-0 font-mono text-pc-text-secondary">{formatNumber(row.matchCount)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-pc-bg-secondary" aria-hidden="true">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(3, (row.matchCount / maximum) * 100)}%` }} />
          </div>
          {showDetails && <div className="mt-1 flex flex-wrap justify-between gap-x-3 text-xs text-pc-text-muted"><span>{t("generated.players.firstObserved")}: {formatDateTime(row.firstSeen)}</span><span>{t("generated.players.lastObserved")}: {formatDateTime(row.lastSeen)}</span></div>}
        </div>
      ))}
    </div>
  );
}
