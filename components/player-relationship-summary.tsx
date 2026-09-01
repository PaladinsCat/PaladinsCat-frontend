/** player-relationship-summary component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import PlayerRelationshipBars from "@/components/player-relationship-bars";
import { fetchPlayerRelationshipSummary, type PlayerRelationshipSummary } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function PlayerRelationshipSummaryCard({ playerId }: { playerId: string }) {
  const { t, formatNumber, formatPercent } = useLocalization();
  const [summary, setSummary] = useState<PlayerRelationshipSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetchPlayerRelationshipSummary(playerId, 4).then((value) => {
      if (active) setSummary(value);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [playerId]);

  const teammateMatches = summary?.totals.teammateMatches ?? 0;
  const opponentMatches = summary?.totals.opponentMatches ?? 0;
  const total = teammateMatches + opponentMatches;
  const teammateShare = total > 0 ? (teammateMatches / total) * 100 : 50;
  const partyMatches = summary?.totals.partyMatches ?? 0;
  const partyMetricMatches = summary?.totals.partyMetricMatches ?? 0;
  const partyWinRate = partyMetricMatches > 0
    ? ((summary?.totals.partyWins ?? 0) / partyMetricMatches) * 100
    : null;

  return (
    <section>
      <h2 className="pc-card-title shadow-sm">{t("common.relationships.title")}</h2>
      <div className="pc-card p-3">
        <div className="flex items-start gap-3">
          <UsersRound aria-hidden="true" className="h-9 w-9 shrink-0 text-cyan-300" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-pc-text-muted">{t("common.relationships.description")}</p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-pc-bg-secondary" aria-hidden="true">
              <div className="bg-cyan-400" style={{ width: `${teammateShare}%` }} />
              <div className="bg-violet-400" style={{ width: `${100 - teammateShare}%` }} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-pc-text-muted">{t("common.relationships.teammates")}</span><div className="font-mono text-cyan-300">{summary ? formatNumber(teammateMatches) : "—"}</div></div>
              <div><span className="text-pc-text-muted">{t("common.relationships.opponents")}</span><div className="font-mono text-violet-300">{summary ? formatNumber(opponentMatches) : "—"}</div></div>
              <div><span className="text-pc-text-muted">{t("common.relationships.partyPartners")}</span><div className="font-mono text-amber-300">{summary ? formatNumber(summary.totals.partyPartners) : "—"}</div></div>
            </div>
            <div className="mt-2 text-xs"><span className="text-pc-text-muted">{t("generated.players.winRate")}: </span><span className="font-mono text-emerald-300">{formatPercent(partyWinRate)}</span>{partyWinRate != null && partyMetricMatches !== partyMatches && <span className="ml-2 text-pc-text-muted">({formatNumber(partyMetricMatches)}/{formatNumber(partyMatches)} {t("generated.players.matches")})</span>}</div>
          </div>
        </div>
        {summary && summary.partyPartners.length > 0 && <div className="mt-4 border-t border-pc-border/50 pt-3"><PlayerRelationshipBars rows={summary.partyPartners} limit={3} tone="amber" showDetails /></div>}
        <Link href={`/players/${playerId}/relationships`} className="mt-4 flex items-center justify-between rounded-lg border border-pc-border bg-pc-bg-secondary/60 px-3 py-2 text-xs font-semibold text-pc-text transition-colors hover:border-pc-accent-mid hover:text-pc-accent">
          {t("common.relationships.viewDetails")}<span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
