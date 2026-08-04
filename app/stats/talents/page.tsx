"use client";

import { useEffect, useState } from "react";
import { fetchTalents } from "@/lib/api-client";
import { EmptyState, ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";
import Link from "next/link";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";
import { SpotlightCard, MovingBorderCard, BackgroundGradientAnimation } from "@/components/aceternity";


export default function TalentsPage() {
  const { t , formatNumber, formatPercent} = useLocalization();
  const [talents, setTalents] = useState<Array<{ talentId: number; talentName: string; championId: number; championName: string; totalPlays: number; winRate: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    fetchTalents()
      .then(setTalents)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedChampion
    ? talents.filter((t) => t.championName === selectedChampion)
    : talents;
  const champions = [...new Set(talents.map((t) => t.championName))];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-pc-accent sm:text-3xl">{t("generated.stats.talentPerformance")}</h1>
      <label className="block sm:hidden"><span className="pc-label">{t("generated.stats.champion")}</span><select value={selectedChampion ?? ""} onChange={(event) => setSelectedChampion(event.target.value || null)} className="pc-select w-full"><option value="">{t("generated.stats.allChampions")}</option>{champions.map((champion) => <option key={champion} value={champion}>{champion}</option>)}</select></label>
      <div className="hidden flex-wrap gap-2 sm:flex">
        <button
          onClick={() => setSelectedChampion(null)}
          className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
            !selectedChampion ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
          }`}
        >
          {t("generated.stats.all")}</button>
        {champions.map((champion) => (
          <button
            key={champion}
            onClick={() => setSelectedChampion(champion)}
            className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
              selectedChampion === champion ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
            }`}
          >
            {champion}
          </button>
        ))}
      </div>
      {displayLoading ? (
        <DataTableSkeleton />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("generated.stats.noTalentStatistics")} description={t("generated.stats.talentPerformanceWillAppearAfterRankedMatchesAreProcessed")} />
      ) : (
        <div className="space-y-2 sm:hidden">
          {filtered.slice(0, 20).map((talent) => <Link key={`${talent.championId}-${talent.talentId}`} href={`/champions/${championSlug(talent.championName)}/talents/${talent.talentId}`} className="pc-mobile-panel flex min-w-0 items-center gap-3 p-3">
            <img src={getChampionIconSafe(talent.championName)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-pc-text">{talent.talentName}</div><div className="text-xs text-pc-text-muted">{talent.championName} · {formatNumber(talent.totalPlays)} {t("generated.stats.plays.0effba4")}</div></div>
            <span className={talent.winRate >= 50 ? "shrink-0 font-bold text-emerald-400" : "shrink-0 font-bold text-rose-400"}>{formatPercent(talent.winRate)}</span>
          </Link>)}
        </div>
      )}
      {!displayLoading && !error && filtered.length > 0 && (
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left">
            <thead className="bg-pc-bg-elevated">
              <tr>
                <th className="px-4 py-2 text-pc-accent font-semibold">{t("generated.stats.champion")}</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">{t("generated.stats.talent")}</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">{t("generated.stats.plays")}</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">{t("generated.stats.winRate.49a3838")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((t) => (
                <tr key={`${t.championId}-${t.talentId}`} className="border-t border-pc-border">
                  <td className="px-4 py-2 text-pc-text">{t.championName}</td>
                  <td className="px-4 py-2 text-pc-text">{t.talentName}</td>
                  <td className="px-4 py-2 text-pc-text">{t.totalPlays}</td>
                  <td className="px-4 py-2 text-pc-text">{formatPercent(t.winRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
