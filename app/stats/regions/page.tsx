/**
 * Define the stats regions page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchRegions, type RegionStat } from "@/lib/api-client";
import { ContentFade, EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function RegionsPage() {
  const { t , formatPercent} = useLocalization();
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    fetchRegions()
      .then(setRegions)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg">{t("generated.stats.regionalMeta")}</h1>

      {displayLoading ? (
        <RouteSkeleton variant="dashboard" />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : regions.length === 0 ? (
        <EmptyState title={t("generated.stats.noRegionalStatistics")} description={t("generated.stats.regionalChampionTrendsWillAppearWhenRankedDataIsAvailable")} />
      ) : (
        <ContentFade className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {regions.map((r) => (
            <Card key={r.regionCode} title={r.regionName}>
              <p className="pc-body text-sm mb-4">{r.continent}</p>
              <div className="space-y-2">
                {r.topChampions.slice(0, 5).map((c) => (
                  <div key={c.championId} className="flex items-center justify-between text-sm">
                    <span className="text-pc-text">{c.championName}</span>
                    <span className="pc-badge">{formatPercent(c.winRate)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </ContentFade>
      )}
    </div>
  );
}
