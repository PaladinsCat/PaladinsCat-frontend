/**
 * Renders matchup card data for match-result views.
 * Keeps the component's interaction and accessibility behavior intact.
 */
"use client";

import Link from "next/link";
import type { MatchResultPlayer } from "./types";
import { championSlug } from "@/lib/utils";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getChampionStats } from "./format";
import { getRankIconPath, resolveEffectiveTier } from "@/lib/tier-utils";
import PartyBadge from "./party-badge";
import { MatchPlayerLink } from "./player-identity";
import { useLocalization } from "@/lib/localization-context";

function RecordBar({ wins, total, tone }: { wins: number; total: number; tone: "teal" | "green" }) {
  const percent = total > 0 ? Math.max(0, Math.min(100, (wins / total) * 100)) : 50;
  return <div className="h-1.5 overflow-hidden rounded-full bg-pc-bg-secondary"><div className={`h-full rounded-full ${tone === "green" ? "bg-emerald-400" : "bg-pc-accent"}`} style={{ width: `${percent}%` }} /></div>;
}

function RecordSummary({ label, wins, total, tone, eloLabel, elo }: { label: string; wins: number; total: number; tone: "teal" | "green"; eloLabel: string; elo: number | null | undefined }) {
  const { formatNumber, formatPercent, formatRecord, t } = useLocalization();
  const losses = Math.max(0, total - wins);
  return <div>
    <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-pc-text-muted">
      <span>{label}</span>
      <span className="shrink-0 tabular-nums">{total ? formatRecord(wins, losses) : "—"}</span>
    </div>
    <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><RecordBar wins={wins} total={total} tone={tone} /></div><span className="shrink-0 text-xs tabular-nums text-pc-text-secondary">{total > 0 ? t("common.summary.valueMetric", { value: formatPercent((wins / total) * 100), metric: t("generated.matches.wr") }) : "—"}</span></div>
    <div className="mt-1 text-right text-xs text-pc-text-secondary"><span className="text-pc-text-muted">{eloLabel} </span>{elo != null ? formatNumber(elo) : "—"}</div>
  </div>;
}

/** Render MatchupCard from its declared props and match data.
 * Contract: consumes the declared props, preserves event and accessibility behavior, and returns the corresponding UI element.
 * Returns: `React.JSX.Element`
 */
export default function MatchupCard({ player }: { player: MatchResultPlayer }) {
  const { t , formatNumber} = useLocalization();
  const { matchData: md, profileData: profile } = player;
  const champion = md.champion_name;
  const championStats = getChampionStats(profile, champion);
  const championWins = championStats?.wins ?? 0;
  const championGames = championStats?.totalPlays ?? 0;
  const globalWins = profile?.globalWins ?? 0;
  const globalGames = globalWins + (profile?.globalLosses ?? 0);
  // The profile endpoint carries the live leaderboard tier/rank. Prefer it to
  // the match snapshot so Master ↔ Grandmaster updates are reflected promptly.
  const rawTier = Number(profile?.kbmTier ?? md.tier ?? md.league_tier);
  const tier = Number.isFinite(rawTier) && rawTier >= 0 ? Math.min(27, Math.round(rawTier)) : null;
  const tierRank = profile?.kbmRank && profile.kbmRank > 0 ? profile.kbmRank : 0;
  const effectiveTier = tier != null ? resolveEffectiveTier(tier, tierRank) : null;

  return (
    <article className="relative min-w-0 overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated p-3 shadow-sm transition-colors hover:border-pc-accent-mid">
      <PartyBadge player={md} className="absolute right-3 top-3 z-10" />
      <div className="relative flex flex-col items-center text-center">
        <img src={getChampionIconSafe(champion)} alt={champion || t("generated.matches.champion")} className="h-14 w-14 rounded-full border-2 border-pc-border object-cover" onError={(event) => { event.currentTarget.src = "/images/champions/Champion_Generic_Icon.avif"; }} />
        <div className="mt-2 flex w-full items-center justify-center gap-1 text-sm font-bold">
          <MatchPlayerLink player={md} className="min-w-0 truncate text-pc-text hover:text-pc-accent" />
          {profile?.level != null && <span className="shrink-0 text-pc-text-muted">{t("generated.matches.lv")}{" "}{formatNumber(profile.level)}</span>}
        </div>
        {champion ? <Link href={`/champions/${championSlug(champion)}`} className="truncate text-xs text-pc-text-secondary hover:text-pc-accent">{champion}</Link> : <span className="text-xs text-pc-text-muted">{t("generated.matches.championUnknown")}</span>}
      </div>

      <div className="relative mt-3 flex min-h-9 items-center justify-center gap-2 border-y border-dashed border-pc-border/70 py-2 text-center text-xs text-pc-text-secondary">
        {tier != null && <img src={getRankIconPath(tier, tierRank)} alt={effectiveTier?.displayName ?? t("generated.matches.unranked")} className="h-7 w-7 object-contain" loading="lazy" />}
        <span>{effectiveTier ? t("generated.matches.value1Value2", { value1: effectiveTier.displayName, value2: effectiveTier.displayRank > 0 ? ` #${effectiveTier.displayRank}` : "" }) : md.league_tier || t("generated.matches.unranked")}</span>
        {profile?.kbmPoints != null && <span className="font-mono text-pc-text-muted">· {formatNumber(profile.kbmPoints)} {t("generated.matches.tp")}</span>}
      </div>

      <div className="relative space-y-3 pt-3 text-xs">
        <RecordSummary label={t("generated.matches.champion")} wins={championWins} total={championGames} tone="teal" eloLabel={t("common.metrics.championElo")} elo={profile?.championElo} />
        <RecordSummary label={t("generated.matches.global")} wins={globalWins} total={globalGames} tone="green" eloLabel={t("common.metrics.playerElo")} elo={profile?.queueElo} />
      </div>
    </article>
  );
}
