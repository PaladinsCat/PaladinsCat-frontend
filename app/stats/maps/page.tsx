"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SmartImage from "@/components/SmartImage";
import { fetchMapStats, type MapStat, type PublicStatsScope } from "@/lib/api-client";
import { matchMapImagePath } from "@/lib/map-images";
import { useLocalization } from "@/lib/localization-context";

function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

export default function MapsPage() {
  const { t , formatPercent, formatNumber} = useLocalization();
  const searchParams = useSearchParams();
  const requestedScope = searchParams.get("scope");
  const [maps, setMaps] = useState<MapStat[]>([]);
  const [statsScope, setStatsScope] = useState<PublicStatsScope>(() => (
    ["casual", "bot", "team_deathmatch", "arcade", "wave_defense", "experiment", "newcomer"].includes(requestedScope ?? "")
      ? requestedScope as PublicStatsScope
      : "ranked"
  ));
  useEffect(() => {
    setMaps([]);
    fetchMapStats({ scope: statsScope, queueId: statsScope === "ranked" ? 486 : undefined, limit: 100 }).then(setMaps);
  }, [statsScope]);

  return <div className="space-y-6">
    <div><Link href="/matches" className="text-sm text-pc-text-secondary hover:text-pc-accent">{t("nav.matches")}</Link><div className="mt-3 flex flex-wrap items-end justify-between gap-3"><div><h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.mapStats")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("generated.stats.rankedMapDistributionChampionDraftsTalentsAndItemChoices")}</p></div><label className="text-xs text-pc-text-muted">{t("stats.scope.label")}<select value={statsScope} onChange={(event) => setStatsScope(event.target.value as PublicStatsScope)} className="pc-select mt-1 block"><option value="ranked">{t("stats.scope.ranked")}</option><option value="casual">{t("stats.scope.casual")}</option><option value="team_deathmatch">{t("stats.scope.teamDeathmatch")}</option><option value="arcade">{t("stats.scope.arcade")}</option><option value="wave_defense">{t("stats.scope.waveDefense")}</option><option value="experiment">{t("stats.scope.experiment")}</option><option value="newcomer">{t("stats.scope.newcomer")}</option><option value="bot">{t("stats.scope.bot")}</option></select></label></div></div>
    {maps.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">{t("generated.stats.mapStatsUnavailable")}</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {maps.map((map) => <Link key={map.name} href={`/game/maps/${encodeURIComponent(map.name)}?scope=${statsScope}`} className="group overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated transition-colors hover:border-pc-accent-mid"><div className="relative h-36 overflow-hidden bg-pc-bg"><SmartImage src={matchMapImagePath(map.name)} alt="" className="h-full w-full object-cover opacity-75 transition-transform duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-pc-bg-elevated via-pc-bg-elevated/10 to-transparent" /><h2 className="absolute bottom-3 left-4 right-4 truncate text-base font-bold text-pc-text group-hover:text-pc-accent">{map.name.replace(/^Ranked\s+/, "")}</h2></div><div className="grid grid-cols-3 gap-2 p-3 text-center text-xs"><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.mapShare")}</div><div className="font-bold text-pc-accent">{formatPercent(map.distributionRate)}</div></div><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.avgTime")}</div><div className="font-medium text-pc-text">{duration(map.avgDurationSeconds)}</div></div><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.matches")}</div><div className="font-medium text-pc-text">{formatNumber(map.totalMatches)}</div></div></div></Link>)}
    </div>}
  </div>;
}
