"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import ScrambleText from "@/components/ScrambleText";
import { LoadingPanel } from "@/components/async-state";
import SmartImage from "@/components/SmartImage";
import { championSlug } from "@/lib/utils";
import { getStatQuality } from "@/lib/stat-quality";
import { mapImagePath } from "@/lib/map-images";
import {
  getChampionData,
  getTalentIconPath,
  type ChampionData,
  type ChampionSkill,
  type ChampionTalent,
} from "@/lib/champion-data";
import { getCanonicalTalentImageUrl } from "@/lib/image-assets";
import {
  type ChampionTalentStatsResponse,
  type ChampionTalentStat,
  type ItemStat,
  type PerformanceMetricsResponse,
  type PerformanceMetricKey,
  type PerformanceMetricSummary,
  type ChampionPerformanceDistribution,
  type ChampionMapStat,
} from "@/lib/api-client";
import { getRankIconPath, getTierColor, resolveEffectiveTier } from "@/lib/tier-utils";
import { withStoredLobbyTier } from "@/lib/lobby-tier";

// Keep this client request on the Next proxy instead of /api. Embedded
// browsers can block /api fetches outright, which otherwise makes a healthy
// cached bundle look like empty champion metrics.
const CHAMPION_DATA_BASE = "/_pc";
const CHAMPION_METRICS: Array<{ key: PerformanceMetricKey; label: string; colorClass: string; accent: string }> = [
  { key: "dpm", label: "Damage / Min", colorClass: "text-red-400", accent: "#f87171" },
  { key: "gpm", label: "Credits / Min", colorClass: "text-yellow-400", accent: "#facc15" },
  { key: "hpm", label: "Healing / Min", colorClass: "text-emerald-400", accent: "#34d399" },
  { key: "mpm", label: "Shielding / Min", colorClass: "text-blue-400", accent: "#60a5fa" },
  { key: "kda", label: "KDA", colorClass: "text-violet-400", accent: "#a78bfa" },
];

const ITEM_CATEGORY_BY_NAME: Record<string, string> = {
  "Blast Shields": "Defense", Guardian: "Defense", Haven: "Defense", Illuminate: "Defense", Resilience: "Defense", Sentinel: "Defense",
  Chronos: "Utility", Hoard: "Utility", "Master Riding": "Utility", "Morale Boost": "Utility", Nimble: "Utility",
  Bloodbath: "Healing", "Kill to Heal": "Healing", "Life Rip": "Healing", Meditation: "Healing", Rejuvenate: "Healing", Veteran: "Healing",
  Bulldozer: "Offense", "Deft Hands": "Offense", Lethality: "Offense", "Trigger Scent": "Offense", Wrecker: "Offense",
};

const ITEM_CATEGORIES = ["Defense", "Utility", "Healing", "Offense"] as const;

function itemIcon(name: string) {
  return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`;
}

function itemCategoryColor(category: string) {
  return category === "Offense" ? "text-red-400" : category === "Defense" ? "text-blue-400" : category === "Healing" ? "text-emerald-400" : "text-amber-400";
}

interface ChampionStats {
  avgRating: number | null;
  avgWinRate: number | null;
  totalPlays: number | null;
  totalMatches: number | null;
  totalWins: number | null;
}

type ChampionPagePayload = {
  stats: Record<string, unknown> | null;
  talentStats: ChampionTalentStatsResponse | null;
  items: ItemStat[];
  maps: ChampionMapStat[];
  performance: PerformanceMetricsResponse;
  championPerformance: Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>;
};

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
      <div className="pc-surface-light rounded-lg border border-pc-border p-3 text-center">
        <div className="text-xs text-pc-text-muted mb-1">Avg Tier</div>
        <div className="font-mono text-base text-pc-text">—</div>
      </div>
    );
  }
  const tier = Math.round(stats.avgRating);
  const effective = resolveEffectiveTier(tier, 0);
  const iconPath = getRankIconPath(tier, 0);
  const color = getTierColor(effective.displayTier);

  return (
    <div className="pc-surface-light rounded-lg border border-pc-border p-3 text-center">
      <div className="mb-1 text-xs text-pc-text-muted">Avg Tier</div>
      <img src={iconPath} alt={effective.displayName} className="mx-auto h-9 w-9 object-contain" />
      <div className={`mt-0.5 text-[11px] font-semibold ${color}`}>{effective.displayName}</div>
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
  const [talentStats, setTalentStats] = useState<ChampionTalentStatsResponse | null>(null);
  const [championItems, setChampionItems] = useState<ItemStat[]>([]);
  const [championMaps, setChampionMaps] = useState<ChampionMapStat[]>([]);
  const [globalPerformance, setGlobalPerformance] = useState<PerformanceMetricsResponse>({});
  const [championPerformance, setChampionPerformance] = useState<Partial<Record<PerformanceMetricKey, ChampionPerformanceDistribution>>>({});
  const [tierStats, setTierStats] = useState<TierStat[]>([]);
  const [patchTrends, setPatchTrends] = useState<PatchTrend[]>([]);
  const [loading, setLoading] = useState(true);

  // Static champion reference metadata lets direct /champions/[name] routes
  // resolve icons/roles before DB-backed stats load. It must never provide
  // synthetic match or performance numbers.
  const staticChampion = STATIC_CHAMPIONS.find(
    (c) => championSlug(c.name) === name.toLowerCase()
  );

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
    const championId = staticChampion?.id;
    if (!championId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setChampionItems([]);
    setChampionMaps([]);

    // One server-cached bundle replaces the old fan-out of ten browser calls.
    // A warm entry is served from Redis immediately while the backend refreshes
    // it in the background after its TTL.
    fetch(`${CHAMPION_DATA_BASE}${withStoredLobbyTier(`/champions/${championId}/page-data`)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Champion page data unavailable');
        return response.json() as Promise<ChampionPagePayload>;
      })
      .then((data) => {
        const s = data.stats;
        setStats(s ? {
          avgRating: s.avg_league_tier != null ? Number(s.avg_league_tier) : null,
          avgWinRate: s.win_rate != null ? Number(s.win_rate) : null,
          totalPlays: s.total_matches != null ? Number(s.total_matches) : null,
          totalMatches: s.total_matches != null ? Number(s.total_matches) : null,
          totalWins: s.wins != null ? Number(s.wins) : null,
        } : null);
        setTalentStats(data.talentStats);
        setChampionItems(data.items);
        setChampionMaps(data.maps);
        setGlobalPerformance(data.performance);
        setChampionPerformance(data.championPerformance);
      })
      .catch(() => {
        setStats(null);
        setTalentStats(null);
        setChampionItems([]);
        setChampionMaps([]);
        setGlobalPerformance({});
        setChampionPerformance({});
      })
      .finally(() => setLoading(false));
  }, [championData, staticChampion?.id]);


  const talentStatsByName = useMemo(() => {
    return new Map((talentStats?.talents ?? []).map((stat) => [statNameKey(stat.talentName), stat]));
  }, [talentStats]);

  const maxTalentPickRate = useMemo(() => {
    const total = talentStats?.totalMatches ?? 0;
    if (total <= 0) return 100;
    return Math.max(1, ...(talentStats?.talents ?? []).map((stat) => (stat.totalPlays / total) * 100));
  }, [talentStats]);
  const maxTierPickRate = useMemo(() => Math.max(1, ...tierStats.map((tier) => tier.pickRate)), [tierStats]);
  const maxTrendPlays = useMemo(() => Math.max(1, ...patchTrends.map((trend) => trend.weeklyPlays)), [patchTrends]);
  const maxMapPickRate = useMemo(() => Math.max(1, ...championMaps.map((map) => map.pickRate)), [championMaps]);
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

      {/* Two-column: Champion Profile (left) + talent summaries (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column — Champion Profile + Skills (~1/4) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="pc-card">
            <div className="flex flex-col items-center text-center gap-4">
              <SmartImage
                src={getChampionIconSafe(championData?.name ?? staticChampion?.name ?? name)}
                alt={championData?.name ?? staticChampion?.name ?? name}
                width={112}
                height={112}
                fetchPriority="high"
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

        {/* Right column — talent summaries (~3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {loading && (
            <LoadingPanel compact className="pc-card" />
          )}
          {/* Compact ranked summary leads the analysis column. */}
          <section className="space-y-2">
            <h2 className="pc-card-title shadow-sm">Ranked Performance</h2>
            <div className="pc-card space-y-3 p-4">
              {stats && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <AvgTierCard stats={stats} />
                  <StatCard label="Win Rate" value={formatPct(stats.avgWinRate)} accent />
                  <StatCard label="Plays" value={formatNum(stats.totalPlays)} />
                  <StatCard label="Wins" value={formatNum(stats.totalWins)} />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
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
          </section>

          {/* Talents */}
          {championData?.talents && championData.talents.length > 0 && (
            <>
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <h2 className="pc-card-title shadow-sm">Talents</h2>
                <span className="text-xs font-medium text-pc-accent-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                  Open a talent to view its loadout cards
                </span>
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
                      href={stat ? `/champions/${name}/talents/${stat.talentId}?returnTo=${encodeURIComponent(`/champions/${name}`)}` : undefined}
                    />
                  );
                })}
              </div>
              </div>
            </>
          )}

          {/* Champion-specific ranked item purchases. */}
          <section className="space-y-2">
            <h2 className="pc-card-title shadow-sm">Item Stats</h2>
            <div className="pc-card space-y-4 p-4">
              {championItems.length === 0 ? (
                <div className="text-sm text-pc-text-muted">No ranked item statistics are available yet.</div>
              ) : (
                ITEM_CATEGORIES.map((category) => {
                  const items = championItems.filter((item) => (ITEM_CATEGORY_BY_NAME[item.itemName] ?? "Utility") === category);
                  if (items.length === 0) return null;
                  return (
                    <div key={category}>
                      <span className={`mb-2 block text-xs font-bold uppercase tracking-wider ${itemCategoryColor(category)}`}>{category}</span>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {items.map((item) => {
                          const quality = getStatQuality(item.winRate, 1, 1);
                          return (
                            <Link
                              key={item.itemId}
                              href={`/stats/items/${item.itemId}`}
                              className="group flex flex-col items-center rounded-lg border border-transparent py-1 text-center transition-colors hover:border-pc-accent-mid"
                              style={{ borderColor: quality.borderColor }}
                            >
                              <img src={itemIcon(item.itemName)} alt="" className="mb-1 h-12 w-12 rounded-md object-contain" />
                              <div className="w-full truncate text-xs font-medium leading-tight text-pc-text group-hover:text-pc-accent">{item.itemName}</div>
                              <div className="mt-0.5 flex items-center gap-1 text-[9px]">
                                <span style={{ color: quality.color }}>WR {item.winRate.toFixed(1)}%</span>
                                <span className="text-pc-text-muted">·</span>
                                <span style={{ color: quality.color }}>PR {(item.pickRate ?? 0).toFixed(1)}%</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
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
                  style={{ borderColor: quality.borderColor }}
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

      {/* Champion-relative ranked map distribution. */}
      <section className="space-y-3">
        <div>
          <h2 className="pc-card-title">Map Stats</h2>
          <p className="mt-1 text-xs text-pc-text-secondary">
            Ranked performance by map. Pick rate is each map&apos;s share of all ranked plays for this champion.
          </p>
        </div>
        {loading ? (
          <LoadingPanel />
        ) : championMaps.length === 0 ? (
          <div className="pc-card text-sm text-pc-text-muted">No ranked map statistics are available yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {championMaps.map((map) => {
              const quality = getStatQuality(map.winRate, map.pickRate, maxMapPickRate);
              return (
                <Link
                  key={map.name}
                  href={`/stats/maps/${encodeURIComponent(map.name)}`}
                  className="group overflow-hidden rounded-xl border bg-pc-bg-elevated transition-colors hover:border-pc-accent-mid"
                  style={{ borderColor: quality.borderColor }}
                >
                  <div className="relative h-36 overflow-hidden bg-pc-bg">
                    <SmartImage src={mapImagePath(map.name)} alt="" className="h-full w-full object-cover opacity-75 transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-pc-bg-elevated via-pc-bg-elevated/10 to-transparent" />
                    <h3 className="absolute bottom-3 left-4 right-4 truncate text-base font-bold text-pc-text group-hover:text-pc-accent">
                      {map.name.replace(/^Ranked\s+/, "")}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3 text-center text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-pc-text-muted">Win Rate</div>
                      <div className="font-bold" style={{ color: quality.color }}>{map.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-pc-text-muted">Pick Rate</div>
                      <div className="font-medium text-pc-accent">{map.pickRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-pc-text-muted">Plays</div>
                      <div className="font-medium text-pc-text">{map.totalPlays.toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="pc-surface-light flex min-h-20 flex-col justify-center rounded-lg border border-pc-border p-3 text-center">
      <div className="text-xs text-pc-text-muted mb-1">{label}</div>
      <div className={`font-mono text-base ${accent ? "text-pc-accent" : "text-pc-text"}`}>{value}</div>
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
    <div className="pc-surface-light min-w-0 rounded-lg border border-pc-border p-2.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-pc-text-muted uppercase tracking-wider">{metric.label}</div>
          <div className={`text-lg font-bold ${metric.colorClass}`}>{formatMetric(championMean)}</div>
        </div>
        <div className="text-right text-[10px] text-pc-text-muted shrink min-w-0 overflow-hidden">
          <div className="truncate">Matches</div>
          <div className="text-pc-text-secondary font-mono overflow-wrap break-all">{(champion?.totalMatches ?? 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-3 gap-1.5 text-[10px]">
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
  href,
}: {
  talent: ChampionTalent;
  championName: string;
  stat?: ChampionTalentStat;
  totalMatches?: number;
  maxPickRate?: number;
  href?: string;
}) {
  const talentImageUrl = getCanonicalTalentImageUrl(talent.iconUrl, championName, talent.name);
  const pickRate = stat && totalMatches && totalMatches > 0 ? (stat.totalPlays / totalMatches) * 100 : 0;
  const quality = stat ? getStatQuality(stat.winRate, pickRate, maxPickRate ?? 100) : null;

  const content = (
    <>
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
          <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
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
            <span className="text-pc-text-muted overflow-wrap break-word">
              <span className="mr-1">Matches</span>
              <span style={quality ? { color: quality.color } : undefined}>{formatPlays(stat.totalPlays)}</span>
            </span>
          </div>
        )}
      </div>
    </>
  );

  const className = `pc-surface-light flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${href ? "cursor-pointer hover:border-pc-accent-mid" : "cursor-default"}`;
  const style = quality ? { borderColor: quality.borderColor } : undefined;

  return href ? (
    <Link href={href} className={className} style={style}>
      {content}
    </Link>
  ) : (
    <div className={className} style={style}>
      {content}
    </div>
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

