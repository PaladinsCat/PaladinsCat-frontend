"use client";

import { BarChartComponent } from "./Chart";
import type { LeaderboardEntry } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

export interface LeaderboardChartProps {
  data: LeaderboardEntry[];
  title?: string;
  maxRows?: number;
}

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
      colors={["#4ade80"]}
      showLegend={false}
      showXAxis={false}
    />
  );
}
