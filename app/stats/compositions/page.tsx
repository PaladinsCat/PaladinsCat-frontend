"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMatchCompositions, type MatchCompositionStat } from "@/lib/api-client";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

type SortKey = "totalMatches" | "winRate";
const PAGE_SIZES = [10, 25, 50, 100] as const;

const CLASS_COLUMNS = [
  { key: "frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { key: "damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { key: "flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { key: "support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

export default function CompositionStatsPage() {
  const { t } = useLocalization();
  const [rows, setRows] = useState<MatchCompositionStat[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("totalMatches");
  const [descending, setDescending] = useState(true);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();

  useEffect(() => {
    let cancelled = false;
    if (!lobbyTierReady) return;
    setLoading(true);
    setCurrentPage(1);
    fetchMatchCompositions({ tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax, limit: 200 })
      .then((data) => { if (!cancelled) setRows(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lobbyTier.tierMin, lobbyTier.tierMax, lobbyTierReady]);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return descending ? -diff : diff;
  }), [rows, sortKey, descending]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageStart = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, sorted.length);
  const pagedRows = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, sorted],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function changeSort(next: SortKey) {
    setCurrentPage(1);
    if (next === sortKey) setDescending((value) => !value);
    else {
      setSortKey(next);
      setDescending(true);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link href="/matches" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("nav.matches")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.compositionStats")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("generated.stats.rankedFivePlayerTeamCompositionsTheOrderIsFrontlineDamage")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t("generated.app\\stats\\compositions\\page.compositions"), rows.length.toLocaleString()],
          [t("generated.app\\stats\\compositions\\page.mostcommon"), rows[0]?.composition ?? "—"],
          [t("generated.app\\stats\\compositions\\page.trackedmatches"), rows.reduce((sum, row) => sum + row.totalMatches, 0).toLocaleString()],
          [t("generated.app\\stats\\compositions\\page.bestsampledwr"), rows.length ? `${Math.max(...rows.filter((row) => row.totalMatches >= 20).map((row) => row.winRate), 0).toFixed(1)}%` : "—"],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="text-[10px] uppercase tracking-wider text-pc-text-muted">{label}</div><div className="mt-1 truncate text-lg font-bold text-pc-text">{value}</div></div>)}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:hidden">
        <span className="text-xs text-pc-text-muted">{t("generated.stats.sort")}</span>
        <button onClick={() => changeSort("totalMatches")} className={`pc-touch-target rounded-lg border px-3 text-xs ${sortKey === "totalMatches" ? "border-pc-accent bg-pc-accent/15 text-pc-accent" : "border-pc-border bg-pc-bg-elevated text-pc-text-secondary"}`}>{t("generated.stats.matches")}{" "}{sortKey === "totalMatches" && (descending ? "↓" : "↑")}</button>
        <button onClick={() => changeSort("winRate")} className={`pc-touch-target rounded-lg border px-3 text-xs ${sortKey === "winRate" ? "border-pc-accent bg-pc-accent/15 text-pc-accent" : "border-pc-border bg-pc-bg-elevated text-pc-text-secondary"}`}>{t("generated.stats.winRate")}{" "}{sortKey === "winRate" && (descending ? "↓" : "↑")}</button>
      </div>

      <div className="space-y-2 lg:hidden">
        {pagedRows.map((row) => <article key={row.composition} className="pc-mobile-panel p-3">
          <div className="flex items-center justify-between gap-3"><div><div className="font-mono text-base font-bold text-pc-text">{row.composition}</div><div className="text-[10px] text-pc-text-muted">{t("generated.stats.frontlineDamageFlankSupport")}</div></div><div className={row.winRate >= 50 ? "text-right font-bold text-emerald-400" : "text-right font-bold text-rose-400"}>{row.winRate.toFixed(1)}%<div className="text-[9px] font-normal uppercase tracking-wide text-pc-text-muted">{t("generated.stats.winRate.0a2b795")}</div></div></div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">{CLASS_COLUMNS.map((column) => <div key={column.key} className="rounded-lg bg-pc-bg-secondary/60 p-2 text-center"><img src={column.icon} alt="" className="mx-auto h-5 w-5 object-contain" /><div className="mt-1 font-mono text-sm font-semibold text-pc-text">{row[column.key]}</div><div className="truncate text-[8px] uppercase text-pc-text-muted">{t(column.labelKey)}</div></div>)}</div>
          <div className="mt-3 flex items-center justify-between text-xs"><span className="text-pc-text-secondary">{row.totalMatches.toLocaleString()} {t("generated.stats.matches.9f3e924")}</span><span className="text-pc-text-muted">{row.wins.toLocaleString()}{t("generated.stats.w")}{" "}{row.losses.toLocaleString()}L</span></div>
        </article>)}
        {pagedRows.length === 0 && <div className="pc-mobile-panel p-6 text-center text-sm text-pc-text-muted">{loading ? <LoadingIndicator /> : t("generated.stats.compositionStatisticsAreNotAvailableForThisLobbyScopeYet")}</div>}
      </div>

      <div className="mx-auto hidden w-full max-w-5xl overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated shadow-lg shadow-black/10 lg:block">
        <table className="w-full min-w-[760px] table-fixed text-sm">
          <thead className="border-b border-pc-border text-left text-xs text-pc-text-muted">
            <tr>
              <th className="w-[18%] px-4 py-3">{t("generated.stats.composition")}</th>
              {CLASS_COLUMNS.map((column) => <th key={column.key} className="w-[10%] px-2 py-3 text-right">{t(column.labelKey)}</th>)}
              <th className="px-3 py-3 text-right"><button onClick={() => changeSort("totalMatches")} className="hover:text-pc-accent">{t("generated.stats.matches")}{" "}{sortKey === "totalMatches" && (descending ? "↓" : "↑")}</button></th>
              <th className="px-3 py-3 text-right">{t("generated.stats.wL")}</th>
              <th className="px-4 py-3 text-right"><button onClick={() => changeSort("winRate")} className="hover:text-pc-accent">{t("generated.stats.winRate.49a3838")}{" "}{sortKey === "winRate" && (descending ? "↓" : "↑")}</button></th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row) => <tr key={row.composition} className="border-b border-pc-border/50 transition-colors hover:bg-pc-bg-secondary/60">
              <td className="px-4 py-3 font-mono font-semibold text-pc-text">{row.composition}</td>
              {CLASS_COLUMNS.map((column) => <td key={column.key} className="px-2 py-3 text-right text-pc-text-secondary">
                <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
                  <img src={column.icon} alt="" aria-hidden="true" className="h-4 w-4 object-contain opacity-90" />
                  <span>{row[column.key]}</span>
                </span>
              </td>)}
              <td className="px-3 py-3 text-right text-pc-text">{row.totalMatches.toLocaleString()}</td>
              <td className="px-3 py-3 text-right text-pc-text-secondary">{row.wins.toLocaleString()} / {row.losses.toLocaleString()}</td>
              <td className={row.winRate >= 50 ? "px-4 py-3 text-right font-semibold text-emerald-400" : "px-4 py-3 text-right font-semibold text-rose-400"}>{row.winRate.toFixed(1)}%</td>
            </tr>)}
            {pagedRows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-pc-text-muted">{loading ? <LoadingIndicator /> : t("generated.stats.compositionStatisticsAreNotAvailableForThisLobbyScopeYet")}</td></tr>}
          </tbody>
        </table>
      </div>

      {!loading && sorted.length > 0 && (
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated px-3 py-2" aria-label={t("generated.changelog.pagination")}>
          <div className="text-xs text-pc-text-muted">
            {t("skins.showingStatus", { start: pageStart, end: pageEnd, total: sorted.length.toLocaleString() })}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-2 text-xs text-pc-text-secondary">
              {t("skins.rowsPerPage")}
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number]);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-pc-border bg-pc-bg-secondary px-2 py-1.5 text-xs text-pc-text"
              >
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <span className="min-w-20 text-center text-xs text-pc-text-muted">
              {t("skins.pageStatus", { page: currentPage, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-pc-border px-2.5 py-1.5 text-xs text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("skins.previous")}
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="rounded-lg border border-pc-border px-2.5 py-1.5 text-xs text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("skins.next")}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
