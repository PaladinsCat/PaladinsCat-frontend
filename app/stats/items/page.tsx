"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchItems, type ItemStat } from "@/lib/api-client";
import { loadBuildReferenceData, type BuildItemReference } from "@/lib/build-reference";
import { getStatQuality } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";

const CATEGORY_BY_ITEM: Record<string, string> = {
  "Blast Shields": "Defense", Guardian: "Defense", Haven: "Defense", Illuminate: "Defense", Resilience: "Defense", Sentinel: "Defense",
  Chronos: "Utility", Hoard: "Utility", "Master Riding": "Utility", "Morale Boost": "Utility", Nimble: "Utility",
  Bloodbath: "Healing", "Kill to Heal": "Healing", "Life Rip": "Healing", Meditation: "Healing", Rejuvenate: "Healing", Veteran: "Healing",
  Bulldozer: "Offense", "Deft Hands": "Offense", Lethality: "Offense", "Trigger Scent": "Offense", Wrecker: "Offense",
};

function itemIcon(name: string) {
  return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`;
}

function categoryColor(category: string) {
  return category === "Offense" ? "text-red-400" : category === "Defense" ? "text-blue-400" : category === "Healing" ? "text-emerald-400" : "text-amber-400";
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function cleanNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function formatItemDescription(description: string | null | undefined, level = 1): string | null {
  if (!description) return null;
  return description
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/, "")
    .replace(/\{\s*(?:scale\s*=\s*)?(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\|\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/gi, (_match, base: string, increase: string) => (
      cleanNumber(Number(base) + Number(increase) * Math.max(0, level - 1))
    ))
    .replace(/\{\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/g, (_match, value: string) => cleanNumber(Number(value)));
}

function DimensionBars({ label, rows, total }: { label: "S" | "L"; rows: ItemStat["slots"]; total: number }) {
  const { t } = useLocalization();
  if (rows.length === 0) return null;
  const maxUses = Math.max(1, ...rows.map((row) => row.totalUses));
  const maxRate = Math.max(1, ...rows.map((row) => (row.totalUses / Math.max(1, total)) * 100));

  return (
    <div className="mt-1.5">
      <div className="mb-0.5 text-[9px] font-medium text-pc-text-muted">{label === "S" ? t("generated.stats.purchaseSlot") : t("generated.stats.upgradeLevel")}</div>
      <div className="flex items-center gap-1">
        {rows.map((row) => {
          const dimension = label === "S" ? row.slot : row.level;
          const displayDimension = label === "L" ? Number(dimension) + 1 : dimension;
          const rate = (row.totalUses / Math.max(1, total)) * 100;
          const quality = getStatQuality(row.winRate, rate, maxRate);
          return (
            <div
              key={dimension}
              className="flex min-w-0 flex-1 flex-col items-center"
              title={t("generated.stats.value1Value2Value3WinRateValue4PurchaseShareValue5Purchases", { value1: label === "S" ? t("generated.stats.slot") : t("generated.stats.level"), value2: displayDimension ?? "", value3: row.winRate.toFixed(1), value4: rate.toFixed(1), value5: row.totalUses.toLocaleString() })}
            >
              <div className="text-[9px] text-pc-text-muted">{label}{displayDimension}</div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-pc-bg-elevated">
                <div className="h-full rounded-full" style={{ width: `${Math.max(row.totalUses > 0 ? 8 : 0, Math.round((row.totalUses / maxUses) * 100))}%`, background: quality.track }} />
              </div>
              <div className="text-[9px] text-pc-text-muted">{formatCount(row.totalUses)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const { t } = useLocalization();
  const [items, setItems] = useState<ItemStat[]>([]);
  const [references, setReferences] = useState<BuildItemReference[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"uses" | "winRate">("uses");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchItems({ mode: "ranked", limit: 200 }),
      loadBuildReferenceData(0, ""),
    ]).then(([itemStats, reference]) => {
      if (!active) return;
      setItems(itemStats);
      setReferences(reference.items);
    });
    return () => { active = false; };
  }, []);

  const totalUses = items.reduce((sum, item) => sum + item.totalUsage, 0);
  const referenceById = useMemo(() => new Map(references.map((item) => [item.id, item])), [references]);
  const itemPickRate = (item: ItemStat) => item.pickRate ?? (totalUses ? item.totalUsage / totalUses * 100 : 0);
  const maxPickRate = Math.max(1, ...items.map(itemPickRate));
  const filtered = useMemo(() => items
    .filter((item) => item.itemName.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "uses" ? b.totalUsage - a.totalUsage : b.winRate - a.winRate), [items, query, sort]);
  const categories = ["Defense", "Utility", "Healing", "Offense"];

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
        <div className="flex gap-2 text-xs">
          <button onClick={() => setSort("uses")} className={`rounded-lg px-3 py-2 ${sort === "uses" ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.stats.mostPicked")}</button>
          <button onClick={() => setSort("winRate")} className={`rounded-lg px-3 py-2 ${sort === "winRate" ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}>{t("generated.stats.winRate")}</button>
        </div>
      </div>

      {items.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">{t("generated.stats.itemStatsAreUnavailableForThisQueue")}</div> : (
        <div className="pc-card">
          {categories.map((category) => {
            const categoryItems = filtered.filter((item) => (CATEGORY_BY_ITEM[item.itemName] ?? "Utility") === category);
            if (categoryItems.length === 0) return null;
            return <section key={category} className="mb-6 last:mb-0">
              <h2 className={`mb-2 text-xs font-bold uppercase tracking-wider ${categoryColor(category)}`}>{category}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryItems.map((item) => {
            const pickRate = itemPickRate(item);
            const quality = getStatQuality(item.winRate, pickRate, maxPickRate);
            const reference = referenceById.get(item.itemId);
            const description = formatItemDescription(reference?.description, 1) ?? "Ranked purchase performance by slot and upgrade level.";
            return <Link key={item.itemId} href={`/stats/items/${item.itemId}`} className="pc-surface-light group block rounded-lg border p-3 text-left transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
              <div className="flex items-start gap-3">
                <img src={reference?.iconUrl ?? itemIcon(item.itemName)} alt={item.itemName} className="h-10 w-12 shrink-0 rounded border border-pc-border bg-pc-bg/50 object-contain" />
                <div className="min-w-0 flex-1">
                  <h2 className="mb-0.5 text-xs font-medium text-pc-accent">{item.itemName}</h2>
                  <p className="text-xs leading-relaxed text-pc-text-secondary">{description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span style={{ color: quality.color }}><span className="mr-1 text-pc-text-muted">{t("generated.stats.wr")}</span>{item.winRate.toFixed(1)}%</span>
                    <span className="text-pc-border">|</span>
                    <span className="text-pc-text-muted"><span className="mr-1">{t("generated.stats.pr")}</span><span style={{ color: quality.color }}>{pickRate.toFixed(1)}%</span></span>
                    <span className="text-pc-border">|</span>
                    <span className="text-pc-text-muted"><span className="mr-1">{t("generated.stats.purchases")}</span><span style={{ color: quality.color }}>{formatCount(item.totalUsage)}</span></span>
                  </div>
                  <DimensionBars label="S" rows={item.slots} total={item.totalUsage} />
                  <DimensionBars label="L" rows={item.levels} total={item.totalUsage} />
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
