"use client";

import { useEffect, useState } from "react";
import { fetchPlatforms } from "@/lib/api-client";
import { BarChartComponent } from "@/components/Chart";
import { ContentFade, EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";
import { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation } from "@/components/aceternity";


export default function PlatformsPage() {
  const { t } = useLocalization();
  const [platforms, setPlatforms] = useState<Array<{ platform: string; championId: number; championName: string; totalMatches: number; winRate: number; avgDpm: number; avgHpm: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    fetchPlatforms()
      .then(setPlatforms)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const platformData = selectedPlatform
    ? platforms.filter((p) => p.platform === selectedPlatform)
    : platforms;

  const chartData = platformData
    .sort((a, b) => (b.winRate || 0) - (a.winRate || 0))
    .slice(0, 10)
    .map((p) => ({
      champion: p.championName,
      winRate: p.winRate,
    }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">{t("generated.stats.platformMeta")}</h1>
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedPlatform(null)}
          className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
            !selectedPlatform ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
          }`}
        >
          {t("generated.stats.all")}</button>
        {[...new Set(platforms.map((p) => p.platform))].map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
              selectedPlatform === platform ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
            }`}
          >
            {platform}
          </button>
        ))}
      </div>
      {displayLoading ? (
        <RouteSkeleton variant="detail" />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : chartData.length === 0 ? (
        <EmptyState title={t("generated.stats.noPlatformStatistics")} description={t("generated.stats.platformComparisonsWillAppearWhenRankedDataIsAvailable")} />
      ) : (
        <ContentFade><BarChartComponent
          data={chartData}
          xKey="champion"
          yKeys={["winRate"]}
          yLabel={t("generated.stats.platforms.page.winrate")}
          title={selectedPlatform ? t("generated.stats.value1TopChampions", { value1: selectedPlatform }) : t("generated.stats.topChampionsAllPlatforms")}
          height={400}
          colors={["var(--pc-chart-green)"]}
          showLegend={false}
          showXAxis={false}
        /></ContentFade>
      )}
    </div>
  );
}
