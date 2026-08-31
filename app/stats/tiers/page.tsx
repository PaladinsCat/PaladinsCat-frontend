/**
 * Define the stats tiers page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchTierSummary, fetchTiers, type TierStat, type TierSummary } from "@/lib/api-client";
import { getRankIconPath, TIER_NAMES } from "@/lib/tier-utils";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";
import { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation } from "@/components/aceternity";


const EMPTY_SUMMARY: TierSummary = {
  profilePlayers: 0,
  avgProfileTier: 0,
  matchPlayerRows: 0,
  activePlayers: 0,
  rankedMatches: 0,
  avgParticipationTier: 0,
  avgMatchTier: 0,
  medianMatchTier: 0,
};

function normalizeTiers(rows: TierStat[], count: number): TierStat[] {
  return Array.from({ length: count }, (_, index) => {
    const tierSort = index + 1;
    const row = rows.find((candidate) => candidate.tierSort === tierSort);
    return row ? { ...row, tier: TIER_NAMES[tierSort] ?? row.tier } : {
      tier: TIER_NAMES[tierSort] ?? `Tier ${tierSort}`,
      tierSort,
      totalPlays: 0,
      avgWinRate: 0,
      percentage: 0,
    };
  });
}

function weightedAverage(rows: TierStat[]): number {
  const total = rows.reduce((sum, row) => sum + row.totalPlays, 0);
  if (total === 0) return 0;
  return rows.reduce((sum, row) => sum + row.tierSort * row.totalPlays, 0) / total;
}

// Compact count for tight bar labels: >=1000 renders as "1k" / "2.5k".
// Keeps the number short so labels never overlap, without expanding chart width.
function compactCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return String(value || 0);
  if (value < 1000) return String(Math.round(value));
  const k = Math.round((value / 1000) * 10) / 10;
  return `${k % 1 === 0 ? String(Math.round(k)) : k.toFixed(1)}k`;
}

function rankIconForTier(tierSort: number): string {
  return getRankIconPath(tierSort, tierSort === 26 ? 101 : tierSort === 27 ? 1 : 0);
}

function roundedTier(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(1, Math.min(27, Math.round(value)));
}

function TierValue({
  tier,
  className = "",
}: {
  tier: number;
  className?: string;
}) {
  const { t , formatNumber} = useLocalization();
  const tierSort = roundedTier(tier);
  if (tierSort === 0) {
    return <span className={`tabular-nums ${className}`}>0</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 tabular-nums ${className}`}>
      <img
        src={rankIconForTier(tierSort)}
        alt={t("generated.stats.tierValue1", { value1: tierSort })}
        className="h-6 w-6 object-contain"
        loading="lazy"
      />
      <span>{formatNumber(tier, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </span>
  );
}

function DistributionChart({
  title,
  rows,
  label,
}: {
  title: string;
  rows: TierStat[];
  label: string;
}) {
  const { t , formatNumber, formatPercent} = useLocalization();
  const total = rows.reduce((sum, row) => sum + row.totalPlays, 0);
  const max = Math.max(1, ...rows.map((row) => row.totalPlays));

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-lg font-bold text-pc-text">{title}</h2>
        <span className="text-xs text-pc-text-secondary tabular-nums">
          {formatNumber(total)} {label}
        </span>
      </div>
      <div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-3 sm:p-4">
        <div className="flex items-end justify-center gap-1.5 h-80 overflow-x-auto pb-2">
          {rows.map((row) => {
            const height = Math.max(2, Math.round((row.totalPlays / max) * 308));
            const share = total > 0 ? (row.totalPlays / total) * 100 : 0;
            return (
              <div
                key={row.tierSort}
                className="flex flex-col items-center justify-end gap-1 min-w-6 h-full group"
              >
                <div className="text-xs text-pc-text-muted tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatPercent(share)}
                </div>
                <div
                  className="w-3 rounded-t-sm bg-pc-accent-mid group-hover:bg-pc-accent transition-colors"
                  style={{ height }}
                  title={t("generated.stats.value1Value2Value3", { value1: row.tier, value2: formatNumber(row.totalPlays), value3: formatNumber(share, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                />
                <img
                  src={rankIconForTier(row.tierSort)}
                  alt={row.tier}
                  title={row.tier}
                  className="h-5 w-5 object-contain drop-shadow"
                  loading="lazy"
                />
                <div
                  className="text-xs text-pc-text-secondary tabular-nums leading-none whitespace-nowrap px-0.5"
                  title={t("generated.stats.value1Value2Value3", { value1: row.tier, value2: formatNumber(row.totalPlays), value3: formatNumber(share, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                >
                  {row.totalPlays > 0 ? compactCount(row.totalPlays) : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Renders the exported statistics view with its route data.
 * Returns the declared route value; network, cache, and navigation effects follow the implementation.
 */
export default function TiersPage() {
  const { t , formatNumber} = useLocalization();
  const [profileTiers, setProfileTiers] = useState<TierStat[]>([]);
  const [matchTiers, setMatchTiers] = useState<TierStat[]>([]);
  const [summary, setSummary] = useState<TierSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    Promise.all([
      fetchTiers({ source: "profiles" }),
      fetchTiers({ source: "matches" }),
      fetchTierSummary(),
    ])
      .then(([profiles, matches, nextSummary]) => {
        setProfileTiers(profiles);
        setMatchTiers(matches);
        setSummary(nextSummary);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const normalizedProfiles = useMemo(() => normalizeTiers(profileTiers, 27), [profileTiers]);
  // Match facts only carry Hi-Rez League_Tier values through tier 26. They
  // cannot distinguish the live top-100 Grandmaster subset, so tier 26 is the
  // combined Master/Grandmaster activity bucket and no synthetic tier 27 is
  // rendered here.
  const normalizedMatches = useMemo(() => normalizeTiers(matchTiers, 26), [matchTiers]);
  const profileAvg = summary.avgProfileTier || weightedAverage(normalizedProfiles);
  const activeAvg = summary.avgParticipationTier || weightedAverage(normalizedMatches);
  const cards: Array<
    | { label: string; kind: "count"; value: number; suffix: string }
    | { label: string; kind: "tier"; value: number }
  > = [
    { label: t("generated.stats.playerProfiles"), kind: "count", value: summary.profilePlayers, suffix: "players" },
    { label: t("generated.stats.profileAvgTier"), kind: "tier", value: profileAvg },
    { label: t("generated.stats.activeAvgTier"), kind: "tier", value: activeAvg },
    { label: t("generated.stats.avgMatchTier"), kind: "tier", value: summary.avgMatchTier },
    { label: t("generated.stats.medianMatchTier"), kind: "tier", value: summary.medianMatchTier },
    { label: t("generated.stats.rankedMatches.0b47f50"), kind: "count", value: summary.rankedMatches, suffix: "matches" },
    { label: t("generated.stats.matchPlayerRows"), kind: "count", value: summary.matchPlayerRows, suffix: "rows" },
    { label: t("generated.stats.activePlayers"), kind: "count", value: summary.activePlayers, suffix: "players" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.tierDistribution")}</h1>
      </div>

      {displayLoading ? (
        <RouteSkeleton variant="dashboard" />
      ) : error ? (
        <ErrorState message={error} />
      ) : profileTiers.length === 0 && matchTiers.length === 0 ? (
        <EmptyState title={t("generated.stats.noTierStatistics")} description={t("generated.stats.tierDistributionsWillAppearAfterRankedProfilesAndMatchesAre")} />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((item) => (
              <div key={item.label} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-3">
                <div className="text-xs text-pc-text-muted">{item.label}</div>
                <div className="mt-1 text-xl font-semibold text-pc-text">
                  {item.kind === "tier" ? (
                    <TierValue tier={item.value} />
                  ) : (
                    <span className="tabular-nums">{formatNumber(item.value)}</span>
                  )}
                </div>
                {item.kind === "count" ? <div className="text-xs text-pc-text-secondary">{item.suffix}</div> : null}
              </div>
            ))}
          </section>

          <DistributionChart
            title={t("generated.stats.playerProfileDistribution")}
            rows={normalizedProfiles}
            label={t("generated.stats.players")}
          />

          <DistributionChart
            title={t("generated.stats.activeRankedMatchDistribution")}
            rows={normalizedMatches}
            label={t("generated.stats.playerRows")}
          />
        </>
      )}
    </div>
  );
}
