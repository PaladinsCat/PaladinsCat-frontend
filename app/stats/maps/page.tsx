/**
 * Define the stats maps page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SmartImage from "@/components/SmartImage";
import { fetchMapStats, type MapStat, type PublicStatsScope } from "@/lib/api-client";
import { matchMapImagePath } from "@/lib/map-images";
import { useLocalization } from "@/lib/localization-context";
import { ContentFade, EmptyState, ErrorState } from "@/components/async-state";
import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 */
export default function MapsPage() {
  const { t , formatPercent, formatNumber} = useLocalization();
  const searchParams = useSearchParams();
  const requestedScope = searchParams.get("scope");
  const [maps, setMaps] = useState<MapStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statsScope, setStatsScope] = useState<PublicStatsScope>(() => (
    ["casual", "bot", "team_deathmatch", "arcade", "wave_defense", "experiment", "newcomer"].includes(requestedScope ?? "")
      ? requestedScope as PublicStatsScope
      : "ranked"
  ));
  useEffect(() => {
    let active = true;
    fetchMapStats({ scope: statsScope, queueId: statsScope === "ranked" ? 486 : undefined, limit: 100 })
      .then((nextMaps) => { if (active) setMaps(nextMaps); })
      .catch(() => {
        if (!active) return;
        setMaps([]);
        setError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [statsScope]);

  const selectScope = (nextScope: PublicStatsScope) => {
    if (nextScope === statsScope) return;
    setLoading(true);
    setError(false);
    setStatsScope(nextScope);
    const url = new URL(window.location.href);
    if (nextScope === "ranked") url.searchParams.delete("scope");
    else url.searchParams.set("scope", nextScope);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  };

  return <div className="space-y-6">
    <header><h1 className="pc-heading pc-heading-lg">{t("generated.stats.mapStats")}</h1></header>
    <label className="block max-w-xs text-xs text-pc-text-secondary">{t("stats.scope.label")}<select value={statsScope} onChange={(event) => selectScope(event.target.value as PublicStatsScope)} className="pc-select mt-1.5 block w-full"><option value="ranked">{t("stats.scope.ranked")}</option><option value="casual">{t("stats.scope.casual")}</option><option value="team_deathmatch">{t("stats.scope.teamDeathmatch")}</option><option value="arcade">{t("stats.scope.arcade")}</option><option value="wave_defense">{t("stats.scope.waveDefense")}</option><option value="experiment">{t("stats.scope.experiment")}</option><option value="newcomer">{t("stats.scope.newcomer")}</option><option value="bot">{t("stats.scope.bot")}</option></select></label>
    {loading && maps.length === 0 && <MapGridSkeleton label={t("async.loading")} />}
    {!loading && error && <ErrorState message={t("generated.stats.mapStatsUnavailable")} />}
    {!loading && !error && maps.length === 0 && <EmptyState title={t("generated.stats.mapStatsUnavailable")} />}
    {maps.length > 0 && <ContentFade className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : "opacity-100"}`}>
      {maps.map((map) => <Link key={map.name} href={`/game/maps/${encodeURIComponent(map.name)}?scope=${statsScope}`} className="group overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated transition-colors hover:border-pc-accent-mid"><div className="relative h-36 overflow-hidden bg-pc-bg"><SmartImage src={matchMapImagePath(map.name)} alt="" className="h-full w-full object-cover opacity-75 transition-transform duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-pc-bg-elevated via-pc-bg-elevated/10 to-transparent" /><h2 className="absolute bottom-3 left-4 right-4 truncate text-base font-bold text-pc-text transition-colors group-hover:text-pc-accent">{map.name.replace(/^Ranked\s+/, "")}</h2></div><div className="grid grid-cols-3 gap-2 p-3 text-center text-xs tabular-nums"><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.mapShare")}</div><div className="font-bold text-pc-accent">{formatPercent(map.distributionRate)}</div></div><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.avgTime")}</div><div className="font-medium text-pc-text">{duration(map.avgDurationSeconds)}</div></div><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.matches")}</div><div className="font-medium text-pc-text">{formatNumber(map.totalMatches)}</div></div></div></Link>)}
    </ContentFade>}
  </div>;
}

function MapGridSkeleton({ label }: { label: string }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label={label}>
    {Array.from({ length: 6 }, (_, index) => <div key={index} className="overflow-hidden rounded-xl border border-pc-border">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="grid grid-cols-3 gap-3 p-3"><SkeletonLine /><SkeletonLine /><SkeletonLine /></div>
    </div>)}
  </div>;
}
