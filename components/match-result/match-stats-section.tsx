"use client";

import Link from "next/link";
import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { computeDamageStats, num, fixed } from "./format";

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
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={icon}
            alt={player.champion_name || "Champion"}
            className="h-8 w-8 rounded shrink-0 border border-pc-border object-cover"
          />
          <div className="min-w-0">
            <Link
              href={`/players/${player.player_id}`}
              className="block truncate text-sm font-medium text-pc-text hover:text-pc-accent"
            >
              {player.player_name || "PRIVATE"}
            </Link>
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
        {num(player.kills)}/{num(player.deaths)}/{num(player.assists)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.damage_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.kda, 2)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.healing_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.gold_per_minute, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.egpm, 0)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(totalDamage)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {hasWeaponBreakdown ? num(nonWeaponDamage) : "—"}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.healing_self)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.healing)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.damage_mitigated)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.damage_taken)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {num(player.objective_assists)}
      </td>
      <td className="px-2 py-2 text-center text-xs whitespace-nowrap">
        {fixed(player.afk_rate, 1)}%
      </td>

    </tr>
  );
}

/* ── Main section ── */

const statColumns = [
  "Player", "K/D/A", "DPM", "KDA", "HPM", "GPM", "eGPM",
  "Dmg", "Abil", "Self", "Heal", "Mit", "Taken", "Obj", "AFK",
];

export default function MatchStatsSection({
  team1Players,
  team2Players,
  team1Wins,
  team2Wins,
  team1Label,
  team2Label,
  factMap,
}: MatchStatsSectionProps) {
  return (
    <section className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-pc-border">
        <h2 className="text-lg font-bold text-pc-text uppercase tracking-wide">
          Player Metrics
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-pc-border/60 bg-pc-bg-secondary/50">
              {statColumns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-2 text-[10px] uppercase tracking-wider text-pc-text-muted font-medium text-center"
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
                key={p.player_id}
                player={p}
                fact={factMap.get(String(p.player_id))}
                wins={team1Wins}
                teamLabel={team1Label}
              />
            ))}
            {/* Team 2 rows */}
            {team2Players.map((p) => (
              <PlayerRow
                key={p.player_id}
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
