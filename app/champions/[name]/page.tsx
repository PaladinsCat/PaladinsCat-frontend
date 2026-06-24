"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import ScrambleText from "@/components/ScrambleText";
import SmartImage from "@/components/SmartImage";
import { championSlug } from "@/lib/utils";
import { getStatQuality } from "@/lib/stat-quality";
import {
  getChampionData,
  type ChampionData,
  type ChampionSkill,
  type ChampionTalent,
  type ChampionLoadout,
} from "@/lib/champion-data";
import {
  fetchChampionLeaderboard,
  fetchChampionTalentStats,
  fetchChampionCardStats,
  fetchPerformanceMetrics,
  fetchChampionPerformanceDistributions,
  type ChampionLeaderboardEntry,
  type ChampionTalentStatsResponse,
  type ChampionCardStatsResponse,
  type ChampionTalentStat,
  type ChampionCardStat,
  type PerformanceMetricsResponse,
  type PerformanceMetricKey,
  type PerformanceMetricSummary,
  type ChampionPerformanceDistribution,
} from "@/lib/api-client";
import { getRankIconPath, getTierColor, resolveEffectiveTier } from "@/lib/tier-utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const RANKED_QUEUE_ID = 486;
const CHAMPION_METRICS: Array<{ key: PerformanceMetricKey; label: string; colorClass: string; accent: string }> = [
  { key: "dpm", label: "Damage / Min", colorClass: "text-red-400", accent: "#f87171" },
  { key: "gpm", label: "Credits / Min", colorClass: "text-yellow-400", accent: "#facc15" },
  { key: "hpm", label: "Healing / Min", colorClass: "text-emerald-400", accent: "#34d399" },
  { key: "mpm", label: "Mitigation / Min", colorClass: "text-blue-400", accent: "#60a5fa" },
  { key: "kda", label: "KDA", colorClass: "text-violet-400", accent: "#a78bfa" },
];

interface ChampionStats {
  avgRating: number | null;
  avgWinRate: number | null;
  totalPlays: number | null;
  totalMatches: number | null;
  totalWins: number | null;
}

interface LeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  mu: number;
  phi: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
}

// Tier/trend types from existing API
interface TierStat {
  tier: string;
  winRate: number;
  pickRate: number;
  totalPlays: number;
}

interface PatchTrend {
  trendWeek: string;
  weeklyWinRate: number;
  weeklyPlays: number;
}

const ROLE_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

function statNameKey(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function AvgTierCard({ stats }: { stats: ChampionStats }) {
  if (stats.avgRating == null) {
    return (
      <div className="pc-surface-light rounded-lg p-4 border border-pc-border text-center">
        <div className="text-xs text-pc-text-muted mb-1">Avg Tier</div>
        <div className="text-lg font-mono text-pc-text">—</div>
      </div>
    );
  }
  const tier = Math.round(stats.avgRating);
  const effective = resolveEffectiveTier(tier, 0);
  const iconPath = getRankIconPath(tier, 0);
  const color = getTierColor(effective.displayTier);

  return (
    <div className="pc-surface-light rounded-lg p-4 border border-pc-border text-center">
      <div className="text-xs text-pc-text-muted mb-2">Avg Tier</div>
      <img src={iconPath} alt={effective.displayName} className="w-12 h-12 object-contain mx-auto" />
      <div className={`text-xs font-semibold ${color} mt-1`}>{effective.displayName}</div>
      <div className="text-xs font-mono text-pc-text-muted mt-0.5">{stats.avgRating.toFixed(1)}</div>
    </div>
  );
}

export default function ChampionDetailPage() {
  const params = useParams();
  const rawName = params?.name;
  const name = Array.isArray(rawName) ? rawName[0] ?? "" : rawName ?? "";

  const [championData, setChampionData] = useState<ChampionData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stats, setStats] = useState<ChampionStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [talentStats, setTalentStats] = useState<ChampionTalentStatsResponse | null>(null);
  const [cardStats, setCardStats] = useState<ChampionCardStatsResponse | null>(null);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [globalPerformance, setGlobalPerformance] = useState<PerformanceMetricsResponse>({});
  const [championPerformance, setChampionPerformance] = useState<Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>>({});
  const [tierStats, setTierStats] = useState<TierStat[]>([]);
  const [patchTrends, setPatchTrends] = useState<PatchTrend[]>([]);
  const [loading, setLoading] = useState(true);

  // Static champion reference metadata lets direct /champions/[name] routes
  // resolve icons/roles before DB-backed stats load. It must never provide
  // synthetic match, leaderboard, or performance numbers.
  const staticChampion = STATIC_CHAMPIONS.find(
    (c) => championSlug(c.name) === name.toLowerCase()
  );

  useEffect(() => {
    setSelectedTalentId(null);
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    setDataLoaded(false);
    getChampionData(name)
      .then((data) => {
        if (cancelled) return;
        setChampionData(data ? { ...data, roles: data.roles.length > 0 ? data.roles : staticChampion?.roles ?? [] } : null);
      })
      .catch(() => {
        if (!cancelled) setChampionData(null);
      })
      .finally(() => {
        if (!cancelled) setDataLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [staticChampion?.roles, name]);

  useEffect(() => {
    if (!championData) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Resolve champion ID, then fetch stats + leaderboard in parallel
    fetch(`${API_BASE}/champions`)
      .then((r) => r.json())
      .then((champs: Array<{ id: number; name: string }>) => {
        const match = champs.find((c) => c.name.toLowerCase() === championData!.name.toLowerCase());
        if (!match) return;

        return Promise.all([
          // Champion aggregate stats from /champions/:id
          fetch(`${API_BASE}/champions/${match.id}`)
            .then((r) => r.json())
            .then((data: { stats?: Record<string, unknown> | null }) => {
              const s = data.stats;
              if (!s) return null;
              return {
                // This page's "Avg Rating" is the ranked player tier average
                // for the champion, not the Glicko/ELO μ used by the player
                // leaderboard below. The backend exposes it from
                // champion_stats_ranked.sum_league_tier / total_matches, which
                // is maintained during ingest and rebuilt by the projection
                // tracker, so the detail page does not need to aggregate over
                // match_players on every request.
                avgRating: s.avg_league_tier != null ? Number(s.avg_league_tier) : null,
                avgWinRate: s.win_rate != null ? Number(s.win_rate) : null,
                totalPlays: s.total_matches != null ? Number(s.total_matches) : null,
                totalMatches: s.total_matches != null ? Number(s.total_matches) : null,
                totalWins: s.wins != null ? Number(s.wins) : null,
              } as ChampionStats;
            })
            .catch(() => null as ChampionStats | null),
          // Per-champion leaderboard from player_champion_ratings
          fetchChampionLeaderboard(match.id, 25).catch(() => [] as ChampionLeaderboardEntry[]),
          // Talent stats for this champion
          fetchChampionTalentStats(match.id).catch(() => null as ChampionTalentStatsResponse | null),
          // Card stats for this champion
          fetchChampionCardStats(match.id, 'ranked', selectedTalentId).catch(() => null as ChampionCardStatsResponse | null),
          // Global ranked distributions plus champion-specific distributions
          // use the same metric contract as /stats/dpm, /stats/gpm, etc. This
          // keeps the champion page from comparing raw damage/gold totals across
          // matches of different lengths.
          fetchPerformanceMetrics({ queueId: RANKED_QUEUE_ID }).catch(() => ({} as PerformanceMetricsResponse)),
          Promise.all(
            CHAMPION_METRICS.map(({ key }) =>
              fetchChampionPerformanceDistributions({ metric: key, championId: match.id, queueId: RANKED_QUEUE_ID })
                .then((rows) => [key, rows[0] ?? null] as const)
                .catch(() => [key, null] as const)
            )
          ),
        ]);
      })
      .then((result) => {
        if (!result) return;
        const [statsData, lbData, talentData, cardData, globalMetrics, championMetricPairs] = result;
        if (statsData) setStats(statsData);
        setLeaderboard(lbData);
        if (talentData) setTalentStats(talentData);
        if (cardData) setCardStats(cardData);
        setGlobalPerformance(globalMetrics ?? {});
        setChampionPerformance(
          Object.fromEntries(championMetricPairs.filter(([, row]) => row != null)) as Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>
        );
      })
      .finally(() => setLoading(false));
  }, [championData, selectedTalentId]);


  const talentStatsByName = useMemo(() => {
    return new Map((talentStats?.talents ?? []).map((stat) => [statNameKey(stat.talentName), stat]));
  }, [talentStats]);

  const cardStatsByName = useMemo(() => {
    return new Map((cardStats?.cards ?? []).map((stat) => [statNameKey(stat.cardName), stat]));
  }, [cardStats]);
  const selectedTalentStat = useMemo(() => {
    if (selectedTalentId == null) return null;
    return (talentStats?.talents ?? []).find((talent) => talent.talentId === selectedTalentId) ?? null;
  }, [selectedTalentId, talentStats]);
  const maxTalentPickRate = useMemo(() => {
    const total = talentStats?.totalMatches ?? 0;
    if (total <= 0) return 100;
    return Math.max(1, ...(talentStats?.talents ?? []).map((stat) => (stat.totalPlays / total) * 100));
  }, [talentStats]);
  const maxCardPickRate = useMemo(() => {
    const total = cardStats?.totalMatches ?? 0;
    if (total <= 0) return 100;
    return Math.max(1, ...(cardStats?.cards ?? []).map((stat) => (stat.totalPlays / total) * 100));
  }, [cardStats]);
  const maxTierPickRate = useMemo(() => Math.max(1, ...tierStats.map((tier) => tier.pickRate)), [tierStats]);
  const maxTrendPlays = useMemo(() => Math.max(1, ...patchTrends.map((trend) => trend.weeklyPlays)), [patchTrends]);
  if (dataLoaded && !championData && !staticChampion) return notFound();

  const formatNum = (n: number | null) => (n != null ? n.toLocaleString() : "—");
  const formatPct = (n: number | null) => (n != null ? `${n.toFixed(1)}%` : "—");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/champions" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          ← Back to champions
        </Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">
          <ScrambleText text={championData?.name ?? staticChampion?.name ?? name} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
      </div>

      {/* Two-column: Champion Profile (left) + Talents & Cards (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column — Champion Profile + Skills (~1/4) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="pc-card">
            <div className="flex flex-col items-center text-center gap-4">
              <SmartImage
                src={getChampionIconSafe(championData?.name ?? staticChampion?.name ?? name)}
                alt={championData?.name ?? staticChampion?.name ?? name}
                className="w-28 h-28 rounded-xl border border-pc-border object-contain bg-pc-bg/50"
              />
              <div className="flex flex-wrap justify-center gap-2">
                {(championData?.roles ?? staticChampion?.roles ?? []).map((role) => (
                  <span key={role} className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-full bg-pc-accent/10 text-pc-accent border border-pc-accent/20">
                    {ROLE_ICONS[role] && <SmartImage src={ROLE_ICONS[role]} alt={role} className="w-3.5 h-3.5" />}
                    {role}
                  </span>
                ))}
              </div>
              {championData?.stats && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full">
                  <StatBadge label="Health" value={championData.stats.health} />
                  <StatBadge label="Speed" value={`${championData.stats.speed}`} />
                  <StatBadge label="Range" value={championData.stats.range} />
                  <StatBadge label="Speed Units" value={championData.stats.speedUnits} />
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {championData?.skills && championData.skills.length > 0 && (
            <>
              <h2 className="pc-card-title mb-2 shadow-sm">Skills</h2>
              <div className="pc-card">
              <div className="space-y-3">
                {championData.skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
              </div>
            </>
          )}
        </div>

        {/* Right column — Talents & Loadout Cards (~3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Talents */}
          {championData?.talents && championData.talents.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="pc-card-title shadow-sm">Talents</h2>
                {selectedTalentId != null && (
                  <button
                    type="button"
                    onClick={() => setSelectedTalentId(null)}
                    className="text-xs px-3 py-1 rounded-lg border border-pc-border text-pc-text-secondary hover:text-pc-accent hover:border-pc-accent-mid transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="pc-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {championData.talents.map((talent) => {
                  const stat: ChampionTalentStat | undefined = talentStatsByName.get(statNameKey(talent.name));
                  return (
                    <TalentCard
                      key={talent.name}
                      talent={talent}
                      championName={championData.name}
                      stat={stat ?? undefined}
                      totalMatches={talentStats?.totalMatches ?? 0}
                      maxPickRate={maxTalentPickRate}
                      selected={stat?.talentId === selectedTalentId}
                      onSelect={stat ? () => setSelectedTalentId(stat.talentId) : undefined}
                    />
                  );
                })}
              </div>
              </div>
            </>
          )}

          {/* Loadout Cards */}
          {championData?.loadouts && championData.loadouts.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="pc-card-title shadow-sm">Loadout Cards</h2>
                {selectedTalentStat && (
                  <div className="text-xs text-pc-text-secondary">
                    Filtered by <span className="text-pc-accent font-medium">{selectedTalentStat.talentName}</span> · {cardStats?.totalMatches ?? 0} plays
                  </div>
                )}
              </div>
              <div className="pc-card">
              {(() => {
                const byCategory: Record<string, ChampionLoadout[]> = {};
                championData.loadouts.forEach((l) => {
                  const key = l.category || "General";
                  if (!byCategory[key]) byCategory[key] = [];
                  byCategory[key].push(l);
                });
                return Object.entries(byCategory).map(([cat, cards]) => (
                  <div key={cat} className="mb-6 last:mb-0">
                    <div className="text-xs font-medium text-pc-text-muted uppercase tracking-wider mb-2">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cards.map((card) => {
                        const stat: ChampionCardStat | undefined = cardStatsByName.get(statNameKey(card.name));
                        const cardHref = stat ? `/champions/${name}/cards/${stat.cardId}${selectedTalentId ? `?talentId=${selectedTalentId}` : ""}` : null;
                        const pickRate = stat && cardStats?.totalMatches ? (stat.totalPlays / cardStats.totalMatches) * 100 : 0;
                        const quality = stat ? getStatQuality(stat.winRate, pickRate, maxCardPickRate) : null;
                        return (
                          <div
                            key={card.name}
                            className="pc-surface-light rounded-lg p-3 border transition-colors"
                            style={quality ? { borderColor: quality.borderColor, background: quality.background } : undefined}
                          >
                            <div className="flex items-start gap-3">
                              {card.iconUrl ? (
                                cardHref ? (
                                  <Link href={cardHref} className="flex-shrink-0">
                                    <SmartImage src={card.iconUrl} alt={card.name} className="w-12 h-10 rounded border border-pc-border bg-pc-bg/50 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                  </Link>
                                ) : (
                                  <SmartImage src={card.iconUrl} alt={card.name} className="flex-shrink-0 w-12 h-10 rounded border border-pc-border bg-pc-bg/50 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                )
                              ) : (
                                <div className="flex-shrink-0 w-10 h-10 rounded border border-pc-border bg-pc-bg-elevated flex items-center justify-center">
                                  <span className="text-xs text-pc-accent">?</span>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                {cardHref ? (
                                  <Link href={cardHref} className="text-xs font-medium text-pc-accent hover:text-pc-accent-light transition-colors mb-0.5 inline-block">{card.name}</Link>
                                ) : (
                                  <div className="text-xs font-medium text-pc-accent mb-0.5">{card.name}</div>
                                )}
                                <p className="text-xs text-pc-text-secondary leading-relaxed">{card.description}</p>
                                {stat && stat.totalPlays > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className={quality?.textClass ?? winRateColor(stat.winRate)} style={quality ? { color: quality.color } : undefined}>
                                        <span className="text-pc-text-muted mr-1">WR</span>
                                        {stat.winRate.toFixed(1)}%
                                      </span>
                                      <span className="text-pc-border">|</span>
                                      <span className="text-pc-text-muted">
                                        <span className="mr-1">PR</span>
                                        <span style={quality ? { color: quality.color } : undefined}>{pickRate.toFixed(1)}%</span>
                                      </span>
                                      <span className="text-pc-border">|</span>
                                      <span className="text-pc-text-muted whitespace-nowrap">
                                        <span className="mr-1">Picks</span>
                                        <span style={quality ? { color: quality.color } : undefined}>{formatPlays(stat.totalPlays)}</span>
                                      </span>
                                      <span className="text-pc-border">|</span>
                                      <span className="text-pc-text-muted whitespace-nowrap">{stat.wins.toLocaleString()}W/{stat.losses.toLocaleString()}L</span>
                                    </div>
                                    {stat.levels.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        {(() => {
                                          const maxLevelPlays = Math.max(1, ...stat.levels.map((level) => level.plays));
                                          const maxLevelPickRate = Math.max(1, ...stat.levels.map((level) => (level.plays / Math.max(1, stat.totalPlays)) * 100));
                                          return stat.levels.map((l) => {
                                            const levelPickRate = (l.plays / Math.max(1, stat.totalPlays)) * 100;
                                            const levelQuality = getStatQuality(l.winRate, levelPickRate, maxLevelPickRate);
                                            return (
                                              <div key={l.level} className="flex-1 flex flex-col items-center">
                                                <div className="text-[9px] text-pc-text-muted">L{l.level}</div>
                                                <div className="w-full h-1.5 rounded-full bg-pc-bg-elevated overflow-hidden">
                                                  <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                      width: `${Math.max(l.plays > 0 ? 8 : 0, Math.round((l.plays / maxLevelPlays) * 100))}%`,
                                                      background: levelQuality.track,
                                                    }}
                                                  />
                                                </div>
                                                <div className="text-[9px] text-pc-text-muted">{l.plays}</div>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Ranked performance summary */}
      <h2 className="pc-card-title mb-2 shadow-sm">Ranked Performance</h2>
      <div className="pc-card space-y-5">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AvgTierCard stats={stats} />
            <StatCard label="Win Rate" value={formatPct(stats.avgWinRate)} accent />
            <StatCard label="Plays" value={formatNum(stats.totalPlays)} />
            <StatCard label="Wins" value={formatNum(stats.totalWins)} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {CHAMPION_METRICS.map((metric) => (
            <ChampionMetricCard
              key={metric.key}
              metric={metric}
              champion={championPerformance[metric.key]}
              global={globalPerformance[metric.key]}
            />
          ))}
        </div>
      </div>

      {/* Glicko-2 Leaderboard */}
      <h2 className="pc-card-title mb-2 shadow-sm">
        Global ELO Leaderboard — {championData?.name ?? staticChampion?.name ?? name}
      </h2>
      <div className="pc-card">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-pc-text-muted">No leaderboard data available yet.</p>
            <p className="text-pc-text-muted text-sm mt-1">Player ratings will appear once the database is populated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="pc-table w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Rating (μ)</th>
                  <th>Matches</th>
                  <th>W/L</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => {
                  const wr = entry.matchesPlayed > 0 ? (entry.wins / entry.matchesPlayed) * 100 : 0;
                  return (
                    <tr key={entry.playerId}>
                      <td className="text-pc-text-muted font-mono text-sm">{entry.rank}</td>
                      <td>
                        <Link
                          href={`/players/${entry.playerId}`}
                          className="text-pc-text hover:text-pc-accent transition-colors text-sm font-medium"
                        >
                          {entry.playerName}
                        </Link>
                      </td>
                      <td className="text-pc-accent font-mono text-sm font-semibold">{Number(entry.mu).toFixed(0)}</td>
                      <td className="text-pc-text-muted text-sm">{entry.matchesPlayed}</td>
                      <td className="font-mono text-sm">
                        <span className="text-emerald-400">{entry.wins}</span>
                        <span className="text-pc-text-muted">/</span>
                        <span className="text-rose-400">{entry.losses}</span>
                        <span className="text-pc-text-muted ml-1 text-xs">({wr.toFixed(0)}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tier Performance */}
      {tierStats.length > 0 && (
        <div className="pc-card">
          <h2 className="pc-card-title mb-4">Performance by Tier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tierStats.map((t) => {
              const quality = getStatQuality(t.winRate, t.pickRate, maxTierPickRate);
              return (
                <div
                  key={t.tier}
                  className="pc-surface-light rounded-lg p-4 border transition-colors"
                  style={{ borderColor: quality.borderColor, background: quality.background }}
                >
                  <div className="text-sm font-medium text-pc-accent mb-2">{t.tier}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-pc-text-muted">WR</div>
                      <div className={`text-sm font-mono ${quality.textClass}`} style={{ color: quality.color }}>
                        {t.winRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-pc-text-muted">PR</div>
                      <div className="text-sm font-mono" style={{ color: quality.color }}>{t.pickRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-pc-text-muted">Plays</div>
                      <div className="text-sm font-mono text-pc-text">{t.totalPlays.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Win Rate Trends */}
      {patchTrends.length > 0 && (
        <div className="pc-card">
          <h2 className="pc-card-title mb-4">Win Rate Trends</h2>
          <div className="overflow-x-auto">
            <table className="pc-table w-full">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Win Rate</th>
                  <th>Plays</th>
                </tr>
              </thead>
              <tbody>
                {patchTrends.map((t) => {
                  const quality = getStatQuality(t.weeklyWinRate, t.weeklyPlays, maxTrendPlays);
                  return (
                    <tr key={t.trendWeek}>
                      <td className="text-pc-text text-sm">{t.trendWeek}</td>
                      <td className={`font-mono text-sm ${quality.textClass}`} style={{ color: quality.color }}>
                        {t.weeklyWinRate.toFixed(1)}%
                      </td>
                      <td className="text-pc-text-muted text-sm">{t.weeklyPlays.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="pc-surface-light rounded-lg p-4 border border-pc-border text-center">
      <div className="text-xs text-pc-text-muted mb-1">{label}</div>
      <div className={`text-lg font-mono ${accent ? "text-pc-accent" : "text-pc-text"}`}>{value}</div>
    </div>
  );
}

function ChampionMetricCard({
  metric,
  champion,
  global,
}: {
  metric: (typeof CHAMPION_METRICS)[number];
  champion?: ChampionPerformanceDistribution;
  global?: PerformanceMetricSummary;
}) {
  const isDecimal = metric.key === "kda";
  const formatMetric = (value: number | null | undefined) => {
    const numeric = Number(value ?? 0);
    return isDecimal ? numeric.toFixed(1) : Math.round(numeric).toLocaleString();
  };
  const championMean = champion?.avgValue ?? champion?.mean ?? 0;
  const globalMean = global?.mean ?? 0;
  const delta = championMean - globalMean;
  const deltaPct = globalMean !== 0 ? (delta / globalMean) * 100 : 0;
  const p10 = champion?.p10 && champion.p10 > 0 ? champion.p10 : champion?.min ?? 0;
  const p90 = champion?.p90 && champion.p90 > 0 ? champion.p90 : champion?.max ?? 0;
  const rangeMax = Math.max(p90, championMean, globalMean, 1);
  const meanPct = Math.max(0, Math.min(100, (championMean / rangeMax) * 100));
  const globalPct = Math.max(0, Math.min(100, (globalMean / rangeMax) * 100));
  const deltaClass = delta >= 0 ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="pc-surface-light rounded-lg border border-pc-border p-3 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-xs text-pc-text-muted uppercase tracking-wider">{metric.label}</div>
          <div className={`text-xl font-bold ${metric.colorClass}`}>{formatMetric(championMean)}</div>
        </div>
        <div className="text-right text-[10px] text-pc-text-muted shrink-0">
          <div>Matches</div>
          <div className="text-pc-text-secondary font-mono">{(champion?.totalMatches ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] mb-3">
        <div>
          <div className="text-pc-text-muted uppercase tracking-wider">P10</div>
          <div className="text-pc-text-secondary font-mono">{formatMetric(p10)}</div>
        </div>
        <div>
          <div className="text-pc-text-muted uppercase tracking-wider">Mode</div>
          <div className="text-pc-text-secondary font-mono">{formatMetric(champion?.mode ?? 0)}</div>
        </div>
        <div>
          <div className="text-pc-text-muted uppercase tracking-wider">P90</div>
          <div className="text-pc-text-secondary font-mono">{formatMetric(p90)}</div>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-pc-bg overflow-hidden mb-2">
        <div className="absolute inset-y-0 left-0 rounded-full opacity-60" style={{ width: `${meanPct}%`, backgroundColor: metric.accent }} />
        <div className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-pc-text-muted" style={{ left: `${globalPct}%` }} />
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="text-pc-text-muted">Global {formatMetric(globalMean)}</span>
        <span className={deltaClass}>{formatSignedMetric(delta, isDecimal)} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

function formatSignedMetric(value: number, decimal: boolean): string {
  const sign = value >= 0 ? "+" : "";
  const formatted = decimal ? value.toFixed(1) : Math.round(value).toLocaleString();
  return `${sign}${formatted}`;
}
function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-pc-text-muted">{label}</div>
      <div className="text-sm font-mono text-pc-text">{value}</div>
    </div>
  );
}

function SkillCard({ skill }: { skill: ChampionSkill }) {
  const icons = [skill.iconUrl, skill.iconUrl2, skill.iconUrl3].filter(Boolean) as string[];
  const [activeIdx, setActiveIdx] = useState(0);

  // Cycle through available icons every 2.5s
  useEffect(() => {
    if (icons.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % icons.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [icons.length]);

  const activeIcon = icons[activeIdx] || "";

  return (
    <div className="pc-surface-light rounded-lg p-4 border border-pc-border flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pc-bg-elevated border border-pc-border flex items-center justify-center overflow-hidden">
        {activeIcon ? (
          <SmartImage
            src={activeIcon}
            alt={skill.name}
            className="w-full h-full object-contain transition-opacity duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span className="text-xs font-mono text-pc-accent">{skill.key}</span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-pc-text">{skill.name}</span>
          {skill.damage && (
            <span className="text-xs font-mono text-pc-text-muted">DMG: {skill.damage}</span>
          )}
          {skill.cooldown && (
            <span className="text-xs font-mono text-pc-text-muted">CD: {skill.cooldown}</span>
          )}
        </div>
        {skill.description && (
          <p className="text-xs text-pc-text-secondary leading-relaxed">{skill.description}</p>
        )}
      </div>
    </div>
  );
}

function TalentCard({
  talent,
  championName,
  stat,
  totalMatches,
  maxPickRate,
  selected,
  onSelect,
}: {
  talent: ChampionTalent;
  championName: string;
  stat?: ChampionTalentStat;
  totalMatches?: number;
  maxPickRate?: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const talentImageUrl = talent.iconUrl || `/images/champions/Talent ${championName} ${talent.name}.png`;
  const pickRate = stat && totalMatches && totalMatches > 0 ? (stat.totalPlays / totalMatches) * 100 : 0;
  const quality = stat ? getStatQuality(stat.winRate, pickRate, maxPickRate ?? 100) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      className={`pc-surface-light rounded-lg p-3 border flex items-start gap-3 transition-colors text-left w-full ${selected ? "ring-1 ring-pc-accent border-pc-accent-mid" : ""} ${onSelect ? "cursor-pointer hover:border-pc-accent-mid" : "cursor-default"}`}
      style={quality ? { borderColor: selected ? quality.color : quality.borderColor, background: quality.background } : undefined}
    >
      <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center overflow-hidden">
        <SmartImage
          src={talentImageUrl}
          alt={talent.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-pc-accent mb-0.5">{talent.name}</div>
        {talent.description && (
          <p className="text-xs text-pc-text-secondary leading-relaxed">{talent.description}</p>
        )}
        {talent.category && (
          <div className="text-xs text-pc-text-muted mt-1">Linked: {talent.category}</div>
        )}
        {stat && stat.totalPlays > 0 && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className={quality?.textClass ?? winRateColor(stat.winRate)} style={quality ? { color: quality.color } : undefined}>
              <span className="text-pc-text-muted mr-1">WR</span>
              {stat.winRate.toFixed(1)}%
            </span>
            <span className="text-pc-border">|</span>
            <span className="text-pc-text-muted">
              <span className="mr-1">PR</span>
              <span style={quality ? { color: quality.color } : undefined}>{pickRate.toFixed(1)}%</span>
            </span>
            <span className="text-pc-border">|</span>
            <span className="text-pc-text-muted whitespace-nowrap">
              <span className="mr-1">Matches</span>
              <span style={quality ? { color: quality.color } : undefined}>{formatPlays(stat.totalPlays)}</span>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function winRateColor(wr: number): string {
  if (wr >= 55) return "text-emerald-400";
  if (wr >= 50) return "text-pc-text";
  if (wr >= 45) return "text-amber-400";
  return "text-rose-400";
}

