"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchItems, type ItemStat } from "@/lib/api-client";
import {
  itemDescriptionAtLevel,
  loadBuildReferenceData,
  type BuildItemCategory,
  type BuildItemReference,
} from "@/lib/build-reference";
import { getStatQuality } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";

function itemIcon(name: string) {
  return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`;
}

function categoryColor(category: BuildItemCategory) {
  return category === "Offense" ? "text-red-400" : category === "Defense" ? "text-blue-400" : category === "Healing" ? "text-emerald-400" : "text-amber-400";
}

export default function ItemsPage() {
  const { t, formatNumber, formatPercent } = useLocalization();
  const formatCount = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
  const [mode, setMode] = useState<"ranked" | "casual">("ranked");
  const [modeReady, setModeReady] = useState(false);
  const [items, setItems] = useState<ItemStat[]>([]);
  const [references, setReferences] = useState<BuildItemReference[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"uses" | "winRate">("uses");

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
    }).catch(() => {
      if (active) setItems([]);
    });
    return () => { active = false; };
  }, [mode, modeReady]);

  const selectMode = (nextMode: "ranked" | "casual") => {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.stats.itemMeta")}</h1>
          <p className="mt-1 text-sm text-pc-text-secondary">{t("generated.stats.browseEveryTrackedItemThenOpenAnItemToSee")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("generated.stats.searchItems")} className="w-full rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-sm text-pc-text outline-none placeholder:text-pc-text-muted focus:border-pc-accent sm:max-w-sm" />
        <div className="flex gap-2 text-xs" aria-label={t("stats.scope.label")}>
          {(["ranked", "casual"] as const).map((value) => <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => selectMode(value)}
            className={`rounded-lg px-3 py-2 ${mode === value ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}
          >
            {t(value === "ranked" ? "stats.scope.ranked" : "stats.scope.casual")}
          </button>)}
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setSort("uses")} className={`rounded-lg px-3 py-2 ${sort === "uses" ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.stats.mostPicked")}</button>
          <button onClick={() => setSort("winRate")} className={`rounded-lg px-3 py-2 ${sort === "winRate" ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.stats.winRate")}</button>
        </div>
      </div>

      {items.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">{t("generated.stats.itemStatsAreUnavailableForThisQueue")}</div> : (
        <div className="pc-card">
          {categories.map((category) => {
            const categoryItems = filtered.filter((item) => categoryFor(item) === category);
            if (categoryItems.length === 0) return null;
            return <section key={category} className="mb-4 last:mb-0">
              <h2 className={`mb-2 text-xs font-bold uppercase tracking-wider ${categoryColor(category)}`}>{category}</h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              {categoryItems.map((item) => {
            const pickRate = itemPickRate(item);
            const quality = getStatQuality(item.winRate, pickRate, maxPickRate);
            const reference = referenceById.get(item.itemId) ?? referenceByName.get(item.itemName.toLowerCase());
            const description = itemDescriptionAtLevel(reference, 1) ?? t("items.overviewFallbackDescription");
            return <Link key={item.itemId} href={`/game/items/${item.itemId}${mode === "casual" ? "?mode=casual" : ""}`} className="pc-surface-light group block rounded-lg border p-3 text-left transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
              <div className="flex items-start gap-3">
                <img src={reference?.iconUrl ?? itemIcon(item.itemName)} alt={item.itemName} className="h-10 w-12 shrink-0 rounded border border-pc-border bg-pc-bg/50 object-contain" />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-0.5 text-xs font-medium text-pc-accent">{item.itemName}</h2>
                  <p className="text-xs leading-relaxed text-pc-text-secondary">{description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span style={{ color: quality.color }}><span className="mr-1 text-pc-text-muted">{t("generated.stats.wr")}</span>{formatPercent(item.winRate)}</span>
                    <span className="text-pc-border">|</span>
                    <span className="text-pc-text-muted"><span className="mr-1">{t("generated.stats.pr")}</span><span style={{ color: quality.color }}>{formatPercent(pickRate)}</span></span>
                    <span className="text-pc-border">|</span>
                    <span className="text-pc-text-muted"><span className="mr-1">{t("generated.stats.purchases")}</span><span style={{ color: quality.color }}>{formatCount(item.totalUsage)}</span></span>
                  </div>
                </div>
              </div>
            </Link>;
              })}
              </div>
            </section>;
          })}
        </div>
      )}
    </div>
  );
}
