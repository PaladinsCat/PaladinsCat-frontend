"use client";

import Link from "next/link";
import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { computeDamageStats } from "./format";
import { MatchPlayerLink, matchPlayerKey } from "./player-identity";
import { useLocalization } from "@/lib/localization-context";
import { ecpmActivityLabelKey, ecpmActivityTextClass, ecpmConfidenceBracket } from "@/lib/ecpm-activity";

interface MatchStatsSectionProps {
  team1Players: MatchPlayerDetail[];
  team2Players: MatchPlayerDetail[];
  team1Wins: boolean;
  team2Wins: boolean;
  team1Label: string;
  team2Label: string;
  factMap: Map<string, MatchFactPlayer>;
}

function formatItemDisplayLevel(level?: number | null): number | null {
  if (level == null || !Number.isFinite(Number(level))) return null;
  return Number(level) + 1;
}

function formatCardDisplayLevel(level?: number | null): number | null {
  if (level == null || !Number.isFinite(Number(level))) return null;
  return Number(level);
}

/* ── Single player row (Guru-style) ── */

function PlayerRow({
  player,
  fact,
  wins,
  teamLabel,
}: {
  player: MatchPlayerDetail;
  fact?: MatchFactPlayer;
  wins: boolean;
  teamLabel: string;
}) {
  const { t, formatNumber, formatPercent } = useLocalization();
  const championHref = player.champion_name
    ? `/champions/${championSlug(player.champion_name)}`
    : undefined;
  const damageStats = computeDamageStats(player);
  const totalDamage = damageStats.totalDamage;
  const activityLabelKey = ecpmActivityLabelKey(player.egpm);
  const confidenceBracket = ecpmConfidenceBracket(player.egpm);
  const activityLabel = activityLabelKey && confidenceBracket
    ? `${t(activityLabelKey)} · ${formatPercent(confidenceBracket.minimum)}–${formatPercent(confidenceBracket.maximum)}`
    : "—";

  const icon = getChampionIconSafe(player.champion_name) || "/images/champions/Champion_Generic_Icon.avif";

  return (
    <tr
      className={`border-b border-pc-border/50 hover:bg-pc-bg-secondary/60 transition-colors ${
        wins ? "bg-green-500/[0.04]" : ""
      }`}
    >
      {/* Champion icon + player info */}
      <td className="px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={icon}
            alt={player.champion_name || t("generated.matches.champion")}
            className="h-8 w-8 rounded shrink-0 border border-pc-border object-cover"
          />
          <div className="min-w-0">
            <MatchPlayerLink player={player} className="block truncate text-sm font-medium text-pc-text hover:text-pc-accent" />
            {championHref ? (
              <Link
                href={championHref}
                className="block truncate text-xs text-pc-text-secondary hover:text-pc-accent"
              >
                {player.champion_name}
              </Link>
            ) : (
              <span className="block truncate text-xs text-pc-text-secondary">
                #{player.champion_id}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Numeric stat columns */}
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.gold_earned)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.gold_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className={`px-2 py-2 text-center text-xs font-semibold whitespace-nowrap ${ecpmActivityTextClass(player.egpm)}`}>
        {formatNumber(player.egpm, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.kda, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.objective_assists)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(totalDamage)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.damage_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {damageStats.hasWeaponBreakdown ? formatNumber(damageStats.weaponDamage) : "—"}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {damageStats.weaponPerMinute == null ? "—" : formatNumber(damageStats.weaponPerMinute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {damageStats.nonWeaponDamage == null ? "—" : formatNumber(damageStats.nonWeaponDamage)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {damageStats.abilityPerMinute == null ? "—" : formatNumber(damageStats.abilityPerMinute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.damage_taken)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.damage_mitigated)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.mitigation_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.healing)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.healing_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {formatNumber(player.healing_self)}
      </td>
      <td className={`px-2 py-2 text-center text-xs font-semibold whitespace-nowrap ${ecpmActivityTextClass(player.egpm)}`}>
        {activityLabel}
      </td>

    </tr>
  );
}

/* ── Main section ── */

function MobilePlayerCard({ player, wins }: { player: MatchPlayerDetail; wins: boolean }) {
  const { t, formatNumber, formatPercent } = useLocalization();
  const damageStats = computeDamageStats(player);
  const damage = damageStats.totalDamage;
  const champion = player.champion_name || `Champion #${player.champion_id}`;
  const activityLabelKey = ecpmActivityLabelKey(player.egpm);
  const confidenceBracket = ecpmConfidenceBracket(player.egpm);
  const activityLabel = activityLabelKey && confidenceBracket
    ? `${t(activityLabelKey)} · ${formatPercent(confidenceBracket.minimum)}–${formatPercent(confidenceBracket.maximum)}`
    : "—";
  const activityClass = ecpmActivityTextClass(player.egpm);
  const metrics = [
    { label: t("generated.match.stats.credits"), value: formatNumber(player.gold_earned) },
    { label: t("common.metrics.cpm"), value: formatNumber(player.gold_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    { label: t("common.metrics.ecpm"), value: formatNumber(player.egpm, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), className: activityClass },
    { label: t("common.metrics.kda"), value: formatNumber(player.kda, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { label: t("generated.match.stats.obj"), value: formatNumber(player.objective_assists) },
    { label: t("generated.match.stats.damage"), value: formatNumber(damage) },
    { label: t("common.metrics.dpm"), value: formatNumber(player.damage_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    { label: t("generated.matches.weapon"), value: damageStats.hasWeaponBreakdown ? formatNumber(damageStats.weaponDamage) : "—" },
    { label: t("common.metrics.wpm"), value: damageStats.weaponPerMinute == null ? "—" : formatNumber(damageStats.weaponPerMinute, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    { label: t("generated.match.stats.abil"), value: damageStats.nonWeaponDamage == null ? "—" : formatNumber(damageStats.nonWeaponDamage) },
    { label: t("common.metrics.apm"), value: damageStats.abilityPerMinute == null ? "—" : formatNumber(damageStats.abilityPerMinute, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    { label: t("generated.match.stats.taken"), value: formatNumber(player.damage_taken) },
    { label: t("generated.match.stats.shielding"), value: formatNumber(player.damage_mitigated) },
    { label: t("common.metrics.spm"), value: formatNumber(player.mitigation_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    { label: t("generated.match.stats.healing"), value: formatNumber(player.healing) },
    { label: t("common.metrics.hpm"), value: formatNumber(player.healing_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) },
    { label: t("generated.match.stats.self"), value: formatNumber(player.healing_self) },
    { label: t("common.metrics.afk"), value: activityLabel, className: activityClass },
  ];

  return <article className={`border-b border-pc-border/60 p-3 last:border-b-0 ${wins ? "bg-emerald-400/[0.035]" : ""}`}>
    <div className="flex min-w-0 items-center gap-3">
      <img src={getChampionIconSafe(player.champion_name)} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-pc-border object-cover" />
      <div className="min-w-0 flex-1">
        <MatchPlayerLink player={player} className="block truncate text-sm font-semibold text-pc-text hover:text-pc-accent" />
        {player.champion_name ? <Link href={`/champions/${championSlug(player.champion_name)}`} className="block truncate text-xs text-pc-text-secondary hover:text-pc-accent">{champion}</Link> : <span className="text-xs text-pc-text-secondary">{champion}</span>}
      </div>
    </div>
    <dl className="mt-3 grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-3">
      {metrics.map(({ label, value, className }) => <div key={label} className="rounded-lg border border-pc-border/60 bg-pc-bg-secondary/50 px-2.5 py-2"><dt className="text-xs uppercase tracking-wide text-pc-text-muted">{label}</dt><dd className={`mt-0.5 truncate font-mono text-xs font-semibold ${className ?? "text-pc-text"}`}>{value}</dd></div>)}
    </dl>
  </article>;
}

export default function MatchStatsSection({
  team1Players,
  team2Players,
  team1Wins,
  team2Wins,
  team1Label,
  team2Label,
  factMap,
}: MatchStatsSectionProps) {
  const { t } = useLocalization();
  const statColumns = [
    t("generated.match.stats.player"), t("generated.match.stats.credits"), t("common.metrics.cpm"), t("common.metrics.ecpm"), t("common.metrics.kda"), t("generated.match.stats.obj"),
    t("common.roles.damageShort"), t("common.metrics.dpm"), t("generated.matches.weapon"), t("common.metrics.wpm"), t("generated.match.stats.abil"), t("common.metrics.apm"), t("generated.match.stats.taken"), t("generated.match.stats.shielding"), t("common.metrics.spm"), t("generated.match.stats.healing"), t("common.metrics.hpm"), t("generated.match.stats.self"), t("common.metrics.afk"),
  ];
  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-pc-border">
        <h2 className="text-lg font-bold text-pc-text uppercase tracking-wide">
          {t("generated.matches.playerMetrics")}</h2>
      </div>

      <div className="lg:hidden">
        <div className="border-b border-pc-border bg-pc-bg-secondary/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-pc-text-muted">{team1Label}</div>
        {team1Players.map((player) => <MobilePlayerCard key={matchPlayerKey(player)} player={player} wins={team1Wins} />)}
        <div className="border-y border-pc-border bg-pc-bg-secondary/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-pc-text-muted">{team2Label}</div>
        {team2Players.map((player) => <MobilePlayerCard key={matchPlayerKey(player)} player={player} wins={team2Wins} />)}
      </div>

      <div className="hidden lg:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[180px] xl:w-[210px]" />
            {statColumns.slice(1).map((column) => <col key={column} />)}
          </colgroup>
          <thead>
            <tr className="border-b border-pc-border/60 bg-pc-bg-secondary/50">
              {statColumns.map((col) => (
                <th
                  key={col}
                  className={`px-1.5 py-2 text-xs uppercase tracking-wide text-pc-text-muted font-medium ${col === t("generated.match.stats.player") ? "text-left" : "text-center"}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Team 1 rows */}
            {team1Players.map((p) => (
              <PlayerRow
                key={matchPlayerKey(p)}
                player={p}
                fact={factMap.get(String(p.player_id))}
                wins={team1Wins}
                teamLabel={team1Label}
              />
            ))}
            {/* Team 2 rows */}
            {team2Players.map((p) => (
              <PlayerRow
                key={matchPlayerKey(p)}
                player={p}
                fact={factMap.get(String(p.player_id))}
                wins={team2Wins}
                teamLabel={team2Label}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
