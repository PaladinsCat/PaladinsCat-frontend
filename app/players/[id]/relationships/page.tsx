/**
 * Define the player route surface for id relationships page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Swords } from "lucide-react";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/async-state";
import PlayerRelationshipBars from "@/components/player-relationship-bars";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fetchPlayerRelationshipSummary, type PlayerRelationshipSummary } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

type Mode = "teammates" | "opponents" | "party";

/**
 * Render the PlayerRelationshipsPage view for the player id relationships page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function PlayerRelationshipsPage() {
  const { t, formatNumber, formatPercent } = useLocalization();
  const params = useParams<{ id: string }>();
  const playerId = String(params.id ?? "");
  const [summary, setSummary] = useState<PlayerRelationshipSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("teammates");

  useEffect(() => {
    if (!playerId) return;
    let active = true;
    setError(null);
    fetchPlayerRelationshipSummary(playerId, 50).then((value) => {
      if (active) setSummary(value);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : t("common.relationships.loadFailed"));
    });
    return () => { active = false; };
  }, [playerId, t]);

  if (!summary && !error) return <LoadingPanel />;
  if (!summary) return <ErrorState title={t("common.relationships.loadFailed")} message={error ?? t("common.relationships.loadFailed")} />;

  const rows = mode === "opponents" ? summary.opponents : mode === "party" ? summary.partyPartners : summary.teammates;
  const partyMetricMatches = summary.totals.partyMetricMatches;
  const partyWinRate = partyMetricMatches > 0 ? (summary.totals.partyWins / partyMetricMatches) * 100 : null;
  const tabs: Array<{ mode: Mode; label: string; count: number }> = [
    { mode: "teammates", label: t("common.relationships.teammates"), count: summary.totals.uniqueTeammates },
    { mode: "opponents", label: t("common.relationships.opponents"), count: summary.totals.uniqueOpponents },
    { mode: "party", label: t("common.relationships.partyPartners"), count: summary.totals.partyPartners },
  ];

  return (
    <div className="space-y-6">
      <PlayersPageHeader title={t("common.relationships.title")} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [t("common.relationships.teammates"), formatNumber(summary.totals.teammateMatches), "text-cyan-300"],
          [t("common.relationships.opponents"), formatNumber(summary.totals.opponentMatches), "text-violet-300"],
          [t("common.relationships.partyPartners"), formatNumber(summary.totals.partyPartners), "text-amber-300"],
          [t("common.relationships.matchesTogether"), formatNumber(summary.totals.partyMatches), "text-emerald-300"],
          [t("generated.players.winRate"), formatPercent(partyWinRate), "text-emerald-300"],
        ].map(([label, value, color]) => <div key={String(label)} className="pc-glass-subtle rounded-xl border border-white/5 p-4"><div className="text-xs uppercase tracking-[0.14em] text-pc-text-muted">{label}</div><div className={`mt-2 font-mono text-2xl font-bold ${color}`}>{value}</div></div>)}
      </div>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Swords aria-hidden="true" className="h-5 w-5 text-pc-accent" /><h2 className="text-lg font-bold text-pc-text">{t("common.relationships.encounterMix")}</h2></div>
          <SegmentedControl label={t("common.relationships.title")} items={tabs.map((tab) => ({ value: tab.mode, label: <>{tab.label} · {formatNumber(tab.count)}</> }))} value={mode} onChange={setMode} />
        </div>
        {rows.length === 0 ? <EmptyState title={t("common.relationships.empty")} /> : <PlayerRelationshipBars rows={rows} tone={mode === "opponents" ? "violet" : mode === "party" ? "amber" : "cyan"} showDetails />}
      </section>
      <p className="text-xs text-pc-text-muted">{t("common.relationships.rankedOnly")}</p>
    </div>
  );
}
