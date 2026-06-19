"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { STATIC_CHAMPIONS } from "@/lib/mock-data";
import { getChampionIconSafe } from "@/lib/champion-icons";
import ScrambleText from "@/components/ScrambleText";
import SmartImage from "@/components/SmartImage";
import { championSlug } from "@/lib/utils";
import {
  getChampionData,
  type ChampionData,
  type ChampionSkill,
  type ChampionTalent,
  type ChampionLoadout,
} from "@/lib/champion-data";
import { fetchChampionLeaderboard, type ChampionLeaderboardEntry } from "@/lib/api-client";

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

    // Fetch real data from API
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
      // Fetch champion ID from API, then leaderboard
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3304"}/champions`)
        .then((r) => r.json())
        .then((champs: Array<{ id: number; name: string }>) => {
          const match = champs.find((c) => c.name.toLowerCase() === championData!.name.toLowerCase());
          return match ? fetchChampionLeaderboard(match.id, 25) : [];
        })
        .catch(() => [] as ChampionLeaderboardEntry[]),
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

      {/* Two-column: Champion Profile (left) + Talents & Cards (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column — Champion Profile + Skills (~1/4) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="pc-card">
            <div className="flex flex-col items-center text-center gap-4">
              <SmartImage
                src={getChampionIconSafe(championData?.name ?? mockChampion?.name ?? name)}
                alt={championData?.name ?? mockChampion?.name ?? name}
                className="w-28 h-28 rounded-xl border border-pc-border object-contain bg-pc-bg/50"
              />
              <div className="flex flex-wrap justify-center gap-2">
                {(championData?.roles ?? mockChampion?.roles ?? []).map((role) => (
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
              <h2 className="pc-card-title mb-2 shadow-sm">Talents</h2>
              <div className="pc-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {championData.talents.map((talent) => (
                  <TalentCard key={talent.name} talent={talent} championName={championData.name} />
                ))}
              </div>
              </div>
            </>
          )}

          {/* Loadout Cards */}
          {championData?.loadouts && championData.loadouts.length > 0 && (
            <>
              <h2 className="pc-card-title mb-2 shadow-sm">Loadout Cards</h2>
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
                      {cards.map((card) => (
                        <div key={card.name} className="pc-surface-light rounded-lg p-3 border border-pc-border flex items-start gap-3">
                          {card.iconUrl ? (
                            <SmartImage src={card.iconUrl} alt={card.name} className="flex-shrink-0 w-12 h-10 rounded border border-pc-border bg-pc-bg/50 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <div className="flex-shrink-0 w-10 h-10 rounded border border-pc-border bg-pc-bg-elevated flex items-center justify-center">
                              <span className="text-xs text-pc-accent">?</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-pc-accent mb-0.5">{card.name}</div>
                            <p className="text-xs text-pc-text-secondary leading-relaxed">{card.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Average Player Stats */}
      <h2 className="pc-card-title mb-2 shadow-sm">Average Player Stats</h2>
      <div className="pc-card">
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
      <h2 className="pc-card-title mb-2 shadow-sm">
        Global ELO Leaderboard — {championData?.name ?? mockChampion?.name ?? name}
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

function TalentCard({ talent, championName }: { talent: ChampionTalent; championName: string }) {
  const talentImageUrl = `/images/champions/Talent ${championName} ${talent.name}.png`;

  return (
    <div className="pc-surface-light rounded-lg p-3 border border-pc-border flex items-start gap-3">
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
      </div>
    </div>
  );
}
