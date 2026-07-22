"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchItemDetail, fetchItems, type ItemDetailStats, type ItemStat } from "@/lib/api-client";
import { loadBuildReferenceData, type BuildItemCategory, type BuildItemReference } from "@/lib/build-reference";
import { getStatQuality } from "@/lib/stat-quality";
import ContextBackLink from "@/components/context-back-link";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`; }
function weightedWinRate(items: ItemStat[]) {
  const total = items.reduce((sum, item) => sum + item.totalUsage, 0);
  return total > 0 ? items.reduce((sum, item) => sum + item.winRate * item.totalUsage, 0) / total : null;
}
function relativeDifference(value: number, baseline: number | null) {
  return baseline && baseline > 0 ? ((value - baseline) / baseline) * 100 : null;
}

type ChampionRole = "Frontline" | "Damage" | "Flank" | "Support";

const CHAMPION_ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

export default function ItemDetailPage() {
  const { t, formatNumber, formatPercent: percent, formatRecord, formatSignedPercent: signedPercent } = useLocalization();
  const formatCount = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
  const params = useParams<{ itemId: string }>();
  const [detail, setDetail] = useState<ItemDetailStats | null>(null);
  const [items, setItems] = useState<ItemStat[]>([]);
  const [references, setReferences] = useState<BuildItemReference[]>([]);
  const [selectedRole, setSelectedRole] = useState<ChampionRole | null>(null);
  const [loaded, setLoaded] = useState(false);
  const displayLoading = useRouteSettledLoading(!loaded);
  const itemId = Number(params.itemId);

  useEffect(() => {
    let active = true;
    loadBuildReferenceData(0, "").then((reference) => {
      if (!active) return;
      setReferences(reference.items);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    if (!Number.isInteger(itemId)) {
      setDetail(null);
      setLoaded(true);
      return () => { active = false; };
    }
    Promise.all([
      fetchItemDetail(itemId, "ranked", selectedRole ? { role: selectedRole } : undefined),
      fetchItems({ mode: "ranked", limit: 200, role: selectedRole ?? undefined, summary: selectedRole != null }),
    ]).then(([nextDetail, nextItems]) => {
      if (!active) return;
      setDetail(nextDetail);
      setItems(nextItems);
    }).finally(() => {
      if (active) setLoaded(true);
    });
    return () => { active = false; };
  }, [itemId, selectedRole]);
  const matrix = useMemo(() => new Map((detail?.breakdown ?? []).map((row) => [`${row.slot}-${row.level}`, row])), [detail]);
  const referenceById = useMemo(() => new Map(references.map((item) => [item.id, item])), [references]);
  const referenceByName = useMemo(() => new Map(references.map((item) => [item.name.toLowerCase(), item])), [references]);
  const categoryFor = (item: ItemStat): BuildItemCategory => referenceById.get(item.itemId)?.category ?? referenceByName.get(item.itemName.toLowerCase())?.category ?? "Utility";
  const currentCategory = detail ? referenceById.get(detail.itemId)?.category ?? referenceByName.get(detail.itemName.toLowerCase())?.category ?? "Utility" : "Utility";

  if (!detail) return displayLoading ? <RouteSkeleton variant="detail" /> : <div className="pc-card py-12 text-center text-sm text-pc-text-secondary">{t("generated.stats.noItemStatisticsAreAvailableForThisQueue")}</div>;
  const overallQuality = getStatQuality(detail.winRate, 1, 1);
  const chartSlots = [...detail.slots].sort((a, b) => Number(a.slot) - Number(b.slot));
  const chartLevels = [...detail.levels].sort((a, b) => Number(b.level) - Number(a.level));
  const maxCellUses = Math.max(1, ...detail.breakdown.map((cell) => cell.totalUses));
  const classAverage = weightedWinRate(items.filter((item) => categoryFor(item) === currentCategory));
  const globalAverage = weightedWinRate(items);
  const vsClass = relativeDifference(detail.winRate, classAverage);
  const vsGlobal = relativeDifference(detail.winRate, globalAverage);
  return <div className="space-y-6">
    <div><ContextBackLink fallbackHref="/game/items" label={t("generated.stats.back")} /></div>
    <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-5" style={{ borderColor: overallQuality.borderColor }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><img src={itemIcon(detail.itemName)} alt="" className="h-16 w-16 rounded-lg object-contain" /><div className="min-w-0 flex-1"><h1 className="pc-heading pc-heading-lg text-pc-accent">{detail.itemName}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("generated.stats.rankedItemPerformanceByPurchaseSlotAndFinalUpgradeLevel")}</p></div><div className="grid w-full grid-cols-2 gap-3 text-left sm:w-auto sm:grid-cols-3 sm:gap-5 sm:text-right"><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.winRate")}</div><div className="text-xl font-bold" style={{ color: overallQuality.color }}>{percent(detail.winRate)}</div><div className="mt-1 flex flex-wrap gap-x-2 text-xs sm:justify-end"><span className={vsClass != null && vsClass >= 0 ? "text-emerald-400" : "text-red-400"}>{signedPercent(vsClass)} {t("generated.stats.vsClass")} <span className="text-pc-text-muted">({currentCategory})</span></span><span className={vsGlobal != null && vsGlobal >= 0 ? "text-emerald-400" : "text-red-400"}>{signedPercent(vsGlobal)} {t("generated.stats.vsGlobal")}</span></div></div><div><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.purchases")}</div><div className="text-xl font-bold text-pc-text">{formatNumber(detail.totalUses)}</div></div><div className="col-span-2 sm:col-span-1"><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.record")}</div><div className="text-sm font-semibold text-pc-text">{formatRecord(detail.wins, detail.losses)}</div></div></div></div>
    </section>
    <section className="pc-card">
      <div className="mb-4 border-b border-pc-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button aria-pressed={selectedRole == null} onClick={() => setSelectedRole(null)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${selectedRole == null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.champions.all")}</button>
          {CHAMPION_ROLES.map((role) => <button key={role.value} aria-pressed={selectedRole === role.value} onClick={() => setSelectedRole(selectedRole === role.value ? null : role.value)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${selectedRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
        </div>
      </div>
      <div className="pc-section-heading mb-1">
        <h2 className="pc-card-title mb-0">{t("generated.stats.slotLevel")}</h2>
        <span className="text-xs text-pc-text-muted">{t("generated.stats.winRatePurchaseCount")}</span>
      </div>
      <p className="mb-4 text-xs text-pc-text-secondary">{t("generated.stats.theCompleteBreakdownShowsHowEarlyAnItemWasBought")}</p>
      <div className="overflow-x-auto pb-1">
        <div>
          <div
            className="grid gap-1 sm:gap-2"
            style={{ gridTemplateColumns: `minmax(4.75rem, auto) repeat(${Math.max(chartSlots.length, 1)}, minmax(2.75rem, 1fr))` }}
          >
            {chartLevels.map((level) => (
              <div key={level.level} className="contents">
                <div className="flex min-w-0 flex-col items-end justify-center pr-1 text-right text-xs sm:pr-2">
                  <span className="font-semibold text-pc-text-secondary">{t("generated.stats.levelValue1", { value1: Number(level.level) + 1 })}</span>
                  <span className="font-mono font-bold" style={{ color: getStatQuality(level.winRate, 1, 1).color }}>{percent(level.winRate)}</span>
                  <span className="text-pc-text-muted">{formatCount(level.totalUses)}</span>
                </div>
                {chartSlots.map((slot) => {
                  const cell = matrix.get(`${slot.slot}-${level.level}`);
                  if (!cell) return <div key={slot.slot} className="flex min-h-20 min-w-0 items-center justify-center rounded-lg border border-pc-border/50 bg-pc-bg-elevated text-xs text-pc-text-muted">—</div>;
                  const quality = getStatQuality(cell.winRate, 1, 1);
                  return (
                    <div key={slot.slot} className="min-h-20 min-w-0 rounded-lg border bg-pc-bg-secondary/50 p-1 text-center sm:p-2.5" style={{ borderColor: quality.borderColor }}>
                      <div className="font-mono text-sm font-bold" style={{ color: quality.color }}>{percent(cell.winRate)}</div>
                      <div className="mx-auto mt-2 h-1.5 w-full max-w-32 overflow-hidden rounded-full bg-pc-bg-elevated">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(8, cell.totalUses / maxCellUses * 100)}%`, background: quality.track }} />
                      </div>
                      <div className="mt-1.5 break-words text-xs text-pc-text-muted">{formatNumber(cell.totalUses)} {t("generated.stats.purchases.d29d2db")}</div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div aria-hidden="true" />
            {chartSlots.map((slot) => (
              <div key={slot.slot} className="min-w-0 pt-1 text-center text-xs">
                <div className="font-semibold text-pc-text-secondary">{t("generated.stats.slotValue1", { value1: slot.slot ?? "" })}</div>
                <div className="font-mono font-bold" style={{ color: getStatQuality(slot.winRate, 1, 1).color }}>{percent(slot.winRate)}</div>
                <div className="text-pc-text-muted">{formatCount(slot.totalUses)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 pl-20 text-center text-xs font-semibold uppercase tracking-wider text-pc-text-muted">
            {t("generated.stats.purchaseSlot")}
          </div>
        </div>
      </div>
    </section>
  </div>;
}
