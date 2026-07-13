"use client";

import Link from "next/link";
import { useState } from "react";
import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { computeDamageStats, num, fixed } from "./format";
import LoadoutStrip from "./loadout-strip";
import PartyBadge, { getPartyNumber } from "./party-badge";

interface StatTableRowProps {
  player: MatchPlayerDetail;
  fact?: MatchFactPlayer;
  wins: boolean;
}

export default function StatTable({ player, fact, wins }: StatTableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const damageStats = computeDamageStats(player);
  const championHref = player.champion_name ? `/champions/${championSlug(player.champion_name)}` : undefined;

  const rowBg = wins ? "bg-green-500/5" : "bg-red-500/5";
  const rowBorder = wins ? "border-green-500/20" : "border-red-500/20";

  // Compact item/loadout thumbnails with levels
  const loadoutIcons = fact
    ? [
        ...fact.items.map((i) => ({
          icon: i.icon_url,
          fallback: i.fallback_icon_url,
          label: i.item_name || "Item",
          level: i.item_level ?? null,
        })),
        ...fact.cards.map((c) => ({
          icon: c.icon_url,
          fallback: c.fallback_icon_url,
          label: c.card_name || "Card",
          level: c.card_level ?? null,
        })),
        ...fact.talents.map((t) => ({
          icon: t.icon_url,
          fallback: t.fallback_icon_url,
          label: t.talent_name || "Talent",
          level: null,
        })),
      ]
    : [];

  const championSrc = getChampionIconSafe(player.champion_name) || "/images/default-champion.png";
  const partyNumber = getPartyNumber(player);

  // IMPORTANT: Return a React Fragment, NOT a <div>, because these <tr> elements
  // are direct children of <tbody> — <div> inside <tbody> is invalid HTML and
  // browsers will silently break the DOM tree (the "disappearing content" bug).
  return (
    <>
      {/* Main summary row — clickable to expand */}
      <tr
        className={`${rowBg} cursor-pointer transition-colors hover:bg-pc-bg-secondary/50 ${rowBorder}`}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {/* Player */}
        <td className="py-2 px-3">
          <div className="flex items-center gap-2">
            <img
              src={championSrc}
              alt={player.champion_name || "Champion"}
              className="w-7 h-7 rounded-full border border-pc-border bg-pc-bg-secondary"
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/default-champion.png"; }}
            />
            <div className="min-w-0">
              <Link href={`/players/${player.player_id}`} className="text-sm font-medium text-pc-text hover:text-pc-accent block truncate">
                {player.player_name || "PRIVATE"}
              </Link>
              {championHref ? (
                <Link href={championHref} className="text-xs text-pc-text-secondary truncate block">
                  {player.champion_name}
                </Link>
              ) : (
                <span className="text-xs text-pc-text-secondary">#{player.champion_id}</span>
              )}
              {player.skin_name && (
                <span className="text-[10px] text-pc-text-muted truncate block">{player.skin_name}</span>
              )}
            </div>
          </div>
        </td>

        {/* Level/Tier */}
        <td className="py-2 px-2 text-xs text-pc-text-secondary">{player.league_tier || "—"}</td>

        {/* K/D/A */}
        <td className="py-2 px-2 text-sm font-medium text-pc-text text-center">
          {num(player.kills)}/{num(player.deaths)}/{num(player.assists)}
        </td>

        {/* Credits */}
        <td className="py-2 px-2 text-sm text-pc-text-secondary text-center">{num(player.gold_earned)}</td>

        {/* CPM (Credits/min) */}
        <td className="py-2 px-2 text-xs text-pc-text-secondary text-center">{fixed(player.gold_per_minute, 0)}</td>

        {/* Damage */}
        <td className="py-2 px-2 text-sm font-medium text-pc-text text-center">{num(damageStats.totalDamage)}</td>

        {/* Taken */}
        <td className="py-2 px-2 text-sm text-pc-text-secondary text-center">{num(player.damage_taken)}</td>

        {/* Shielding */}
        <td className="py-2 px-2 text-sm text-pc-text-secondary text-center">{num(player.damage_mitigated)}</td>

        {/* Loadout icons with level badges */}
        <td className="py-2 px-2">
          <div className="flex gap-1">
            {loadoutIcons.slice(0, 5).map((item, idx) => {
              const safeSrc = item.icon || item.fallback || "";
              return (
                <div
                  key={idx}
                  className="relative"
                  title={item.level ? `${item.label} — Level ${item.level}` : item.label}
                >
                  <img
                    src={safeSrc}
                    alt={item.label}
                    className="w-5 h-5 rounded border border-pc-border bg-pc-bg-secondary"
                    onError={(e) => { (e.target as HTMLImageElement).src = (item.fallback || ""); }}
                  />
                  {item.level !== null && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-pc-text text-[8px] font-bold text-pc-bg">
                      {item.level}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </td>
      </tr>

      {/* Expanded details row — shows ALL data from the API */}
      {expanded && (
        <tr className={`${rowBg} border-b border-pc-border/30`}>
          <td colSpan={9} className="py-3 px-3">
            {/* ── Quick stat grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* Core per-minute stats */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">DPM</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.damage_per_minute, 0)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">KDA</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.kda, 2)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">HPM</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.healing_per_minute, 0)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">SHPM</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.healing_self_per_minute, 0)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">CPM</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.gold_per_minute, 0)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">eCPM</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.egpm, 0)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">MPM</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.mitigation_per_minute, 0)}</div>
              </div>

              {/* Damage breakdown */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Total Damage</div>
                <div className="text-sm font-medium text-pc-text">{num(damageStats.totalDamage)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Weapon</div>
                <div className="text-sm font-medium text-pc-text">{num(damageStats.weaponDamage)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Ability</div>
                <div className="text-sm font-medium text-pc-text">{damageStats.nonWeaponDamage != null ? num(damageStats.nonWeaponDamage) : "—"}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Split</div>
                <div className="text-sm font-medium text-pc-text">{damageStats.weaponShare}</div>
              </div>

              {/* Damage breakdown: raw physical + magical */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Physical Dmg</div>
                <div className="text-sm font-medium text-pc-text">{num(player.damage_done_physical)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Magical Dmg</div>
                <div className="text-sm font-medium text-pc-text">{num(player.damage_done_magical)}</div>
              </div>

              {/* Healing breakdown */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Healing</div>
                <div className="text-sm font-medium text-pc-text">{num(player.healing)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Self Heal</div>
                <div className="text-sm font-medium text-pc-text">{num(player.healing_self)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Bot Heal</div>
                <div className="text-sm font-medium text-pc-text">{num(player.healing_bot)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Player Self</div>
                <div className="text-sm font-medium text-pc-text">{num(player.healing_player_self)}</div>
              </div>

              {/* Damage taken & mitigated */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Taken</div>
                <div className="text-sm font-medium text-pc-text">{num(player.damage_taken)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Mitigated</div>
                <div className="text-sm font-medium text-pc-text">{num(player.damage_mitigated)}</div>
              </div>

              {/* Multi-kill streaks */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">First Blood</div>
                <div className="text-sm font-medium text-pc-text">{num(player.kills_first_blood)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Double Kills</div>
                <div className="text-sm font-medium text-pc-text">{num(player.kills_double)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Triple Kills</div>
                <div className="text-sm font-medium text-pc-text">{num(player.kills_triple)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Quadra Kill</div>
                <div className="text-sm font-medium text-pc-text">{num(player.kills_quadra)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Penta Kill</div>
                <div className="text-sm font-medium text-pc-text">{num(player.kills_penta)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Max Multi</div>
                <div className="text-sm font-medium text-pc-text">{num(player.multi_kill_max)}</div>
              </div>

              {/* Objective & game activity */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Objective</div>
                <div className="text-sm font-medium text-pc-text">{num(player.objective_assists)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Spree</div>
                <div className="text-sm font-medium text-pc-text">{num(player.killing_spree)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Camps</div>
                <div className="text-sm font-medium text-pc-text">{num(player.camps_cleared)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Struct Dmg</div>
                <div className="text-sm font-medium text-pc-text">{num(player.structure_damage)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Wards</div>
                <div className="text-sm font-medium text-pc-text">{num(player.wards_placed)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Towers</div>
                <div className="text-sm font-medium text-pc-text">{num(player.towers_destroyed)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Distance</div>
                <div className="text-sm font-medium text-pc-text">{player.distance_traveled != null ? num(Math.round(player.distance_traveled)) : "—"}</div>
              </div>

              {/* Time & identity */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Time in Match</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.time_in_match, 0)}s</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">AFK Rate</div>
                <div className="text-sm font-medium text-pc-text">{fixed(player.afk_rate, 1)}%</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Win Status</div>
                <div className="text-sm font-medium text-pc-text">{player.win_status || "—"}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Team</div>
                <div className="text-sm font-medium text-pc-text">Team {player.task_force}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">Source</div>
                <div className="text-sm font-medium text-pc-text">{player.source || "—"}</div>
              </div>
              {partyNumber != null && (
                <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                  <div className="text-[10px] text-pc-text-muted">Party</div>
                  <PartyBadge player={player} className="mt-0.5" />
                </div>
              )}
            </div>

            {/* ── Full loadout visual strip ── */}
            {fact && (
              <div className="mt-3">
                <div className="text-xs uppercase text-pc-text-muted mb-2 font-semibold">Full Loadout</div>
                <LoadoutStrip fact={fact} />
              </div>
            )}

            {/* ── Detailed loadout: Talents, Items, Cards with names + levels ── */}
            {fact && (fact.talents.length > 0 || fact.items.length > 0 || fact.cards.length > 0) && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Talents */}
                {fact.talents.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-pc-text-muted mb-1 font-semibold">Talents</div>
                    <div className="space-y-1">
                      {fact.talents.map((talent) => (
                        <div key={talent.talent_id} className="text-xs text-pc-text-secondary flex items-center gap-2">
                          <img
                            src={talent.icon_url ?? talent.fallback_icon_url ?? ""}
                            alt={talent.talent_name ?? "Talent"}
                            className="w-5 h-5 rounded shrink-0 border border-pc-border bg-pc-bg-secondary"
                            onError={(e) => { (e.target as HTMLImageElement).src = talent.fallback_icon_url ?? ""; }}
                          />
                          <span className="truncate">{talent.talent_name ?? `Talent #${talent.talent_id}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Items */}
                {fact.items.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-pc-text-muted mb-1 font-semibold">Items</div>
                    <div className="space-y-1">
                      {fact.items.map((item) => (
                        <div key={item.item_id} className="text-xs text-pc-text-secondary flex items-center gap-2">
                          <img
                            src={item.icon_url ?? item.fallback_icon_url ?? ""}
                            alt={item.item_name ?? "Item"}
                            className="w-5 h-5 rounded shrink-0 border border-pc-border bg-pc-bg-secondary"
                            onError={(e) => { (e.target as HTMLImageElement).src = item.fallback_icon_url ?? ""; }}
                          />
                          <span className="truncate">{item.item_name ?? `Item #${item.item_id}`}</span>
                          {item.item_level !== null && item.item_level !== undefined && (
                            <span className="text-pc-text-muted ml-auto">Lvl {item.item_level}</span>
                          )}
                          {item.item_type && (
                            <span className="text-[10px] text-pc-text-muted">({item.item_type})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Cards */}
                {fact.cards.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-pc-text-muted mb-1 font-semibold">Cards</div>
                    <div className="space-y-1">
                      {fact.cards.map((card) => (
                        <div key={card.card_id} className="text-xs text-pc-text-secondary flex items-center gap-2">
                          <img
                            src={card.icon_url ?? card.fallback_icon_url ?? ""}
                            alt={card.card_name ?? "Card"}
                            className="w-5 h-5 rounded shrink-0 border border-pc-border bg-pc-bg-secondary"
                            onError={(e) => { (e.target as HTMLImageElement).src = card.fallback_icon_url ?? ""; }}
                          />
                          <span className="truncate">{card.card_name ?? `Card #${card.card_id}`}</span>
                          {card.card_level !== null && card.card_level !== undefined && (
                            <span className="text-pc-text-muted ml-auto">Lvl {card.card_level}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
