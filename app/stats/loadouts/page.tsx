"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { fetchLoadouts, type LoadoutStat } from "@/lib/api-client";
import { EmptyState, ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";
import Link from "next/link";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";

type SortKey = "championName" | "totalUses" | "winRate" | "avgDpm" | "avgHpm";
type SortDir = "asc" | "desc";

export default function LoadoutsPage() {
  const { t } = useLocalization();
  const [loadouts, setLoadouts] = useState<LoadoutStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchLoadouts()
      .then(setLoadouts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...loadouts].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="space-y-6">
      <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.loadoutMeta")}</h1>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:hidden">
        <label className="min-w-0"><span className="pc-label">{t("generated.stats.sortLoadouts")}</span><select value={sortKey} onChange={(event) => { setSortKey(event.target.value as SortKey); setSortDir("desc"); }} className="pc-select w-full"><option value="winRate">{t("generated.stats.winRate")}</option><option value="totalUses">{t("generated.stats.plays")}</option><option value="avgDpm">{t("generated.stats.averageDpm")}</option><option value="avgHpm">{t("generated.stats.averageHpm")}</option><option value="championName">{t("generated.stats.champion")}</option></select></label>
        <button type="button" onClick={() => setSortDir((direction) => direction === "asc" ? "desc" : "asc")} className="pc-touch-target mt-[1.35rem] rounded-lg border border-pc-border bg-pc-bg-elevated px-3 text-pc-accent" aria-label={t("generated.stats.sortValue1", { value1: sortDir === "asc" ? t("generated.stats.descending") : t("generated.stats.ascending") })}>{sortDir === "asc" ? "↑" : "↓"}</button>
      </div>

      {loading ? (
        <DataTableSkeleton />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : sorted.length === 0 ? (
        <EmptyState title={t("generated.stats.noLoadoutStatistics")} description={t("generated.stats.loadoutCombinationsWillAppearAfterEnoughRankedMatchesAreProcessed")} />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {sorted.slice(0, 20).map((loadout) => <Link key={loadout.deckHash} href={`/champions/${championSlug(loadout.championName)}`} className="pc-mobile-panel block p-3">
              <div className="flex min-w-0 items-center gap-3"><img src={getChampionIconSafe(loadout.championName)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-pc-text">{loadout.championName}</div><div className="truncate font-mono text-[10px] text-pc-text-muted">{loadout.deckHash}</div></div><div className={loadout.winRate >= 50 ? "shrink-0 text-right font-bold text-emerald-400" : "shrink-0 text-right font-bold text-rose-400"}>{loadout.winRate?.toFixed(1)}%<div className="text-[9px] font-normal uppercase tracking-wide text-pc-text-muted">{t("generated.stats.winRate.0a2b795")}</div></div></div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">{[[t("generated.app\\stats\\loadouts\\page.plays"), loadout.totalUses.toLocaleString()], [t("generated.app\\stats\\loadouts\\page.avgdpm"), loadout.avgDpm?.toFixed(0)], [t("generated.app\\stats\\loadouts\\page.avghpm"), loadout.avgHpm?.toFixed(0)]].map(([label, metric]) => <div key={label} className="rounded-lg bg-pc-bg-secondary/60 p-2 text-center"><div className="text-[8px] uppercase text-pc-text-muted">{label}</div><div className="mt-0.5 font-mono text-xs font-semibold text-pc-text">{metric ?? "—"}</div></div>)}</div>
            </Link>)}
          </div>
        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="pc-table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("championName")}>
                    {t("generated.stats.champion")}{sortArrow("championName")}
                  </th>
                  <th>{t("generated.stats.deckHash")}</th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("totalUses")}>
                    {t("generated.stats.plays")}{sortArrow("totalUses")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("winRate")}>
                    {t("generated.stats.winRate.49a3838")}{sortArrow("winRate")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("avgDpm")}>
                    {t("generated.stats.avgDpm")}{sortArrow("avgDpm")}
                  </th>
                  <th className="cursor-pointer hover:text-pc-accent-light" onClick={() => handleSort("avgHpm")}>
                    {t("generated.stats.avgHpm")}{sortArrow("avgHpm")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 20).map((l) => (
                  <tr key={l.deckHash}>
                    <td>{l.championName}</td>
                    <td className="text-pc-text-secondary">{l.deckHash}</td>
                    <td>{l.totalUses}</td>
                    <td>{l.winRate?.toFixed(1)}%</td>
                    <td>{l.avgDpm?.toFixed(0)}</td>
                    <td>{l.avgHpm?.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </>
      )}
    </div>
  );
}
