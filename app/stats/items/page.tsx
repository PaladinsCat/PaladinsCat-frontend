"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchItems, type ItemStat } from "@/lib/api-client";
import { getStatQuality } from "@/lib/stat-quality";

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

function RateStrip({ label, rows, total }: { label: "S" | "L"; rows: ItemStat["slots"]; total: number }) {
  if (rows.length === 0) return null;
  return <div className="mt-1.5 flex min-w-0 gap-1 text-[8px] leading-none">
    <span className="pt-0.5 font-bold text-pc-text-muted">{label}</span>
    {rows.map((row) => {
      const dimension = label === "S" ? row.slot : row.level;
      const rate = row.totalUses / Math.max(1, total) * 100;
      return <span key={dimension} className="min-w-0 truncate rounded bg-pc-bg px-1 py-0.5 text-pc-text-secondary" title={`${label === "S" ? "Buy" : "Level"} ${dimension}: ${row.winRate.toFixed(1)}% win rate, ${rate.toFixed(1)}% of purchases`}>
        {label}{dimension} <span className="text-pc-text">{row.winRate.toFixed(0)}</span><span className="text-pc-text-muted">/{rate.toFixed(0)}</span>
      </span>;
    })}
  </div>;
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemStat[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"uses" | "winRate">("uses");

  useEffect(() => {
    fetchItems({ mode: "ranked", limit: 200 }).then(setItems);
  }, []);

  const totalUses = items.reduce((sum, item) => sum + item.totalUsage, 0);
  const maxUses = Math.max(1, ...items.map((item) => item.totalUsage));
  const filtered = useMemo(() => items
    .filter((item) => item.itemName.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === "uses" ? b.totalUsage - a.totalUsage : b.winRate - a.winRate), [items, query, sort]);
  const categories = ["Defense", "Utility", "Healing", "Offense"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">Item Meta</h1>
          <p className="mt-1 text-sm text-pc-text-secondary">Browse every tracked item, then open an item to see its purchase order and upgrade performance.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items" className="w-full rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-sm text-pc-text outline-none placeholder:text-pc-text-muted focus:border-pc-accent sm:max-w-sm" />
        <div className="flex gap-2 text-xs">
          <button onClick={() => setSort("uses")} className={`rounded-lg px-3 py-2 ${sort === "uses" ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}>Most picked</button>
          <button onClick={() => setSort("winRate")} className={`rounded-lg px-3 py-2 ${sort === "winRate" ? "bg-pc-accent text-pc-bg" : "bg-pc-card text-pc-text-secondary hover:text-pc-text"}`}>Win rate</button>
        </div>
      </div>

      {items.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">Item stats are unavailable for this queue.</div> : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = filtered.filter((item) => (CATEGORY_BY_ITEM[item.itemName] ?? "Utility") === category);
            if (categoryItems.length === 0) return null;
            return <section key={category}>
              <h2 className={`mb-2 text-xs font-bold uppercase tracking-wider ${categoryColor(category)}`}>{category}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {categoryItems.map((item) => {
            const pickRate = totalUses ? item.totalUsage / totalUses * 100 : 0;
            const quality = getStatQuality(item.winRate, 1, 1);
            return <Link key={item.itemId} href={`/stats/items/${item.itemId}`} className="group rounded-lg border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
              <div className="flex gap-2">
                <img src={itemIcon(item.itemName)} alt="" className="h-10 w-10 shrink-0 rounded-md object-contain" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{item.itemName}</h2>
                  <div className="mt-0.5 text-[11px]" style={{ color: quality.color }}>{item.winRate.toFixed(1)}% WR <span className="text-pc-text-muted">· {pickRate.toFixed(1)}% rate</span></div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-pc-bg"><div className="h-full rounded-full" style={{ width: `${Math.max(4, item.totalUsage / maxUses * 100)}%`, background: quality.track }} /></div>
                  <div className="mt-1 text-[9px] text-pc-text-muted">{item.totalUsage.toLocaleString()} purchases</div>
                  <RateStrip label="S" rows={item.slots} total={item.totalUsage} />
                  <RateStrip label="L" rows={item.levels} total={item.totalUsage} />
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
