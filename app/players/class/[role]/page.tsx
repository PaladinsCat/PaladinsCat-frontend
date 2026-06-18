"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_CLASS_ELO } from "@/lib/mock-data";
import { fetchClassLeaderboard } from "@/lib/api-client";

const VALID_ROLES = ["Frontline", "Damage", "Flank", "Support"] as const;
type Role = (typeof VALID_ROLES)[number];

const CLASS_ICONS: Record<Role, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const ROLE_COLORS: Record<Role, string> = {
  Frontline: "text-amber-400",
  Damage: "text-red-400",
  Flank: "text-purple-400",
  Support: "text-emerald-400",
};

interface ClassEloEntry {
  rank: number;
  player_id: number;
  name: string;
  champion: string;
  elo: number;
  winRate: number;
  totalMatches: number;
  totalWins: number;
  region: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600/20 text-amber-600 font-bold text-sm">
        🥉
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-pc-text-muted text-sm">
      {rank}
    </span>
  );
}

export default function ClassEloPage() {
  const params = useParams();
  const router = useRouter();
  const rawRole = params?.role as string;

  // Normalize: handle "front-line" / "Frontline" / "frontline" etc.
  const normalizedRole =
    VALID_ROLES.find(
      (r) => r.toLowerCase() === rawRole?.toLowerCase()
    ) ||
    VALID_ROLES.find(
      (r) =>
        r.toLowerCase().replace("-", "") ===
        rawRole?.toLowerCase().replace("-", "").replace(" ", "")
    ) ||
    null;

  const [data, setData] = useState<ClassEloEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect invalid roles to Frontline
  useEffect(() => {
    if (!normalizedRole) {
      router.replace("/players/class/Frontline");
    }
  }, [normalizedRole, router]);

  // Fetch data — try API first, fall back to mock
  useEffect(() => {
    if (!normalizedRole) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const leaderboard = await fetchClassLeaderboard({ role: normalizedRole!, limit: 100 });
        if (cancelled) return;
        if (leaderboard.length > 0) {
          setData(leaderboard.map((p) => ({
            rank: p.rank,
            player_id: p.playerId,
            name: p.playerName,
            champion: p.championName,
            elo: p.elo,
            winRate: p.winRate ?? 0,
            totalMatches: p.totalMatches,
            totalWins: p.totalWins,
            region: p.region ?? "—",
          })));
        } else {
          setData(MOCK_CLASS_ELO[normalizedRole!] || []);
        }
      } catch {
        if (!cancelled) {
          setData(MOCK_CLASS_ELO[normalizedRole!] || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedRole]);

  if (!normalizedRole) return null;

  const role = normalizedRole as Role;
  const players = data;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/players"
          className="text-pc-text-muted hover:text-pc-accent transition-colors text-sm flex items-center gap-1"
        >
          ← Players
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <img
          src={CLASS_ICONS[role]}
          alt={role}
          className="w-8 h-8"
        />
        <h1 className="pc-heading pc-heading-lg">
          <span className={ROLE_COLORS[role]}>{role}</span>{" "}
          <span className="text-pc-text">ELO Leaderboard</span>
        </h1>
      </div>

      {/* ── Class Selector Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {VALID_ROLES.map((r) => (
          <Link
            key={r}
            href={`/players/class/${r}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              r === role
                ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/40"
                : "bg-pc-bg-elevated text-pc-text-muted border border-pc-border hover:border-pc-accent-mid hover:text-pc-text"
            }`}
          >
            <img src={CLASS_ICONS[r]} alt={r} className="w-4 h-4" />
            {r}
          </Link>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-pc-text-muted text-sm">
            Loading {role} leaderboard...
          </div>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-20 text-pc-text-muted">
          No data available for {role}.
        </div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border">
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-14">
                    Rank
                  </th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4">
                    Player
                  </th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden sm:table-cell">
                    Champion
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">
                    ELO
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">
                    Win Rate
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">
                    Matches
                  </th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">
                    Wins
                  </th>
                  <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">
                    Region
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const rowBg = i < 3 ? "bg-pc-bg/30" : "";
                  return (
                    <tr
                      key={`${p.player_id}-${p.rank}`}
                      className={`border-b border-pc-border/50 hover:bg-pc-bg/60 transition-colors ${rowBg}`}
                    >
                      <td className="py-2.5 px-4">
                        <RankBadge rank={p.rank} />
                      </td>
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/players/${p.player_id}`}
                          className="text-pc-text font-medium hover:text-pc-accent transition-colors"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-pc-text-secondary hidden sm:table-cell">
                        {p.champion}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`font-bold ${ROLE_COLORS[role]}`}>
                          {p.elo.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={
                            p.winRate >= 55
                              ? "text-emerald-400 font-medium"
                              : p.winRate >= 50
                              ? "text-emerald-300"
                              : "text-red-400"
                          }
                        >
                          {p.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                        {p.totalMatches.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-right text-pc-text-secondary hidden md:table-cell">
                        {p.totalWins.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-center hidden lg:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded bg-pc-bg text-pc-text-muted">
                          {p.region}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer note ── */}
      <p className="text-pc-text-muted text-xs text-center">
        Showing {players.length} players — ELO ratings are per-class and update
        after each ranked match.
      </p>
    </div>
  );
}
