"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchMatchDetail,
  fetchMatchFact,
  fetchMatchSnapshots,
  fetchMatchSearch,
  fetchReferenceChampions,
  fetchReferenceCards,
  fetchReferenceItems,
  fetchReferenceTalents,
  type MatchDetailWithBans,
  type MatchFact,
  type MatchPlayerDetail,
  type MatchFactPlayer,
  type MatchBan,
  type RatingSnapshot,
  type MatchSearchResult,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { formatLocalDateTime, parseBackendDate } from "@/lib/time-format";

type MaterialReference = {
  id: number;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  championId?: number | null;
  championName?: string | null;
  itemType?: string | null;
  iconUrl?: string | null;
};

/**
 * Match Detail Page — /matches/[id]
 *
 * Displays a full match breakdown: header metadata, two-team roster with
 * per-player stats (KDA, DPM, HPM, gold), items/cards/talents fact data,
 * ban list, and rating snapshots (pre/post Glicko-2 changes).
 *
 * Data sources:
 *   GET /api/matches/:id          → match metadata + players + bans
 *   GET /api/matches/fact/:id     → items, cards, talents per player
 *   GET /api/ratings/snapshots/:id → rating changes (pre/post mu/phi)
 *
 * @see C:\PaladinsCat\docs\frontend\match-detail.md
 */
export default function MatchDetailPage() {
  const params = useParams();
  const matchId = parseInt(params.id as string, 10);

  const [match, setMatch] = useState<MatchDetailWithBans | null>(null);
  const [fact, setFact] = useState<MatchFact | null>(null);
  const [snapshots, setSnapshots] = useState<RatingSnapshot[]>([]);
  const [championNameById, setChampionNameById] = useState<Map<number, string>>(new Map());
  const [materialById, setMaterialById] = useState<Map<number, MaterialReference>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Related matches (same queue, nearby time)
  const [related, setRelated] = useState<MatchSearchResult[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  useEffect(() => {
    if (isNaN(matchId)) {
      setError("Invalid match ID");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [detail, factData, snaps, champions, items, talents, cards, staticMaterials, staticCardMaterials, staticTalentMaterials] = await Promise.all([
          fetchMatchDetail(matchId),
          fetchMatchFact(matchId),
          fetchMatchSnapshots(matchId).catch(() => [] as RatingSnapshot[]),
          fetchReferenceChampions().catch(() => []),
          fetchReferenceItems().catch(() => []),
          fetchReferenceTalents().catch(() => []),
          fetchReferenceCards().catch(() => []),
          fetch("/data/paladins-items-reference.json").then((res) => res.ok ? res.json() : []).catch(() => []),
          fetch("/data/paladins-card-reference.json").then((res) => res.ok ? res.json() : []).catch(() => []),
          fetch("/data/paladins-talent-reference.json").then((res) => res.ok ? res.json() : []).catch(() => []),
        ]);

        if (!detail) {
          setError("Match not found");
          return;
        }

        setMatch(detail);
        setFact(factData);
        setSnapshots(snaps);
        setChampionNameById(new Map(champions.map((champion) => [Number(champion.id), champion.name])));
        setMaterialById(buildMaterialReferenceMap(items, talents, cards, staticMaterials, staticCardMaterials, staticTalentMaterials));

        // Load related matches (same queue, same region, nearby time)
        setRelatedLoading(true);
        // CRITICAL: Guard against Invalid Date. If entry_datetime is malformed,
        // new Date() produces Invalid Date, getTime() returns NaN, arithmetic
        // produces NaN, toISOString() returns "Invalid Date". The backend
        // receives "Invalid Date" as the date range → unexpected results.
        // Source: Fault #11 — "Invalid Date propagates to backend"
        const window = parseBackendDate(detail.match.entry_datetime);
        if (window) {
          const from = new Date(window.getTime() - 2 * 3600 * 1000).toISOString();
          const to = new Date(window.getTime() + 2 * 3600 * 1000).toISOString();
          const searchResult = await fetchMatchSearch({
            queueId: String(detail.match.queue_id),
            region: detail.match.region,
            from,
            to,
            perPage: "5",
          }).catch(() => null);
          if (searchResult) {
            setRelated(searchResult.data.filter((m: MatchSearchResult) => m.match_id !== matchId).slice(0, 5));
          }
        }
        setRelatedLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load match");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [matchId]);

  /* ── Derived data ── */

  const queueLabel = match ? queueName(match.match.queue_id) : "";
  const isRanked = match?.match.is_ranked ?? false;
  const duration = match ? formatDuration(match.match.duration_seconds) : "";
  const timestamp = match ? formatLocalDateTime(match.match.entry_datetime) : "";

  // Split players into two teams
  const team1: MatchPlayerDetail[] = match
    ? match.match.winning_task_force === 1
      ? match.players.filter((p) => p.task_force === 1)
      : match.players.filter((p) => p.task_force === 2)
    : [];
  const team2: MatchPlayerDetail[] = match
    ? match.match.winning_task_force === 1
      ? match.players.filter((p) => p.task_force === 2)
      : match.players.filter((p) => p.task_force === 1)
    : [];

  // Winner is the team with winning_task_force
  const winnerTF = match?.match.winning_task_force ?? 0;
  const team1Wins = winnerTF === 1;
  const team2Wins = winnerTF === 2;

  // Fact lookup by player_id
  const factMap = new Map<number, MatchFactPlayer>();
  if (fact) {
    for (const fp of fact.players) {
      factMap.set(Number(fp.player_id), resolveFactPlayerMaterials(fp, materialById, championNameById));
    }
  }
  const resolvedBans = match?.bans.map((ban) => ({
    ...ban,
    champion_name: ban.champion_name || championNameById.get(Number(ban.champion_id)),
  })) ?? [];

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-pc-bg-elevated rounded w-1/3" />
          <div className="h-4 bg-pc-bg-elevated rounded w-1/2" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-pc-bg-elevated rounded" />
            <div className="h-64 bg-pc-bg-elevated rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-400 text-lg">{error}</div>
        <Link href="/matches" className="text-pc-accent hover:underline mt-4 inline-block">
          ← Back to matches
        </Link>
      </div>
    );
  }

  if (!match) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Header ── */}
      <MatchHeader
        matchId={match.match.match_id}
        queueLabel={queueLabel}
        isRanked={isRanked}
        map={match.match.map}
        duration={duration}
        timestamp={timestamp}
        region={match.match.region}
        team1Wins={team1Wins}
        team2Wins={team2Wins}
        team1Score={match.match.team1_score}
        team2Score={match.match.team2_score}
        broken={match.match.broken}
        recovered={match.match.recovered}
        private={match.match.private}
      />

      {/* ── Bans ── */}
      {resolvedBans.length > 0 && <BansSection bans={resolvedBans} />}

      {/* ── Teams ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamColumn
          players={team1}
          factMap={factMap}
          wins={team1Wins}
          label="Task Force 1"
        />
        <TeamColumn
          players={team2}
          factMap={factMap}
          wins={team2Wins}
          label="Task Force 2"
        />
      </div>

      {/* ── Rating Snapshots ── */}
      {snapshots.length > 0 && <SnapshotsSection snapshots={snapshots} />}

      {/* ── Related Matches ── */}
      <RelatedMatches related={related} matchId={matchId} loading={relatedLoading} />
    </div>
  );
}

/* ── Sub-components ── */

function MatchHeader(props: {
  matchId: number;
  queueLabel: string;
  isRanked: boolean;
  map: string;
  duration: string;
  timestamp: string;
  region: string;
  team1Wins: boolean;
  team2Wins: boolean;
  team1Score: number;
  team2Score: number;
  broken: boolean;
  recovered: boolean;
  private: boolean;
}) {
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-pc-text flex items-center gap-3">
            Match #{props.matchId}
            {props.isRanked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Ranked
              </span>
            )}
            {!props.isRanked && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                Casual
              </span>
            )}
            {props.broken && !props.recovered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Broken
              </span>
            )}
            {props.recovered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Recovered
              </span>
            )}
            {props.private && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Private
              </span>
            )}
          </h1>
          <p className="text-pc-text-secondary mt-1">
            {props.queueLabel} · {props.map} · {props.region}
          </p>
        </div>
        <div className="text-right text-sm text-pc-text-secondary">
          <div>{props.duration}</div>
          <div>{props.timestamp}</div>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`flex-1 text-center py-2 rounded-lg ${props.team1Wins ? "bg-green-500/10 border border-green-500/30" : "bg-pc-bg-secondary"}`}>
          <div className="text-sm text-pc-text-secondary">TF 1</div>
          <div className={`text-2xl font-bold ${props.team1Wins ? "text-green-400" : "text-pc-text"}`}>
            {props.team1Score}
          </div>
        </div>
        <div className="text-pc-text-muted text-lg">vs</div>
        <div className={`flex-1 text-center py-2 rounded-lg ${props.team2Wins ? "bg-green-500/10 border border-green-500/30" : "bg-pc-bg-secondary"}`}>
          <div className="text-sm text-pc-text-secondary">TF 2</div>
          <div className={`text-2xl font-bold ${props.team2Wins ? "text-green-400" : "text-pc-text"}`}>
            {props.team2Score}
          </div>
        </div>
      </div>
    </div>
  );
}

function BansSection({ bans }: { bans: MatchBan[] }) {
  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-pc-text mb-3">Bans</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {bans.map((ban, i) => {
          const label = ban.champion_name || `Champion #${ban.champion_id}`;
          const content = (
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-2 text-red-300">
              <MaterialIcon
                src={getChampionIconSafe(ban.champion_name)}
                alt={label}
                className="h-9 w-9 shrink-0 rounded border border-red-500/20 bg-pc-bg-secondary"
              />
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-red-300/70">
                  Ban {ban.ban_slot ?? i + 1}
                </div>
                <div className="truncate text-xs font-medium">{label}</div>
              </div>
            </div>
          );
          return ban.champion_name ? (
            <Link key={`${ban.ban_slot ?? i}-${ban.champion_id}`} href={`/champions/${championSlug(ban.champion_name)}`}>
              {content}
            </Link>
          ) : (
            <div key={`${ban.ban_slot ?? i}-${ban.champion_id}`}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}

function TeamColumn({
  players,
  factMap,
  wins,
  label,
}: {
  players: MatchPlayerDetail[];
  factMap: Map<number, MatchFactPlayer>;
  wins: boolean;
  label: string;
}) {
  return (
    <div className={`rounded-xl border ${wins ? "border-green-500/30 bg-green-500/5" : "border-pc-border bg-pc-bg-elevated"}`}>
      <div className={`px-4 py-3 border-b ${wins ? "border-green-500/20 bg-green-500/10" : "border-pc-border bg-pc-bg-secondary"}`}>
        <h3 className="font-semibold text-pc-text">{label}</h3>
        {wins && <span className="text-xs text-green-400">Winner</span>}
      </div>
      <div className="divide-y divide-pc-border">
        {players.map((p) => (
          <PlayerRow key={p.player_id} player={p} fact={factMap.get(Number(p.player_id))} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ player, fact }: { player: MatchPlayerDetail; fact?: MatchFactPlayer }) {
  const isWinner = player.win_status === "Winner";
  const championHref = player.champion_name ? `/champions/${championSlug(player.champion_name)}` : undefined;
  const totalDamage = statNumber(player.damage_done_physical) + statNumber(player.damage_done_magical);
  const weaponDamage = statNumber(player.damage_done_in_hand);
  // Recovered matches can be reconstructed from player history / recovery
  // endpoints that do not include `Damage_Done_In_Hand`. In that case total
  // damage is still useful for DPM and rankings, but the weapon-vs-ability
  // split is unknown. Treat missing recovered weapon data as unavailable
  // instead of showing a misleading 0 weapon / full ability breakdown.
  const hasWeaponBreakdown = player.source !== "recovered" || weaponDamage > 0 || totalDamage === 0;
  const nonWeaponDamage = hasWeaponBreakdown ? Math.max(totalDamage - weaponDamage, 0) : null;
  const weaponShare = hasWeaponBreakdown && totalDamage > 0 ? `${fixed((weaponDamage / totalDamage) * 100, 0)}%` : "—";

  const coreStats = [
    { label: "K/D/A", value: `${num(player.kills)} / ${num(player.deaths)} / ${num(player.assists)}` },
    { label: "KDA", value: fixed(player.kda, 2) },
    { label: "DPM", value: fixed(player.damage_per_minute, 0) },
    { label: "HPM", value: fixed(player.healing_per_minute, 0) },
    { label: "SHPM", value: fixed(player.healing_self_per_minute, 0) },
    { label: "GPM", value: fixed(player.gold_per_minute, 0) },
    { label: "eGPM", value: fixed(player.egpm, 0) },
    { label: "MPM", value: fixed(player.mitigation_per_minute, 0) },
  ];

  const detailStats = [
    // `damage_done_physical` is the historical DB column name, but for Paladins
    // match details it stores Hi-Rez `Damage_Player`, which is already total
    // player damage. `damage_done_in_hand` is weapon-only damage and is a
    // subset of that total. Show weapon and ability/other damage as breakdown
    // metrics, but keep total damage/DPM sourced from `Damage_Player`.
    { label: "Damage", value: num(totalDamage) },
    { label: "Weapon", value: hasWeaponBreakdown ? num(weaponDamage) : "—" },
    { label: "Ability", value: nonWeaponDamage == null ? "—" : num(nonWeaponDamage) },
    { label: "Weapon %", value: weaponShare },
    { label: "Healing", value: num(player.healing) },
    { label: "Self Heal", value: num(player.healing_self) },
    { label: "Taken", value: num(player.damage_taken) },
    { label: "Mitigated", value: num(player.damage_mitigated) },
    { label: "Gold", value: num(player.gold_earned) },
    { label: "Objective", value: num(player.objective_assists) },
    { label: "Spree", value: num(player.killing_spree) },
    { label: "Multi", value: num(player.multi_kill_max) },
    { label: "Tier", value: player.league_tier ?? "—" },
    { label: "Source", value: player.source ?? "—" },
    { label: "AFK", value: num(player.afk_rate) },
  ];

  return (
    <div className={`px-4 py-4 hover:bg-pc-bg-secondary transition-colors ${isWinner ? "bg-green-500/5" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${isWinner ? "bg-green-400" : "bg-red-400"}`} />
          <MaterialIcon
            src={getChampionIconSafe(player.champion_name)}
            alt={player.champion_name || "Champion"}
            className="h-12 w-12 rounded-md border border-pc-border bg-pc-bg-secondary"
          />
          <div className="min-w-0">
            <Link
              href={`/players/${player.player_id}`}
              className="block truncate font-medium text-pc-text hover:text-pc-accent transition-colors"
            >
              {player.player_name || "PRIVATEACCOUNT"}
            </Link>
            {championHref ? (
              <Link href={championHref} className="text-sm text-pc-text-secondary hover:text-pc-accent">
                {player.champion_name}
              </Link>
            ) : (
              <span className="text-sm text-pc-text-secondary">Champion #{player.champion_id}</span>
            )}
            {player.skin_name && <div className="truncate text-xs text-pc-text-muted">{player.skin_name}</div>}
          </div>
        </div>
        <div className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${isWinner ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {player.win_status || (isWinner ? "Winner" : "Defeat")}
        </div>
      </div>

      <MetricGrid metrics={coreStats} compact />
      <MetricGrid metrics={detailStats} />

      <div className="mt-3 space-y-3">
        <TalentStrip talents={fact?.talents ?? []} />
        <ItemStrip items={fact?.items ?? []} />
        <CardStrip cards={fact?.cards ?? []} />
      </div>
    </div>
  );
}

function TalentStrip({ talents }: { talents: MatchFactPlayer["talents"] }) {
  if (talents.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {talents.map((talent) => (
        <MaterialPill
          key={talent.talent_id}
          label={talent.talent_name || "Unknown Talent"}
          src={talent.icon_url}
          fallbackSrc={talent.fallback_icon_url}
          accent="amber"
        />
      ))}
    </div>
  );
}

function ItemStrip({ items }: { items: MatchFactPlayer["items"] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-pc-text-muted">Items</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => {
          const itemLevel = formatItemDisplayLevel(item.item_level);
          return (
            <MaterialTile
              key={`${item.slot}-${item.item_id}`}
              label={item.item_name || `Item #${item.item_id}`}
              detail={itemLevel ? `Level ${itemLevel} · Slot ${item.slot ?? "—"}` : `Slot ${item.slot ?? "—"}`}
              badge={itemLevel ? `Lv ${itemLevel}` : undefined}
              src={item.icon_url}
              fallbackSrc={item.fallback_icon_url}
              title={item.description || undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function CardStrip({ cards }: { cards: MatchFactPlayer["cards"] }) {
  if (cards.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-pc-text-muted">Loadout Cards</div>
      <div className="grid grid-cols-5 gap-2">
        {cards.map((card) => {
          const cardLevel = formatCardDisplayLevel(card.card_level);
          return (
            <MaterialTile
              key={card.card_id}
              label={card.card_name || `Card #${card.card_id}`}
              detail={cardLevel ? `Level ${cardLevel}` : undefined}
              badge={cardLevel ? `Lv ${cardLevel}` : undefined}
              src={card.icon_url}
              fallbackSrc={card.fallback_icon_url}
            />
          );
        })}
      </div>
    </div>
  );
}

function formatItemDisplayLevel(level?: number | null): number | null {
  if (level == null || !Number.isFinite(Number(level))) return null;
  // Hi-Rez active item levels are persisted zero-based in match_player_items
  // after normalization: 0, 1, 2 represent in-game item levels 1, 2, 3.
  // Keep the DB value unchanged for analytics, but show the player-facing
  // level on the match page so purchased items are not displayed as "Lv 0".
  return Number(level) + 1;
}

function formatCardDisplayLevel(level?: number | null): number | null {
  if (level == null || !Number.isFinite(Number(level))) return null;
  return Number(level);
}

function MetricGrid({ metrics, compact = false }: { metrics: Array<{ label: string; value: string }>; compact?: boolean }) {
  return (
    <div className={`grid gap-1.5 ${compact ? "grid-cols-4 mb-2" : "grid-cols-3 sm:grid-cols-4"}`}>
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded bg-pc-bg-secondary/70 px-2 py-1">
          <div className="text-xs uppercase tracking-wide text-pc-text-muted">{metric.label}</div>
          <div className="truncate text-xs font-medium text-pc-text-secondary">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}

function MaterialPill(props: {
  label: string;
  detail?: string;
  src?: string | null;
  fallbackSrc?: string | null;
  accent: "amber" | "red";
}) {
  const colors = props.accent === "amber"
    ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
    : "border-red-500/25 bg-red-500/10 text-red-300";
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-md border px-2 py-1 ${colors}`}>
      <MaterialIcon src={props.src} fallbackSrc={props.fallbackSrc} alt={props.label} className="h-8 w-8 rounded" />
      <div className="min-w-0">
        <div className="truncate text-xs font-medium">{props.label}</div>
        {props.detail && <div className="truncate text-xs opacity-75">{props.detail}</div>}
      </div>
    </div>
  );
}

function MaterialTile(props: {
  label: string;
  detail?: string;
  badge?: string;
  src?: string | null;
  fallbackSrc?: string | null;
  title?: string;
}) {
  return (
    <div className="relative min-w-0 rounded-md border border-pc-border bg-pc-bg-secondary p-1" title={props.title || props.label}>
      <div className="relative">
        {props.badge && (
          <span className="absolute right-1 top-1 z-10 rounded border border-pc-accent/40 bg-black/80 px-1.5 py-0.5 text-xs font-semibold leading-none text-pc-accent shadow">
            {props.badge}
          </span>
        )}
        <MaterialIcon src={props.src} fallbackSrc={props.fallbackSrc} alt={props.label} className="aspect-square w-full rounded bg-pc-bg-elevated" />
      </div>
      <div className="mt-1 flex min-w-0 items-center justify-between gap-1">
        <div className="truncate text-xs font-medium text-pc-text-secondary">{props.label}</div>
        {props.badge && <div className="shrink-0 text-xs font-semibold text-pc-accent">{props.badge}</div>}
      </div>
      {props.detail && <div className="truncate text-xs text-pc-text-muted">{props.detail}</div>}
    </div>
  );
}

function MaterialIcon({ src, fallbackSrc, alt, className }: { src?: string | null; fallbackSrc?: string | null; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src, fallbackSrc]);
  const imageSrc = failed ? fallbackSrc : src;
  if (!imageSrc) {
    return (
      <div className={`flex items-center justify-center text-xs text-pc-text-muted ${className}`}>
        #
      </div>
    );
  }
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function SnapshotsSection({ snapshots }: { snapshots: RatingSnapshot[] }) {
  const formatRating = (value: number | null) => value == null ? "—" : value.toFixed(2);
  const formatChange = (value: number | null) => {
    if (value == null) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  };

  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-pc-text mb-4">Rating Changes (Glicko-2)</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pc-border text-pc-text-secondary text-left">
              <th className="pb-2 pr-4">Player</th>
              <th className="pb-2 pr-4">μ Before</th>
              <th className="pb-2 pr-4">μ After</th>
              <th className="pb-2 pr-4">Δμ</th>
              <th className="pb-2 pr-4">φ Before</th>
              <th className="pb-2">φ After</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.player_id} className="border-b border-pc-border/50 hover:bg-pc-bg-secondary transition-colors">
                <td className="py-2 pr-4 font-medium text-pc-text">{s.player_name}</td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.mu_before)}</td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.mu_after)}</td>
                <td className={`py-2 pr-4 font-semibold ${s.mu_change == null ? "text-pc-text-secondary" : s.mu_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatChange(s.mu_change)}
                </td>
                <td className="py-2 pr-4 text-pc-text-secondary">{formatRating(s.phi_before)}</td>
                <td className="py-2 text-pc-text-secondary">{formatRating(s.phi_after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RelatedMatches({ related, matchId, loading }: { related: MatchSearchResult[]; matchId: number; loading: boolean }) {
  if (loading) return null;
  if (related.length === 0) return null;

  return (
    <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-pc-text mb-4">Related Matches</h2>
      <div className="space-y-2">
        {related.map((m, i) => (
          <Link
            key={`${m.match_id}-${i}`}
            href={`/matches/${m.match_id}`}
            className="flex items-center justify-between p-3 rounded-lg bg-pc-bg-secondary hover:bg-pc-bg-elevated border border-transparent hover:border-pc-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${m.win_status === "Winner" ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-pc-text font-medium">Match #{m.match_id}</span>
              <span className="text-pc-text-secondary text-sm">{m.champion_name}</span>
            </div>
            <div className="text-sm text-pc-text-muted">
              {m.kills}/{m.deaths}/{m.assists} · {formatDuration(m.duration_seconds)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Helpers ── */

function buildMaterialReferenceMap(
  items: any[],
  talents: any[],
  cards: any[],
  staticMaterials: any[],
  staticCardMaterials: any[],
  staticTalentMaterials: any[],
): Map<number, MaterialReference> {
  const map = new Map<number, MaterialReference>();
  const put = (candidate: MaterialReference) => {
    if (!Number.isFinite(candidate.id) || candidate.id <= 0 || !candidate.name) return;
    const existing = map.get(candidate.id);
    map.set(candidate.id, {
      ...existing,
      ...candidate,
      description: candidate.description || existing?.description || null,
      shortDescription: candidate.shortDescription || existing?.shortDescription || null,
      iconUrl: candidate.iconUrl || existing?.iconUrl || null,
      championId: candidate.championId ?? existing?.championId ?? null,
      championName: candidate.championName ?? existing?.championName ?? null,
      itemType: candidate.itemType || existing?.itemType || null,
    });
  };

  // The live DB reference endpoints may be sparse after recovery ingest, while
  // the local Hi-Rez get-items snapshot carries the canonical names and remote
  // image URLs for champion cards, active items, and talents. Load the static
  // snapshot first, then let DB rows override it when the DB has fresher data.
  for (const row of staticMaterials || []) {
    put({
      id: Number(row.id ?? row.ItemId),
      name: String(row.name ?? row.DeviceName ?? "").trim(),
      description: row.description ?? row.Description ?? null,
      shortDescription: row.shortDescription ?? row.ShortDesc ?? null,
      championId: row.championId == null ? Number(row.champion_id ?? 0) : Number(row.championId),
      itemType: row.itemType ?? row.item_type ?? null,
      iconUrl: row.iconUrl ?? row.itemIcon_URL ?? null,
    });
  }

  // Generated local card references close the gap between recovered match
  // payloads and sparse reference tables. The generator combines the checked-in
  // item snapshot, local champion-page card names, observed DB card ids, and
  // local card image files, so match rendering remains DB/local-first and never
  // burns a Hi-Rez call just to label a loadout card.
  for (const row of staticCardMaterials || []) {
    put({
      id: Number(row.id ?? row.card_id),
      name: String(row.name ?? row.card_name ?? "").trim(),
      description: row.description ?? null,
      shortDescription: row.shortDescription ?? null,
      championId: row.championId == null ? Number(row.champion_id ?? 0) : Number(row.championId),
      itemType: row.itemType ?? "Champion Card",
      iconUrl: row.iconUrl ?? row.icon_url ?? null,
    });
  }

  // Talents have the same local-reference problem as cards, but with extra
  // renamed-talent edge cases. For example Seris "Resuscitate" intentionally
  // reuses the old Soul Collector asset, so a blind
  // /images/champions/Talent Seris Resuscitate.avif guess will always 404.
  // The generated reference knows these aliases and exact local filenames.
  for (const row of staticTalentMaterials || []) {
    put({
      id: Number(row.id ?? row.talent_id),
      name: String(row.name ?? row.talent_name ?? "").trim(),
      description: row.description ?? null,
      shortDescription: row.shortDescription ?? null,
      championId: row.championId == null ? Number(row.champion_id ?? 0) : Number(row.championId),
      championName: row.championName ?? row.champion_name ?? null,
      itemType: row.itemType ?? "Talent",
      iconUrl: row.iconUrl ?? row.icon_url ?? null,
    });
  }

  for (const row of items || []) {
    put({
      id: Number(row.item_id ?? row.id),
      name: String(row.item_name ?? row.name ?? "").trim(),
      description: row.description ?? null,
      championId: row.champion_id == null ? null : Number(row.champion_id),
      itemType: row.item_type ?? null,
      iconUrl: row.icon_url ?? null,
    });
  }

  for (const row of cards || []) {
    put({
      id: Number(row.card_id ?? row.id),
      name: String(row.card_name ?? row.name ?? "").trim(),
      championId: row.champion_id == null ? null : Number(row.champion_id),
      itemType: "Champion Card",
    });
  }

  for (const row of talents || []) {
    put({
      id: Number(row.talent_id ?? row.id),
      name: String(row.talent_name ?? row.name ?? "").trim(),
      championId: row.champion_id == null ? null : Number(row.champion_id),
      itemType: "Talent",
    });
  }

  return map;
}

function resolveFactPlayerMaterials(
  player: MatchFactPlayer,
  materialById: Map<number, MaterialReference>,
  championNameById: Map<number, string>,
): MatchFactPlayer {
  return {
    ...player,
    items: player.items
      .slice()
      .sort((a, b) => Number(a.slot ?? 0) - Number(b.slot ?? 0))
      .map((item) => {
      const ref = materialById.get(Number(item.item_id));
      const name = item.item_name || ref?.name || null;
      return {
        ...item,
        item_name: name,
        description: item.description || ref?.description || ref?.shortDescription || null,
        item_type: item.item_type || ref?.itemType || null,
        icon_url: item.icon_url || itemIconPath(name) || ref?.iconUrl || null,
        fallback_icon_url: item.fallback_icon_url || itemFallbackIconPath(name) || ref?.iconUrl || null,
      };
    }),
    cards: player.cards
      .slice()
      .sort((a, b) => Number(a.card_id ?? 0) - Number(b.card_id ?? 0))
      .map((card) => {
      const ref = materialById.get(Number(card.card_id));
      const name = card.card_name || ref?.name || null;
      const localIcon = cardIconPath(name);
      const localFallbackIcon = cardFallbackIconPath(name);
      return {
        ...card,
        card_name: name,
        champion_id: card.champion_id ?? ref?.championId ?? null,
        // Card art is shipped with the frontend as name-based local files. The
        // backend and older DB rows can still carry stale space-form paths such
        // as "/images/cards/Card Survival.avif", which Next will 404 because
        // the actual asset is "Card_Survival.avif". Prefer the canonical local
        // path from the generated mapper first because it knows local aliases
        // like Blade Dancer -> Card_Blade_Dance.avif. Then try the canonical
        // name-derived local path, and only use incoming URLs as a last resort
        // for truly unknown cards.
        icon_url: ref?.iconUrl || localIcon || card.icon_url || null,
        fallback_icon_url: ref?.iconUrl || localFallbackIcon || card.fallback_icon_url || null,
      };
    }),
    talents: player.talents.map((talent) => {
      const ref = materialById.get(Number(talent.talent_id));
      const name = talent.talent_name || ref?.name || null;
      const championId = talent.champion_id ?? ref?.championId ?? player.champion_id ?? null;
      const championName = talent.champion_name || ref?.championName || (championId ? championNameById.get(Number(championId)) : null) || player.champion_name || null;
      const externalIconUrl = isExternalUrl(talent.icon_url) ? talent.icon_url : null;
      const externalFallbackIconUrl = isExternalUrl(talent.fallback_icon_url) ? talent.fallback_icon_url : null;
      return {
        ...talent,
        talent_name: name,
        champion_id: championId,
        champion_name: championName,
        // Never emit guessed local talent URLs here. If a generated reference
        // cannot resolve a local/remote icon, render the placeholder instead of
        // making the browser request a path that may not exist.
        icon_url: ref?.iconUrl || externalIconUrl || null,
        fallback_icon_url: ref?.iconUrl || externalFallbackIconUrl || null,
      };
    }),
  };
}

function assetSegment(name: string | null | undefined): string | null {
  const trimmed = String(name || "").trim();
  return trimmed ? trimmed.replace(/[^\w\s'-]/g, "").replace(/\s+/g, "_") : null;
}

function itemIconPath(name: string | null | undefined): string | null {
  const segment = assetSegment(name);
  return segment ? `/images/items/${segment}_Icon.avif` : null;
}

function itemFallbackIconPath(name: string | null | undefined): string | null {
  const segment = assetSegment(name);
  return segment ? `/images/items/${segment}_Icon.png` : null;
}

function cardIconPath(name: string | null | undefined): string | null {
  const segment = assetSegment(name);
  return segment ? `/images/cards/Card_${segment}.avif` : null;
}

function cardFallbackIconPath(name: string | null | undefined): string | null {
  const segment = assetSegment(name);
  return segment ? `/images/cards/Card_${segment}.png` : null;
}

function isExternalUrl(value: string | null | undefined): boolean {
  return /^https?:\/\//i.test(String(value || ""));
}

function queueName(id: number): string {
  const map: Record<number, string> = {
    486: "Ranked 10v10",
    487: "Casual 10v10",
    488: "Custom Game",
    489: "Tournament",
  };
  return map[id] || `Queue ${id}`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function num(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? Math.round(parsed).toLocaleString() : "—";
}

function statNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function fixed(value: number | string | null | undefined, digits: number): string {
  if (value == null) return "—";
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "—";
}
