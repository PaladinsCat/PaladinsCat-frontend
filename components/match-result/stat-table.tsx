"use client";

import Link from "next/link";
import { useState } from "react";
import type { MatchPlayerDetail, MatchFactPlayer } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { computeDamageStats } from "./format";
import LoadoutStrip from "./loadout-strip";
import PartyBadge, { getPartyNumber } from "./party-badge";
import { MatchPlayerLink } from "./player-identity";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import { useLocalization } from "@/lib/localization-context";

interface StatTableRowProps {
  player: MatchPlayerDetail;
  fact?: MatchFactPlayer;
  wins: boolean;
}

export default function StatTable({ player, fact, wins }: StatTableRowProps) {
  const { t, formatNumber, formatPercent } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const damageStats = computeDamageStats(player);
  const championHref = player.champion_name ? `/champions/${championSlug(player.champion_name)}` : undefined;

  const rowBg = wins ? "bg-green-500/5" : "bg-red-500/5";
  const rowBorder = wins ? "border-green-500/20" : "border-red-500/20";

  // Compact item/loadout thumbnails with levels
  const loadoutIcons = fact
    ? [
        ...fact.items.map((i) => ({
          type: "item" as const,
          icon: i.icon_url,
          fallback: i.fallback_icon_url,
          label: i.item_name || "Item",
          level: i.item_level ?? null,
        })),
        ...fact.cards.map((c) => ({
          type: "card" as const,
          icon: c.icon_url,
          fallback: c.fallback_icon_url,
          label: c.card_name || "Card",
          level: c.card_level ?? null,
        })),
        ...fact.talents.map((t) => ({
          type: "talent" as const,
          talentId: t.talent_id,
          icon: null,
          fallback: null,
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
              alt={player.champion_name || t("generated.matches.champion")}
              className="w-7 h-7 rounded-full border border-pc-border bg-pc-bg-secondary"
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/default-champion.png"; }}
            />
            <div className="min-w-0">
              <MatchPlayerLink player={player} className="text-sm font-medium text-pc-text hover:text-pc-accent block truncate" />
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
          {formatNumber(player.kills)}/{formatNumber(player.deaths)}/{formatNumber(player.assists)}
        </td>

        {/* Credits */}
        <td className="py-2 px-2 text-sm text-pc-text-secondary text-center">{formatNumber(player.gold_earned)}</td>

        {/* CPM (Credits/min) */}
        <td className="py-2 px-2 text-xs text-pc-text-secondary text-center">{formatNumber(player.gold_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>

        {/* Damage */}
        <td className="py-2 px-2 text-sm font-medium text-pc-text text-center">{formatNumber(damageStats.totalDamage)}</td>

        {/* Taken */}
        <td className="py-2 px-2 text-sm text-pc-text-secondary text-center">{formatNumber(player.damage_taken)}</td>

        {/* Shielding */}
        <td className="py-2 px-2 text-sm text-pc-text-secondary text-center">{formatNumber(player.damage_mitigated)}</td>

        {/* Loadout icons with level badges */}
        <td className="py-2 px-2">
          <div className="flex gap-1">
            {loadoutIcons.slice(0, 5).map((item, idx) => {
              const safeSrc = item.icon || item.fallback || "";
              return (
                <div
                  key={idx}
                  className="relative"
                  title={item.level ? t("generated.matches.value1LevelValue2", { value1: item.label, value2: item.level }) : item.label}
                >
                  {item.type === "talent" ? (
                    <CanonicalTalentImage
                      talentId={item.talentId}
                      talentName={item.label}
                      className="w-5 h-5 rounded border border-pc-border bg-pc-bg-secondary object-contain"
                      fallbackClassName="w-5 h-5 rounded border border-pc-border bg-pc-bg-secondary"
                      loading="eager"
                    />
                  ) : (
                    <img
                      src={safeSrc}
                      alt={item.label}
                      className="w-5 h-5 rounded border border-pc-border bg-pc-bg-secondary"
                      onError={(e) => { (e.target as HTMLImageElement).src = (item.fallback || ""); }}
                    />
                  )}
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
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.dpm")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.damage_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.kda")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.kda, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.hpm")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.healing_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.shpm")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.healing_self_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.cpm")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.gold_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.ecpm")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.egpm, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.spm")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.mitigation_per_minute, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
              </div>

              {/* Damage breakdown */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.totalDamage.d5e892e")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(damageStats.totalDamage)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.weapon")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(damageStats.weaponDamage)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.ability")}</div>
                <div className="text-sm font-medium text-pc-text">{damageStats.nonWeaponDamage != null ? formatNumber(damageStats.nonWeaponDamage) : "—"}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.split")}</div>
                <div className="text-sm font-medium text-pc-text">{formatPercent(damageStats.weaponShare)}</div>
              </div>

              {/* Damage breakdown: raw physical + magical */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.physicalDmg")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.damage_done_physical)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.magicalDmg")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.damage_done_magical)}</div>
              </div>

              {/* Healing breakdown */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.healing")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.healing)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.selfHeal")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.healing_self)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.botHeal")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.healing_bot)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.playerSelf")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.healing_player_self)}</div>
              </div>

              {/* Damage taken & shielding */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.taken")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.damage_taken)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.shielding")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.damage_mitigated)}</div>
              </div>

              {/* Multi-kill streaks */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.firstBlood")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.kills_first_blood)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.doubleKills")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.kills_double)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.tripleKills")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.kills_triple)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.quadraKill")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.kills_quadra)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.pentaKill")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.kills_penta)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.maxMulti")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.multi_kill_max)}</div>
              </div>

              {/* Objective & game activity */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.objective")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.objective_assists)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.spree")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.killing_spree)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.camps")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.camps_cleared)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.structDmg")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.structure_damage)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.wards")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.wards_placed)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.towers")}</div>
                <div className="text-sm font-medium text-pc-text">{formatNumber(player.towers_destroyed)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.distance")}</div>
                <div className="text-sm font-medium text-pc-text">{player.distance_traveled != null ? formatNumber(Math.round(player.distance_traveled)) : "—"}</div>
              </div>

              {/* Time & identity */}
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.timeInMatch")}</div>
                <div className="text-sm font-medium text-pc-text">{t("common.format.secondsShort", { seconds: formatNumber(player.time_in_match, { maximumFractionDigits: 0 }) })}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.afkRate")}</div>
                <div className="text-sm font-medium text-pc-text">{formatPercent(player.afk_rate)}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.winStatus")}</div>
                <div className="text-sm font-medium text-pc-text">{player.win_status || "—"}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.team")}</div>
                <div className="text-sm font-medium text-pc-text">{t("generated.matches.team")}{" "}{player.task_force}</div>
              </div>
              <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                <div className="text-[10px] text-pc-text-muted">{t("generated.matches.source")}</div>
                <div className="text-sm font-medium text-pc-text">{player.source || "—"}</div>
              </div>
              {partyNumber != null && (
                <div className="bg-pc-bg-secondary/50 rounded px-2 py-1">
                  <div className="text-[10px] text-pc-text-muted">{t("generated.matches.party")}</div>
                  <PartyBadge player={player} className="mt-0.5" />
                </div>
              )}
            </div>

            {/* ── Full loadout visual strip ── */}
            {fact && (
              <div className="mt-3">
                <div className="text-xs uppercase text-pc-text-muted mb-2 font-semibold">{t("generated.matches.fullLoadout")}</div>
                <LoadoutStrip fact={fact} />
              </div>
            )}

            {/* ── Detailed loadout: Talents, Items, Cards with names + levels ── */}
            {fact && (fact.talents.length > 0 || fact.items.length > 0 || fact.cards.length > 0) && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Talents */}
                {fact.talents.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-pc-text-muted mb-1 font-semibold">{t("generated.matches.talents")}</div>
                    <div className="space-y-1">
                      {fact.talents.map((talent) => (
                        <div key={talent.talent_id} className="text-xs text-pc-text-secondary flex items-center gap-2">
                          <CanonicalTalentImage
                            talentId={talent.talent_id}
                            talentName={talent.talent_name}
                            className="h-10 w-10 shrink-0 object-contain"
                            fallbackClassName="h-10 w-10 shrink-0"
                          />
                          <span className="truncate">{talent.talent_name ?? t("generated.matches.talentValue1", { value1: talent.talent_id })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Items */}
                {fact.items.length > 0 && (
                  <div>
                    <div className="text-xs uppercase text-pc-text-muted mb-1 font-semibold">{t("generated.matches.items")}</div>
                    <div className="space-y-1">
                      {fact.items.map((item) => (
                        <div key={item.item_id} className="text-xs text-pc-text-secondary flex items-center gap-2">
                          <img
                            src={item.icon_url ?? item.fallback_icon_url ?? ""}
                            alt={item.item_name ?? t("generated.matches.item")}
                            className="w-5 h-5 rounded shrink-0 border border-pc-border bg-pc-bg-secondary"
                            onError={(e) => { (e.target as HTMLImageElement).src = item.fallback_icon_url ?? ""; }}
                          />
                          <span className="truncate">{item.item_name ?? t("generated.matches.itemValue1", { value1: item.item_id })}</span>
                          {item.item_level !== null && item.item_level !== undefined && (
                            <span className="text-pc-text-muted ml-auto">{t("generated.matches.lvl")}{" "}{item.item_level}</span>
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
                    <div className="text-xs uppercase text-pc-text-muted mb-1 font-semibold">{t("generated.matches.cards")}</div>
                    <div className="space-y-1">
                      {fact.cards.map((card) => (
                        <div key={card.card_id} className="text-xs text-pc-text-secondary flex items-center gap-2">
                          <img
                            src={card.icon_url ?? card.fallback_icon_url ?? ""}
                            alt={card.card_name ?? t("generated.matches.card")}
                            className="w-5 h-5 rounded shrink-0 border border-pc-border bg-pc-bg-secondary"
                            onError={(e) => { (e.target as HTMLImageElement).src = card.fallback_icon_url ?? ""; }}
                          />
                          <span className="truncate">{card.card_name ?? t("generated.matches.cardValue1", { value1: card.card_id })}</span>
                          {card.card_level !== null && card.card_level !== undefined && (
                            <span className="text-pc-text-muted ml-auto">{t("generated.matches.lvl")}{" "}{card.card_level}</span>
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
