"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchPerformanceLeaderboard } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { useLocalization } from "@/lib/localization-context";

const VALID_METRICS = ["gpm", "hpm", "dpm", "mpm"] as const;
type Metric = (typeof VALID_METRICS)[number];

const METRIC_LABELS: Record<Metric, string> = {
  gpm: "Credits / Min",
  hpm: "Healing / Min",
  dpm: "Damage / Min",
  mpm: "Shielding / Min",
};

const METRIC_COLORS: Record<Metric, string> = {
  gpm: "text-yellow-400",
  hpm: "text-emerald-400",
  dpm: "text-red-400",
  mpm: "text-blue-400",
};

const METRIC_HEX: Record<Metric, string> = {
  gpm: "#facc15",
  hpm: "#34d399",
  dpm: "#f87171",
  mpm: "#60a5fa",
};

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

interface PerfEntry {
  rank: number;
  matchId: string;
  player_id: number;
  name: string;
  champion: string | null;
  className: string;
  value: number;
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

export default function MetricLeaderboardPage() {
  const { t , formatNumber} = useLocalization();
  const params = useParams();
  const router = useRouter();
  const rawMetric = (params.metric as string)?.toLowerCase();

  const normalizedMetric = VALID_METRICS.find((m) => m === rawMetric) || null;

  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!normalizedMetric) {
      router.replace("/players/stats/dpm");
      return;
    }
    let cancelled = false;
    const metric = normalizedMetric;

    async function load() {
      setLoading(true);
      try {
        const leaderboardRows = await fetchPerformanceLeaderboard({ metric, limit: 100 });
        if (cancelled) return;
        setEntries(leaderboardRows.map((p) => ({
          rank: p.rank,
          matchId: p.matchId,
          player_id: p.playerId,
          name: p.playerName,
          champion: p.championName,
          className: p.className ?? t("generated.players.stats.[metric].page.unknown"),
          value: p.value,
          region: p.region ?? "—",
        })));
      } catch {
        if (!cancelled) {
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [normalizedMetric, router]);

  if (!normalizedMetric) return null;

  const m = normalizedMetric;
  const colorClass = METRIC_COLORS[m];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/players"
          className="text-pc-text-muted hover:text-pc-accent transition-colors text-sm flex items-center gap-1"
        >
          {t("generated.players.players")}</Link>
      </div>

      <div className="flex items-center gap-3">
        {m === "gpm" && (
          <picture>
            <source srcSet="/images/icons/Currency_Credits.avif" type="image/avif" />
            <img src="/images/icons/Currency_Credits.avif" alt="" className="w-8 h-8" />
          </picture>
        )}
        <h1 className="pc-heading pc-heading-lg">
          <span className={colorClass}>{METRIC_LABELS[m]}</span>{" "}
          <span className="text-pc-text">{t("generated.players.leaderboard")}</span>
        </h1>
      </div>

      {/* ── Metric Selector Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {VALID_METRICS.map((tab) => (
          <Link
            key={tab}
            href={`/players/stats/${tab}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === m
                ? "bg-pc-accent/20 text-pc-accent border border-pc-accent/40"
                : "bg-pc-bg-elevated text-pc-text-muted border border-pc-border hover:border-pc-accent-mid hover:text-pc-text"
            }`}
          >
            {METRIC_LABELS[tab]}
          </Link>
        ))}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <LoadingPanel compact />
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-pc-text-muted">
          {t("generated.players.noDataAvailableFor")}{" "}{METRIC_LABELS[m]}.
        </div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border">
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 w-14">{t("generated.players.rank")}</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4">{t("generated.players.player")}</th>
                  <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden sm:table-cell">{t("generated.players.champion")}</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">{t("generated.players.class")}</th>
                  <th className="text-right text-pc-text-muted font-medium py-3 px-4">{METRIC_LABELS[m]}</th>
                  <th className="text-left text-pc-text-muted font-medium py-3 px-4 hidden md:table-cell">{t("generated.matches.matchId")}</th>
                  <th className="text-center text-pc-text-muted font-medium py-3 px-4 hidden lg:table-cell">{t("generated.players.region")}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((p, i) => {
                  const rowBg = i < 3 ? "bg-pc-bg/30" : "";
                  return (
                    <tr
                      key={`${p.matchId}-${p.player_id}-${p.rank}`}
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
                          <PlayerName playerId={p.player_id}>{p.name}</PlayerName>
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        <img
                          src={getChampionIconSafe(p.champion)}
                          alt={p.champion ?? t("generated.players.championUnavailable")}
                          title={p.champion ?? t("generated.players.championUnavailable")}
                          className="mx-auto h-7 w-7 rounded object-contain"
                        />
                      </td>
                      <td className="py-2.5 px-4 hidden md:table-cell">
                        <span className="flex items-center gap-2 text-xs">
                          {CLASS_ICONS[p.className] && (
                            <img src={CLASS_ICONS[p.className]} alt={p.className} className="w-4 h-4" />
                          )}
                          <span className="text-pc-text-muted">{p.className}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`font-bold ${colorClass}`}>
                          {formatNumber(p.value)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-pc-text-secondary hidden md:table-cell">
                        <Link href={`/matches/${p.matchId}`} className="hover:text-pc-accent hover:underline">
                          {p.matchId}
                        </Link>
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

    </div>
  );
}
