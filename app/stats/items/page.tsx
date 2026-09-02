/**
 * Define the stats items page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchItems, type ItemStat } from "@/lib/api-client";
import {
  loadBuildReferenceData,
  type BuildItemCategory,
  type BuildItemReference,
} from "@/lib/build-reference";
import { getStatQuality } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";
import { ContentFade, EmptyState, ErrorState } from "@/components/async-state";
import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

function itemIcon(name: string) {
  return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`;
}

function categoryColor(category: BuildItemCategory) {
  return category === "Offense" ? "text-red-400" : category === "Defense" ? "text-blue-400" : category === "Healing" ? "text-emerald-400" : "text-amber-400";
}

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function ItemsPage() {
  const { t, formatNumber, formatPercent } = useLocalization();
  const formatCount = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
  const [mode, setMode] = useState<"ranked" | "casual">("ranked");
  const [modeReady, setModeReady] = useState(false);
  const [items, setItems] = useState<ItemStat[]>([]);
  const [references, setReferences] = useState<BuildItemReference[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"uses" | "winRate">("uses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "casual") setMode("casual");
    setModeReady(true);
    loadBuildReferenceData(0, "").then((reference) => setReferences(reference.items));
  }, []);

  useEffect(() => {
    if (!modeReady) return;
    let active = true;
    fetchItems({ mode, limit: 200 }).then((itemStats) => {
      if (!active) return;
      setItems(itemStats);
      setError(false);
    }).catch(() => {
      if (active) {
        setItems([]);
        setError(true);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [mode, modeReady]);

  const selectMode = (nextMode: "ranked" | "casual") => {
    if (nextMode === mode) return;
    setLoading(true);
    setError(false);
    setMode(nextMode);
    const url = new URL(window.location.href);
    if (nextMode === "ranked") url.searchParams.delete("mode");
    else url.searchParams.set("mode", nextMode);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  };

  const totalUses = items.reduce((sum, item) => sum + item.totalUsage, 0);
  const referenceById = useMemo(() => new Map(references.map((item) => [item.id, item])), [references]);
  const referenceByName = useMemo(() => new Map(references.map((item) => [item.name.toLowerCase(), item])), [references]);
  const categoryFor = (item: ItemStat): BuildItemCategory => referenceById.get(item.itemId)?.category ?? referenceByName.get(item.itemName.toLowerCase())?.category ?? "Utility";
  const itemPickRate = (item: ItemStat) => item.pickRate ?? (totalUses ? item.totalUsage / totalUses * 100 : 0);
  const maxPickRate = Math.max(1, ...items.map(itemPickRate));
  const filtered = useMemo(() => items
    .filter((item) => item.itemName.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "uses" ? b.totalUsage - a.totalUsage : b.winRate - a.winRate), [items, query, sort]);
  const categories: BuildItemCategory[] = ["Defense", "Utility", "Healing", "Offense"];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="pc-heading pc-heading-lg">{t("generated.stats.itemMeta")}</h1>
      </header>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(16rem,1fr)_auto_auto]">
        <label className="text-xs text-pc-text-secondary">
          {t("generated.stats.searchItems")}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("generated.stats.searchItems")} className="pc-input mt-1.5" />
        </label>
        <div>
          <span className="block text-xs text-pc-text-secondary">{t("stats.scope.label")}</span>
          <div className="mt-1.5 flex gap-2 text-xs" role="group" aria-label={t("stats.scope.label")}>
            {(["ranked", "casual"] as const).map((value) => <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => selectMode(value)}
              className={`rounded-lg px-3 py-2 font-medium transition-colors ${mode === value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}
            >
              {t(value === "ranked" ? "stats.scope.ranked" : "stats.scope.casual")}
            </button>)}
          </div>
        </div>
        <div>
          <span className="block text-xs text-pc-text-secondary">{t("skins.sortBy")}</span>
          <div className="mt-1.5 flex gap-2 text-xs" role="group" aria-label={t("skins.sortBy")}>
            <button type="button" aria-pressed={sort === "uses"} onClick={() => setSort("uses")} className={`rounded-lg px-3 py-2 font-medium transition-colors ${sort === "uses" ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.stats.mostPicked")}</button>
            <button type="button" aria-pressed={sort === "winRate"} onClick={() => setSort("winRate")} className={`rounded-lg px-3 py-2 font-medium transition-colors ${sort === "winRate" ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.stats.winRate")}</button>
          </div>
        </div>
      </div>

      {loading && items.length === 0 && <ItemsSkeleton label={t("async.loading")} />}
      {!loading && error && <ErrorState message={t("generated.stats.itemStatsAreUnavailableForThisQueue")} />}
      {!loading && !error && items.length === 0 && <EmptyState title={t("generated.stats.itemStatsAreUnavailableForThisQueue")} />}
      {items.length > 0 && (
        <ContentFade className={`space-y-6 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
          {categories.map((category) => {
            const categoryItems = filtered.filter((item) => categoryFor(item) === category);
            if (categoryItems.length === 0) return null;
            return <section key={category}>
              <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${categoryColor(category)}`}>{category}</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {categoryItems.map((item) => {
            const pickRate = itemPickRate(item);
            const quality = getStatQuality(item.winRate, pickRate, maxPickRate);
            const reference = referenceById.get(item.itemId) ?? referenceByName.get(item.itemName.toLowerCase());
            return <Link key={item.itemId} href={`/game/items/${item.itemId}${mode === "casual" ? "?mode=casual" : ""}`} className="pc-surface-light group block rounded-xl border border-pc-border p-2.5 text-left transition-colors hover:border-pc-accent-mid">
              <div className="flex items-center gap-2">
                <img src={reference?.iconUrl ?? itemIcon(item.itemName)} alt={item.itemName} className="h-12 w-12 shrink-0 rounded-lg object-contain" />
                <h3 className="min-w-0 text-sm font-semibold text-pc-text transition-colors group-hover:text-pc-accent">{item.itemName}</h3>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-xs tabular-nums">
                <span><span className="block text-pc-text-muted">{t("generated.stats.wr")}</span><strong style={{ color: quality.color }}>{formatPercent(item.winRate)}</strong></span>
                <span><span className="block text-pc-text-muted">{t("generated.stats.pr")}</span><strong style={{ color: quality.color }}>{formatPercent(pickRate)}</strong></span>
                <span><span className="block text-pc-text-muted">{t("generated.stats.purchases")}</span><strong style={{ color: quality.color }}>{formatCount(item.totalUsage)}</strong></span>
              </div>
            </Link>;
              })}
              </div>
            </section>;
          })}
        </ContentFade>
      )}
    </div>
  );
}

function ItemsSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      <Skeleton className="h-3 w-20" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index} className="rounded-xl border border-pc-border p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-12 w-12 shrink-0" />
              <SkeletonLine className="w-2/5" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <SkeletonLine />
              <SkeletonLine />
              <SkeletonLine />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
