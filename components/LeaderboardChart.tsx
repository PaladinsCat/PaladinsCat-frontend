/**
 * Render leaderboard chart with `BarChartComponent`.
 * refs: none
 */
"use client";

import { BarChartComponent } from "./Chart";
import type { LeaderboardEntry } from "@/lib/api-client";
import { getPercentageColor } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";

/**
 * Describe leaderboard chart props with data, title (optional), maxRows (optional).
 * refs: none
 */
export interface LeaderboardChartProps {
  data: LeaderboardEntry[];
  title?: string;
  maxRows?: number;
}

/**
 * Render leaderboard chart with `BarChartComponent`.
 * refs: none
 * I/O types: `{ data, title, maxRows = 10, }: LeaderboardChartProps -> JSX.Element`.
 */
export default function LeaderboardChart({
  data,
  title,
  maxRows = 10,
}: LeaderboardChartProps) {
  const { t } = useLocalization();
  const resolvedTitle = title ?? t("generated.leaderboard.title");
  const chartData = data
    .sort((a, b) => (b.winRate || 0) - (a.winRate || 0))
    .slice(0, maxRows)
    .map((entry) => ({
      champion: entry.championName,
      winRate: entry.winRate ?? 0,
    }));

  return (
    <BarChartComponent
      data={chartData}
      xKey="champion"
      yKeys={["winRate"]}
      yLabel={t("generated.leaderboard.winRate")}
      title={resolvedTitle}
     height={400}
      barColors={{ winRate: chartData.map((row) => getPercentageColor(row.winRate)) }}
     showLegend={false}
      showXAxis={false}
    />
  );
}
