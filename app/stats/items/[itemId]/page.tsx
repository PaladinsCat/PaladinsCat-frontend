"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchItemDetail, type ItemDetailStats, type ItemDimensionStat } from "@/lib/api-client";
import { getStatQuality } from "@/lib/stat-quality";
import ContextBackLink from "@/components/context-back-link";

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`; }
function percent(value: number) { return `${value.toFixed(1)}%`; }

function DimensionBars({ rows, label, total }: { rows: ItemDimensionStat[]; label: "Slot" | "Level"; total: number }) {
  const maxUses = Math.max(1, ...rows.map((row) => row.totalUses));
  return <div className="flex gap-2">
    {rows.map((row) => {
      const rate = row.totalUses / Math.max(1, total) * 100;
      const quality = getStatQuality(row.winRate, 1, 1);
      const dimension = label === "Slot" ? row.slot : row.level;
      return <div key={dimension} className="min-w-0 flex-1 rounded-lg border border-pc-border bg-pc-card/60 p-2 text-center">
        <div className="text-[10px] text-pc-text-muted">{label === "Slot" ? `Slot ${dimension}` : `Level ${Number(dimension) + 1}`}</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-pc-bg-elevated"><div className="h-full rounded-full" style={{ width: `${Math.max(row.totalUses ? 8 : 0, row.totalUses / maxUses * 100)}%`, background: quality.track }} /></div>
        <div className="mt-1 text-xs font-bold tabular-nums" style={{ color: quality.color }}>{percent(row.winRate)}</div>
        <div className="text-[9px] text-pc-text-muted">{percent(rate)} rate</div>
        <div className="text-[9px] text-pc-text-muted">{row.totalUses.toLocaleString()}</div>
      </div>;
    })}
  </div>;
}

export default function ItemDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [detail, setDetail] = useState<ItemDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const itemId = Number(params.itemId);
  useEffect(() => { setLoaded(false); if (Number.isInteger(itemId)) fetchItemDetail(itemId).then(setDetail).finally(() => setLoaded(true)); }, [itemId]);
  const matrix = useMemo(() => new Map((detail?.breakdown ?? []).map((row) => [`${row.slot}-${row.level}`, row])), [detail]);

  if (!detail) return <div className="pc-card py-12 text-center text-sm text-pc-text-secondary">{loaded ? "No item statistics are available for this queue." : "Loading item statistics…"}</div>;
  const overallQuality = getStatQuality(detail.winRate, 1, 1);
  return <div className="space-y-6">
    <div><ContextBackLink fallbackHref="/stats/items" label="Back" /></div>
    <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-5" style={{ borderColor: overallQuality.borderColor }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><img src={itemIcon(detail.itemName)} alt="" className="h-16 w-16 rounded-lg object-contain" /><div className="min-w-0 flex-1"><h1 className="pc-heading pc-heading-lg text-pc-accent">{detail.itemName}</h1><p className="mt-1 text-sm text-pc-text-secondary">Ranked item performance by purchase slot and final upgrade level.</p></div><div className="grid w-full grid-cols-2 gap-3 text-left sm:w-auto sm:grid-cols-3 sm:gap-5 sm:text-right"><div><div className="text-[10px] uppercase text-pc-text-muted">Win rate</div><div className="text-xl font-bold" style={{ color: overallQuality.color }}>{percent(detail.winRate)}</div></div><div><div className="text-[10px] uppercase text-pc-text-muted">Purchases</div><div className="text-xl font-bold text-pc-text">{detail.totalUses.toLocaleString()}</div></div><div className="col-span-2 sm:col-span-1"><div className="text-[10px] uppercase text-pc-text-muted">Record</div><div className="text-sm font-semibold text-pc-text">{detail.wins.toLocaleString()}W / {detail.losses.toLocaleString()}L</div></div></div></div>
    </section>
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="pc-card"><h2 className="pc-card-title">Purchase slot</h2><p className="mb-3 text-xs text-pc-text-secondary">Rate is this item’s share of its observed purchases in each slot.</p><DimensionBars rows={detail.slots} label="Slot" total={detail.totalUses} /></div><div className="pc-card"><h2 className="pc-card-title">Upgrade level</h2><p className="mb-3 text-xs text-pc-text-secondary">Rate is this item’s share of observations ending at each level.</p><DimensionBars rows={detail.levels} label="Level" total={detail.totalUses} /></div></section>
        <section className="pc-card"><div className="pc-section-heading mb-1"><h2 className="pc-card-title mb-0">Slot × level</h2><span className="text-[10px] text-pc-text-muted">Win rate · purchase count</span></div><p className="mb-4 text-xs text-pc-text-secondary">The complete breakdown shows how early an item was bought and how far it was upgraded in the same match.</p>
          <div className="space-y-2 sm:hidden">{detail.slots.map((slot) => <article key={slot.slot} className="rounded-xl border border-pc-border bg-pc-bg-secondary/50 p-3"><div className="mb-2 text-xs font-semibold text-pc-text">Slot {slot.slot}</div><div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(detail.levels.length, 1)}, minmax(0, 1fr))` }}>{detail.levels.map((level) => { const cell = matrix.get(`${slot.slot}-${level.level}`); const quality = cell ? getStatQuality(cell.winRate, 1, 1) : null; return <div key={level.level} className="rounded-lg border border-pc-border/60 bg-pc-bg-elevated p-2 text-center"><div className="text-[9px] text-pc-text-muted">Level {Number(level.level) + 1}</div><div className="mt-1 truncate font-mono text-xs font-semibold" style={{ color: quality?.color }}>{cell ? percent(cell.winRate) : "—"}</div><div className="mt-0.5 truncate text-[9px] text-pc-text-muted">{cell ? cell.totalUses.toLocaleString() : "0"}</div></div>; })}</div></article>)}</div>
          <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[520px] text-center text-xs"><thead><tr className="border-b border-pc-border text-pc-text-muted"><th className="px-3 py-2 text-left">Slot</th>{detail.levels.map((level) => <th key={level.level} className="px-3 py-2">Level {Number(level.level) + 1}</th>)}</tr></thead><tbody>{detail.slots.map((slot) => <tr key={slot.slot} className="border-b border-pc-border/50"><th className="px-3 py-3 text-left font-medium text-pc-text">Slot {slot.slot}</th>{detail.levels.map((level) => { const cell = matrix.get(`${slot.slot}-${level.level}`); if (!cell) return <td key={level.level} className="px-3 py-3 text-pc-text-muted">—</td>; const quality = getStatQuality(cell.winRate, 1, 1); return <td key={level.level} className="px-3 py-3"><div className="font-semibold" style={{ color: quality.color }}>{percent(cell.winRate)}</div><div className="text-[10px] text-pc-text-muted">{cell.totalUses.toLocaleString()}</div></td>; })}</tr>)}</tbody></table></div>
        </section>
  </div>;
}
