"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTierSummary, fetchTiers, type TierStat, type TierSummary } from "@/lib/api-client";
import { getRankIconPath, TIER_NAMES } from "@/lib/tier-utils";

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
    return rows.find((row) => row.tierSort === tierSort) ?? {
      tier: tierSort === 27 ? "Grandmaster" : `Tier ${tierSort}`,
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

function rankIconForTier(tierSort: number): string {
  return getRankIconPath(tierSort, tierSort === 26 ? 101 : tierSort === 27 ? 1 : 0);
}

function tierNameForSort(tierSort: number): string {
  return TIER_NAMES[tierSort] ?? (tierSort === 27 ? "Grandmaster" : `Tier ${tierSort}`);
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
  const tierSort = roundedTier(tier);
  if (tierSort === 0) {
    return <span className={`tabular-nums ${className}`}>0</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2 tabular-nums ${className}`}>
      <img
        src={rankIconForTier(tierSort)}
        alt={tierNameForSort(tierSort)}
        className="h-6 w-6 object-contain"
        loading="lazy"
      />
      <span>{tier.toFixed(2)}</span>
    </span>
  );
}

function DistributionTable({
  title,
  rows,
  label,
}: {
  title: string;
  rows: TierStat[];
  label: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.totalPlays, 0);
  const max = Math.max(1, ...rows.map((row) => row.totalPlays));

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4 px-2">
        <h2 className="text-lg font-bold text-pc-text">{title}</h2>
        <span className="text-xs text-pc-text-secondary tabular-nums">
          {total.toLocaleString()} {label}
        </span>
      </div>
      <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-pc-bg">
            <tr>
              <th className="px-4 py-3 text-pc-accent font-semibold text-xs">Tier</th>
              <th className="px-4 py-3 text-pc-accent font-semibold text-xs text-right">{label}</th>
              <th className="px-4 py-3 text-pc-accent font-semibold text-xs text-right">Share</th>
              <th className="px-4 py-3 text-pc-accent font-semibold text-xs">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const share = total > 0 ? (row.totalPlays / total) * 100 : 0;
              return (
                <tr key={row.tierSort} className="border-t border-pc-border">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={rankIconForTier(row.tierSort)}
                        alt={row.tier}
                        className="h-6 w-6 object-contain"
                        loading="lazy"
                      />
                      <span className="text-pc-text text-sm font-semibold">{tierNameForSort(row.tierSort)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-pc-text text-sm text-right tabular-nums">
                    {row.totalPlays.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-pc-text-secondary text-sm text-right tabular-nums">
                    {share.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 min-w-36">
                    <div className="h-2 rounded-full bg-pc-bg">
                      <div
                        className="h-2 rounded-full bg-pc-accent-mid"
                        style={{ width: row.totalPlays > 0 ? `${Math.max(2, (row.totalPlays / max) * 100)}%` : 0 }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function TiersPage() {
  const [profileTiers, setProfileTiers] = useState<TierStat[]>([]);
  const [matchTiers, setMatchTiers] = useState<TierStat[]>([]);
  const [summary, setSummary] = useState<TierSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const normalizedMatches = useMemo(() => normalizeTiers(matchTiers, 26), [matchTiers]);
  const profileAvg = summary.avgProfileTier || weightedAverage(normalizedProfiles);
  const activeAvg = summary.avgParticipationTier || weightedAverage(normalizedMatches);
  const cards: Array<
    | { label: string; kind: "count"; value: number; suffix: string }
    | { label: string; kind: "tier"; value: number }
  > = [
    { label: "Player profiles", kind: "count", value: summary.profilePlayers, suffix: "players" },
    { label: "Profile avg tier", kind: "tier", value: profileAvg },
    { label: "Active avg tier", kind: "tier", value: activeAvg },
    { label: "Avg match tier", kind: "tier", value: summary.avgMatchTier },
    { label: "Median match tier", kind: "tier", value: summary.medianMatchTier },
    { label: "Ranked matches", kind: "count", value: summary.rankedMatches, suffix: "matches" },
    { label: "Match-player rows", kind: "count", value: summary.matchPlayerRows, suffix: "rows" },
    { label: "Active players", kind: "count", value: summary.activePlayers, suffix: "players" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Tier Distribution</h1>
      </div>

      {loading ? (
        <div className="text-center py-8 text-pc-text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-pc-text-muted">{error}</div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((item) => (
              <div key={item.label} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4">
                <div className="text-xs text-pc-text-muted">{item.label}</div>
                <div className="mt-1 text-xl font-semibold text-pc-text">
                  {item.kind === "tier" ? (
                    <TierValue tier={item.value} />
                  ) : (
                    <span className="tabular-nums">{item.value.toLocaleString()}</span>
                  )}
                </div>
                {item.kind === "count" ? <div className="text-[10px] text-pc-text-secondary">{item.suffix}</div> : null}
              </div>
            ))}
          </section>

          <DistributionTable
            title="Player Profile Distribution"
            rows={normalizedProfiles}
            label="players"
          />

          <DistributionTable
            title="Active Ranked Match Distribution"
            rows={normalizedMatches}
            label="player rows"
          />
        </>
      )}
    </div>
  );
}
