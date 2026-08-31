"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Swords, UsersRound } from "lucide-react";
import { EmptyState, ErrorState, LoadingPanel } from "@/components/async-state";
import PlayerRelationshipBars from "@/components/player-relationship-bars";
import { fetchPlayerRelationshipSummary, type PlayerRelationshipSummary } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

type Mode = "teammates" | "opponents" | "party";

export default function PlayerRelationshipsPage() {
  const { t, formatNumber } = useLocalization();
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
  const tabs: Array<{ mode: Mode; label: string; count: number }> = [
    { mode: "teammates", label: t("common.relationships.teammates"), count: summary.totals.uniqueTeammates },
    { mode: "opponents", label: t("common.relationships.opponents"), count: summary.totals.uniqueOpponents },
    { mode: "party", label: t("common.relationships.partyPartners"), count: summary.totals.partyPartners },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <Link href={`/players/${playerId}`} className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.playerProfile")}</Link>
        <div className="flex items-start gap-3"><UsersRound aria-hidden="true" className="mt-1 h-9 w-9 text-cyan-300" /><div><h1 className="pc-heading pc-heading-lg text-pc-accent">{t("common.relationships.title")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("common.relationships.description")}</p></div></div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t("common.relationships.teammates"), summary.totals.teammateMatches, "text-cyan-300"],
          [t("common.relationships.opponents"), summary.totals.opponentMatches, "text-violet-300"],
          [t("common.relationships.partyPartners"), summary.totals.partyPartners, "text-amber-300"],
          [t("common.relationships.matchesTogether"), summary.totals.partyMatches, "text-emerald-300"],
        ].map(([label, value, color]) => <div key={String(label)} className="pc-glass-subtle rounded-xl border border-white/5 p-4"><div className="text-xs uppercase tracking-[0.14em] text-pc-text-muted">{label}</div><div className={`mt-2 font-mono text-2xl font-bold ${color}`}>{formatNumber(Number(value))}</div></div>)}
      </div>

      <section className="rounded-2xl border border-white/5 bg-pc-bg-elevated p-4 shadow-lg sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Swords aria-hidden="true" className="h-5 w-5 text-pc-accent" /><h2 className="text-lg font-bold text-pc-text">{t("common.relationships.encounterMix")}</h2></div>
          <div className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.mode} type="button" onClick={() => setMode(tab.mode)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${mode === tab.mode ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-secondary text-pc-text-muted hover:text-pc-text"}`}>{tab.label} · {formatNumber(tab.count)}</button>)}</div>
        </div>
        {rows.length === 0 ? <EmptyState title={t("common.relationships.empty")} /> : <PlayerRelationshipBars rows={rows} tone={mode === "opponents" ? "violet" : mode === "party" ? "amber" : "cyan"} showDetails />}
      </section>
      <p className="text-xs text-pc-text-muted">{t("common.relationships.rankedOnly")}</p>
    </div>
  );
}
