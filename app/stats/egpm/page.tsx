/**
 * Define the stats egpm page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PerformanceOverviewCard } from "@/components/PerformanceOverviewCard";
import { ContentFade, EmptyState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { fetchBaselines, type BaselineEntry } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

import {
  ECPM_ACTIVITY_THRESHOLDS,
  type EcpmActivityLabelKey,
} from "@/lib/ecpm-activity";

const ROLE_ORDER = ["Global", "Damage", "Flank", "Support", "Frontline"];
const ROLE_COLORS: Record<string, string> = {
  Global: "var(--pc-chart-amber)",
  Damage: "var(--pc-chart-red)",
  Flank: "var(--pc-role-flank)",
  Support: "var(--pc-chart-green)",
  Frontline: "var(--pc-role-support)",
};

const SORT_OPTIONS = [
  { value: "role", labelKey: "generated.stats.role" },
  { value: "average", labelKey: "generated.stats.average" },
  { value: "samples", labelKey: "generated.stats.samples" },
] as const;

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function EgpmDetailPage() {
  const { t, formatNumber } = useLocalization();
  const format = (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [rows, setRows] = useState<BaselineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"role" | "average" | "samples">("role");
  const displayLoading = useRouteSettledLoading(loading);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBaselines({ queueId: 486 })
      .then((next) => { if (!cancelled) setRows(next); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const ordered = useMemo(() => [...rows].sort((a, b) => {
    if (sort === "average") return b.avgEcpm - a.avgEcpm;
    if (sort === "samples") return b.sampleSize - a.sampleSize;
    return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
  }), [rows, sort]);
  const global = rows.find((row) => row.role === "Global") ?? null;

  if (displayLoading) return <RouteSkeleton variant="dashboard" />;

  return (
    <ContentFade className="space-y-7">
      <header>
        <Link href="/stats/performance" className="text-sm text-pc-text-secondary transition-colors hover:text-pc-accent">{t("generated.stats.globalStats")}</Link>
        <div className="mt-3">
          <div>
            <h1 className="pc-heading pc-heading-lg">{t("generated.stats.effectiveCreditsPerMinute")}</h1>
            <p className="mt-1 max-w-3xl text-sm text-pc-text-secondary">{t("generated.stats.ecpmMeasuresCreditsEarnedThroughParticipationAfterRemovingThe500")}</p>
          </div>
        </div>
      </header>

      {rows.length === 0 ? <EmptyState title={t("generated.stats.noEcpmBaselines")} description={t("ecpm.noDataDescription")} /> : <>
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><h2 className="text-sm font-bold text-pc-text">{t("generated.stats.currentPlayerBaseDistribution")}</h2><p className="mt-1 text-xs text-pc-text-muted">{t("generated.stats.whiskersShowP10P90TheBoxShowsP25P75And")}</p></div>
            <span className="text-xs text-pc-text-secondary">{global ? formatNumber(global.sampleSize) : "—"} {t("generated.stats.globalPlayerMatchObservations")}</span>
          </div>
          <ContentFade><PerformanceOverviewCard metrics={ROLE_ORDER.map((role) => rows.find((row) => row.role === role)).filter((row): row is BaselineEntry => Boolean(row)).map((row) => ({
            key: `egpm-${row.role}`,
            label: row.role === "Frontline" ? t("common.roles.frontlineShort") : row.role === "Support" ? t("common.roles.supportShort") : row.role === "Damage" ? t("common.roles.damageShort") : row.role === "Global" ? t("common.roles.global") : t("common.roles.flank"),
            color: ROLE_COLORS[row.role] ?? "var(--pc-chart-amber)",
            p10: row.p10Ecpm,
            p25: row.p25Ecpm,
            mean: row.avgEcpm,
            p75: row.p75Ecpm,
            p90: row.p90Ecpm,
          }))} /></ContentFade>
        </section>

        {global && <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([
            ["generated.stats.average", global.avgEcpm], ["generated.stats.p10", global.p10Ecpm], ["generated.stats.p25", global.p25Ecpm],
            ["generated.stats.p75", global.p75Ecpm], ["generated.stats.p90", global.p90Ecpm], ["generated.app.stats.egpm.page.maximum", global.maxEcpm],
          ] as const).map(([labelKey, value]) => <div key={String(labelKey)} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4"><div className="text-xs uppercase tracking-wider text-pc-text-muted">{t("generated.stats.global")}{" "}{t(labelKey)}</div><div className="mt-1 text-xl font-bold text-yellow-400 tabular-nums">{format(Number(value))}</div></div>)}
        </section>}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="pc-card">
            <h2 className="pc-card-title">{t("generated.stats.calculation")}</h2>
            <div className="mt-3 rounded-lg border border-pc-border bg-pc-bg px-4 py-3 font-mono text-sm text-pc-accent">{t("generated.stats.ecpmCreditsEarned500MinutesPlayed")}</div>
            <p className="mt-3 text-sm leading-relaxed text-pc-text-secondary">{t("generated.stats.startingCreditsAreRemovedSoTheMetricReflectsActiveCredit")}</p>
          </div>
          <div className="pc-card">
            <h2 className="pc-card-title">{t("generated.stats.afkSeverityThresholds")}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 xl:grid-cols-5">
              {([
                ["generated.stats.egpm.engaged", `≥ ${ECPM_ACTIVITY_THRESHOLDS.engaged}`, "text-emerald-400"],
                ["common.activity.possibleDisconnect", `${ECPM_ACTIVITY_THRESHOLDS.disconnected}–${ECPM_ACTIVITY_THRESHOLDS.engaged - 1}`, "text-yellow-300"],
                ["generated.stats.egpm.disconnected", `${ECPM_ACTIVITY_THRESHOLDS.partialAfk}–${ECPM_ACTIVITY_THRESHOLDS.disconnected - 1}`, "text-yellow-400"],
                ["generated.stats.egpm.partialAfk", `${ECPM_ACTIVITY_THRESHOLDS.fullAfk}–${ECPM_ACTIVITY_THRESHOLDS.partialAfk - 1}`, "text-orange-400"],
                ["generated.stats.egpm.fullAfk", `< ${ECPM_ACTIVITY_THRESHOLDS.fullAfk}`, "text-red-400"],
              ] as const).map(([labelKey, range, color]) => {
                return <div key={labelKey} className="rounded-lg border border-pc-border bg-pc-bg p-3">
                  <div className={`font-semibold ${color}`}>{t(labelKey as EcpmActivityLabelKey)}</div>
                  <div className="mt-1 font-mono text-pc-text-secondary">{range} {t("generated.stats.ecpm")}</div>
                </div>;
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-pc-text-muted">{t("common.activity.reviewPolicy")} {t("generated.stats.theseAreFixedDetectionThresholdsTheRoleAndGlobalPercentiles")}</p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-pc-text">{t("generated.stats.rolePercentileValues")}</h2>
            <div className="flex gap-1 rounded-lg border border-pc-border bg-pc-bg-elevated p-1 text-xs">
              {SORT_OPTIONS.map(({ value, labelKey }) => <button key={value} type="button" onClick={() => setSort(value)} className={`rounded-md px-2.5 py-1.5 transition-colors ${sort === value ? "bg-pc-accent text-pc-bg" : "text-pc-text-secondary hover:text-pc-text"}`}>{t(labelKey)}</button>)}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated">
            <table className="w-full min-w-[760px] text-sm tabular-nums">
              <thead><tr className="border-b border-pc-border text-left text-xs uppercase tracking-wider text-pc-text-muted"><th className="px-4 py-3">{t("generated.stats.role")}</th><th className="px-3 py-3 text-right">{t("generated.stats.average")}</th><th className="px-3 py-3 text-right">{t("generated.stats.p10")}</th><th className="px-3 py-3 text-right">{t("generated.stats.p25")}</th><th className="px-3 py-3 text-right">{t("generated.stats.p75")}</th><th className="px-3 py-3 text-right">{t("generated.stats.p90")}</th><th className="px-3 py-3 text-right">{t("generated.stats.max")}</th><th className="px-4 py-3 text-right">{t("generated.stats.samples")}</th></tr></thead>
              <tbody>{ordered.map((row) => <tr key={row.role} className="border-b border-pc-border/50 last:border-b-0"><th className="px-4 py-3 text-left font-semibold" style={{ color: ROLE_COLORS[row.role] }}>{row.role === "Frontline" ? t("common.roles.frontline") : row.role === "Support" ? t("common.roles.support") : row.role === "Damage" ? t("common.roles.damage") : row.role === "Global" ? t("common.roles.global") : t("common.roles.flank")}</th><td className="px-3 py-3 text-right font-bold text-pc-text">{format(row.avgEcpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p10Ecpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p25Ecpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p75Ecpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.p90Ecpm)}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{format(row.maxEcpm)}</td><td className="px-4 py-3 text-right text-pc-text-muted">{formatNumber(row.sampleSize)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </>}
    </ContentFade>
  );
}
