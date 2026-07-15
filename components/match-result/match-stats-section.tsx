"use client";

import Link from "next/link";
import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { computeDamageStats, num, fixed } from "./format";
import { MatchPlayerLink, matchPlayerKey } from "./player-identity";
import { useLocalization } from "@/lib/localization-context";

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
  const { t } = useLocalization();
  const championHref = player.champion_name
    ? `/champions/${championSlug(player.champion_name)}`
    : undefined;
  const damageStats = computeDamageStats(player);
  const totalDamage = damageStats.totalDamage;
  const weaponDamage = damageStats.weaponDamage;
  const hasWeaponBreakdown =
    player.source !== "recovered" || weaponDamage > 0 || totalDamage === 0;
  const nonWeaponDamage = hasWeaponBreakdown
    ? Math.max(totalDamage - weaponDamage, 0)
    : null;

  const icon = getChampionIconSafe(player.champion_name) || "/images/default-champion.png";

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
        {num(player.gold_earned)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.gold_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.egpm, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.kda, 2)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.objective_assists)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(totalDamage)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.damage_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {hasWeaponBreakdown ? num(nonWeaponDamage) : "—"}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.damage_taken)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.damage_mitigated)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.mitigation_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.healing)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.healing_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.healing_self)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.afk_rate, 1)}%
      </td>

    </tr>
  );
}

/* ── Main section ── */

const statColumns = [
  "Player", "Credits", "CPM", "eCPM", "KDA", "Obj",
  "Dmg", "DPM", "Abil", "Taken", "Shielding", "SPM", "Heal", "HPM", "Self", "AFK",
];

function MobilePlayerCard({ player, wins }: { player: MatchPlayerDetail; wins: boolean }) {
  const damageStats = computeDamageStats(player);
  const damage = damageStats.totalDamage;
  const abilityDamage = player.source !== "recovered" || damageStats.weaponDamage > 0 || damage === 0
    ? Math.max(damage - damageStats.weaponDamage, 0)
    : null;
  const champion = player.champion_name || `Champion #${player.champion_id}`;
  const metrics = [
    ["Credits", num(player.gold_earned)],
    ["CPM", fixed(player.gold_per_minute, 0)],
    ["eCPM", fixed(player.egpm, 0)],
    ["KDA", fixed(player.kda, 2)],
    ["Obj", num(player.objective_assists)],
    ["Damage", num(damage)],
    ["DPM", fixed(player.damage_per_minute, 0)],
    ["Abil", abilityDamage == null ? "—" : num(abilityDamage)],
    ["Taken", num(player.damage_taken)],
    ["Shielding", num(player.damage_mitigated)],
    ["SPM", fixed(player.mitigation_per_minute, 0)],
    ["Healing", num(player.healing)],
    ["HPM", fixed(player.healing_per_minute, 0)],
    ["Self", num(player.healing_self)],
    ["AFK", `${fixed(player.afk_rate, 1)}%`],
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
      {metrics.map(([label, value]) => <div key={label} className="rounded-lg border border-pc-border/60 bg-pc-bg-secondary/50 px-2.5 py-2"><dt className="text-[9px] uppercase tracking-wide text-pc-text-muted">{label}</dt><dd className="mt-0.5 truncate font-mono text-xs font-semibold text-pc-text">{value}</dd></div>)}
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
  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-pc-border">
        <h2 className="text-lg font-bold text-pc-text uppercase tracking-wide">
          {t("generated.matches.playerMetrics")}</h2>
      </div>

      <div className="lg:hidden">
        <div className="border-b border-pc-border bg-pc-bg-secondary/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">{team1Label}</div>
        {team1Players.map((player) => <MobilePlayerCard key={matchPlayerKey(player)} player={player} wins={team1Wins} />)}
        <div className="border-y border-pc-border bg-pc-bg-secondary/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">{team2Label}</div>
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
                  className={`px-1.5 py-2 text-[10px] uppercase tracking-wide text-pc-text-muted font-medium ${col === "Player" ? "text-left" : "text-center"}`}
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
