"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { STATIC_CHAMPIONS } from "@/lib/mock-data";
import { getChampionIconSafe } from "@/lib/champion-icons";
import ScrambleText from "@/components/ScrambleText";
import { championSlug } from "@/lib/utils";
import {
  getChampionData,
  type ChampionData,
  type ChampionSkill,
  type ChampionTalent,
  type ChampionLoadout,
} from "@/lib/champion-data";

// Placeholder types for future DB integration
interface ChampionStats {
  avgMu: number | null;
  avgPhi: number | null;
  avgWinRate: number | null;
  totalPlays: number | null;
  totalMatches: number | null;
  totalWins: number | null;
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  avgDamage: number | null;
  avgGold: number | null;
}

interface LeaderboardEntry {
  rank: number;
  playerId: number;
  playerName: string;
  avatarUrl: string | null;
  mu: number;
  phi: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
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

export default function ChampionDetailPage() {
  const params = useParams();
  const name = params?.name as string;

  const [stats, setStats] = useState<ChampionStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tierStats, setTierStats] = useState<TierStat[]>([]);
  const [patchTrends, setPatchTrends] = useState<PatchTrend[]>([]);
  const [loading, setLoading] = useState(true);

  // Find champion by slug
  const championData = getChampionData(name);
  const mockChampion = STATIC_CHAMPIONS.find(
    (c) => championSlug(c.name) === name.toLowerCase()
  );

  useEffect(() => {
    if (!championData) return;

    // TODO: Replace with real DB calls when ready
    Promise.all([
      Promise.resolve({
        avgMu: null,
        avgPhi: null,
        avgWinRate: null,
        totalPlays: null,
        totalMatches: null,
        totalWins: null,
        avgKills: null,
        avgDeaths: null,
        avgAssists: null,
        avgDamage: null,
        avgGold: null,
      }),
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([]),
    ])
      .then(([statsData, lbData, tierData, trendData]) => {
        setStats(statsData);
        setLeaderboard(lbData);
        setTierStats(tierData);
        setPatchTrends(trendData);
      })
      .finally(() => setLoading(false));
  }, [championData]);

  if (!championData && !mockChampion) return notFound();

  const formatNum = (n: number | null) => (n != null ? n.toLocaleString() : "—");
  const formatPct = (n: number | null) => (n != null ? `${n.toFixed(1)}%` : "—");
  const formatFloat = (n: number | null) => (n != null ? n.toFixed(1) : "—");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/champions" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          ← Back to champions
        </Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">
          <ScrambleText text={championData?.name ?? mockChampion?.name ?? name} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
      </div>

      {/* Champion Profile Card */}
      <div className="pc-card">
        <div className="flex items-start gap-6">
          <img
            src={getChampionIconSafe(championData?.name ?? mockChampion?.name ?? name)}
            alt={championData?.name ?? mockChampion?.name ?? name}
            className="w-24 h-24 rounded-xl border border-pc-border object-contain bg-pc-bg/50"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(championData?.roles ?? mockChampion?.roles ?? []).map((role) => (
                <span key={role} className="text-xs flex items-center gap-1.5 px-3 py-1 rounded-full bg-pc-accent/10 text-pc-accent border border-pc-accent/20">
                  {ROLE_ICONS[role] && <img src={ROLE_ICONS[role]} alt={role} className="w-3.5 h-3.5" />}
                  {role}
                </span>
              ))}
              {/* Cost placeholder — add to STATIC_CHAMPIONS when available */}
            </div>
            {championData?.stats && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                <StatBadge label="Health" value={championData.stats.health} />
                <StatBadge label="Speed" value={`${championData.stats.speed}`} />
                <StatBadge label="Range" value={championData.stats.range} />
                <StatBadge label="Speed Units" value={championData.stats.speedUnits} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills */}
      {championData?.skills && championData.skills.length > 0 && (
        <div className="pc-card">
          <h2 className="pc-card-title mb-4">Skills</h2>
          <div className="space-y-4">
            {championData.skills.map((skill) => (
              <SkillCard key={skill.name} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* Talents */}
      {championData?.talents && championData.talents.length > 0 && (
        <div className="pc-card">
          <h2 className="pc-card-title mb-4">Talents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {championData.talents.map((talent) => (
              <TalentCard key={talent.name} talent={talent} championName={championData.name} />
            ))}
          </div>
        </div>
      )}

      {/* Loadout Types (placeholder for DB) */}
      <div className="pc-card">
        <h2 className="pc-card-title mb-4">Loadout Types</h2>
        <div className="text-center py-8">
          <p className="text-pc-text-muted">Loadout data will be populated from the database.</p>
          <p className="text-pc-text-muted text-sm mt-1">Pick rates, win rates, and level stats coming soon.</p>
        </div>
      </div>

      {/* Average Player Stats */}
      <div className="pc-card">
        <h2 className="pc-card-title mb-4">Average Player Stats</h2>
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard label="Avg Rating" value={formatFloat(stats.avgMu)} accent />
            <StatCard label="Avg Deviation" value={formatFloat(stats.avgPhi)} />
            <StatCard label="Avg Win Rate" value={formatPct(stats.avgWinRate)} />
            <StatCard label="Total Plays" value={formatNum(stats.totalPlays)} />
            <StatCard label="Total Matches" value={formatNum(stats.totalMatches)} />
            <StatCard label="Total Wins" value={formatNum(stats.totalWins)} />
            <StatCard label="Avg Kills" value={formatFloat(stats.avgKills)} />
            <StatCard label="Avg Deaths" value={formatFloat(stats.avgDeaths)} />
            <StatCard label="Avg Assists" value={formatFloat(stats.avgAssists)} />
            <StatCard label="Avg Damage" value={formatNum(stats.avgDamage)} />
            <StatCard label="Avg Gold" value={formatNum(stats.avgGold)} />
          </div>
        )}
      </div>

      {/* Glicko-2 Leaderboard */}
      <div className="pc-card">
        <h2 className="pc-card-title mb-4">
          Global ELO Leaderboard — {championData?.name ?? mockChampion?.name ?? name}
        </h2>
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
                  <th>Deviation (φ)</th>
                  <th>Matches</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.playerId}>
                    <td className="text-pc-text-muted font-mono text-sm">{entry.rank}</td>
                    <td>
                      <Link
                        href={`/players/${entry.playerId}`}
                        className="flex items-center gap-2 text-pc-text hover:text-pc-accent transition-colors"
                      >
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt="" className="w-6 h-6 rounded" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-pc-bg-elevated flex items-center justify-center text-xs text-pc-accent">
                            {entry.playerName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium">{entry.playerName}</span>
                      </Link>
                    </td>
                    <td className="text-pc-text font-mono text-sm">{entry.mu.toFixed(2)}</td>
                    <td className="text-pc-text-muted font-mono text-sm">{entry.phi.toFixed(2)}</td>
                    <td className="text-pc-text-muted text-sm">{entry.matchesPlayed.toLocaleString()}</td>
                    <td className={`font-mono text-sm ${entry.winRate >= 55 ? "text-emerald-400" : entry.winRate <= 45 ? "text-rose-400" : "text-pc-text"}`}>
                      {entry.winRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
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
            {tierStats.map((t) => (
              <div key={t.tier} className="pc-surface-light rounded-lg p-4 border border-pc-border">
                <div className="text-sm font-medium text-pc-accent mb-2">{t.tier}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-pc-text-muted">WR</div>
                    <div className={`text-sm font-mono ${t.winRate >= 55 ? "text-emerald-400" : t.winRate <= 45 ? "text-rose-400" : "text-pc-text"}`}>
                      {t.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-pc-text-muted">PR</div>
                    <div className="text-sm font-mono text-pc-text">{t.pickRate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-pc-text-muted">Plays</div>
                    <div className="text-sm font-mono text-pc-text">{t.totalPlays.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
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
                {patchTrends.map((t) => (
                  <tr key={t.trendWeek}>
                    <td className="text-pc-text text-sm">{t.trendWeek}</td>
                    <td className={`font-mono text-sm ${t.weeklyWinRate >= 55 ? "text-emerald-400" : t.weeklyWinRate <= 45 ? "text-rose-400" : "text-pc-text"}`}>
                      {t.weeklyWinRate.toFixed(1)}%
                    </td>
                    <td className="text-pc-text-muted text-sm">{t.weeklyPlays.toLocaleString()}</td>
                  </tr>
                ))}
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

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-pc-text-muted">{label}</div>
      <div className="text-sm font-mono text-pc-text">{value}</div>
    </div>
  );
}

function SkillCard({ skill }: { skill: ChampionSkill }) {
  return (
    <div className="pc-surface-light rounded-lg p-4 border border-pc-border flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pc-bg-elevated border border-pc-border flex items-center justify-center">
        <span className="text-xs font-mono text-pc-accent">{skill.key}</span>
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

function TalentCard({ talent, championName }: { talent: ChampionTalent; championName: string }) {
  const talentImageUrl = `/images/wiki/talents/Talent ${championName} ${talent.name.replace(/\s+/g, "")}.png`;

  return (
    <div className="pc-surface-light rounded-lg p-3 border border-pc-border flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-pc-bg-elevated border border-pc-border flex items-center justify-center overflow-hidden">
        <img
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
      </div>
    </div>
  );
}
