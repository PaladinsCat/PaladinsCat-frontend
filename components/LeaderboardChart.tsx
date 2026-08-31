/** LeaderboardChart component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import { BarChartComponent } from "./Chart";
import type { LeaderboardEntry } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

export interface LeaderboardChartProps {
  data: LeaderboardEntry[];
  title?: string;
  maxRows?: number;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
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
      colors={["var(--pc-chart-green)"]}
      showLegend={false}
      showXAxis={false}
    />
  );
}
