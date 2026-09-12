/** Render account/champion trends from complete bounded metric observations.
 * Shared controls preserve metric samples and cumulative indexed baselines.
 * refs: endpoints: GET /players/{id}/trends · doc: documents/06-reference/design/frontend-design-system.md
 */
"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LineChartComponent } from "@/components/Chart";
import { EmptyState, ErrorState, LoadingIndicator } from "@/components/async-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useLocalization, type TranslationKey } from "@/lib/localization-context";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getQueueLabel } from "@/lib/queue-labels";
import { chartColors } from "@/lib/chart-colors";
import { getPercentageColor } from "@/lib/stat-quality";
import { fetchPlayerTrends, type PlayerTrendMetric, type PlayerTrends, type PlayerTrendTotals } from "@/lib/player-trends-api";
import { openingTrendTotals, trendMean } from "@/lib/player-trends-state";

type Metric = PlayerTrendMetric | "elo" | "winRate";
const LABELS: Record<Metric, TranslationKey> = {
  elo: "playerTrends.elo", winRate: "common.metrics.winRate", dpm: "common.metrics.dpm",
  wpm: "common.metrics.wpm", apm: "common.metrics.apm", hpm: "common.metrics.hpm",
  shpm: "common.metrics.shpm", spm: "common.metrics.spm", gpm: "common.metrics.gpm",
  egpm: "common.metrics.egpm", kda: "common.metrics.kda", kpm: "common.metrics.kpm", deaths_per_minute: "common.metrics.deathsPerMinute",
};
const control = "pc-surface min-h-10 rounded-lg border border-pc-border px-3 py-2 text-sm text-pc-text focus-visible:outline-2 focus-visible:outline-pc-accent";
const emptyTotal = (championId:number):PlayerTrendTotals=>({championId,matches:0,wins:0,sums:{},samples:{}});

/**
 * Embed localized temporal metrics and all-59 champion comparison controls.
 * I/O: {playerId:string, champions?:boolean} -> React.JSX.Element;
 * performs cancellable read-only API requests when selectors change.
 * refs: endpoints: GET /players/{id}/trends · see: lib/player-trends-api.ts
 * I/O types: `{ playerId, champions = false }: { playerId: string; champions?: boolean } -> JSX.Element`.
 */
export default function PlayerTrendsPanel({ playerId, champions = false, showTitle = true }: { playerId: string; champions?: boolean; showTitle?: boolean }) {
  const { t, formatNumber, formatDate, locale } = useLocalization();
  const searchParams = useSearchParams();
  const titleId = useId();
  const days: 7|30 = searchParams.get("trendDays") === "7" ? 7 : 30;
  const requestedQueue = Number(searchParams.get("trendQueue"));
  const queue = requestedQueue > 0 ? requestedQueue : 486;
  const requestedMetric = searchParams.get("trendMetric") as Metric | null;
  const metric: Metric = requestedMetric && requestedMetric in LABELS ? requestedMetric : "elo";
  const mode: "daily"|"cumulative" = searchParams.get("trendMode") === "cumulative" ? "cumulative" : "daily";
  const selected = useMemo(() => {
    const raw = searchParams.get("trendChampions");
    if (raw == null) return champions ? STATIC_CHAMPIONS.map(c => c.id) : [];
    const available = new Set(STATIC_CHAMPIONS.map(c => c.id));
    return [...new Set(raw.split(",").map(Number).filter(id => available.has(id)))];
  }, [champions, searchParams]);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PlayerTrends|null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  function updateUrl(values: Record<string, string>) {
    const query = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) query.set(key, value);
    window.history.pushState(null, "", `${window.location.pathname}?${query}`);
  }
  useEffect(()=>{
    const controller = new AbortController();
    setLoading(true); setError(false);
    fetchPlayerTrends(playerId,days,queue,selected,controller.signal)
      .then(value=>{ if (!controller.signal.aborted) setData(value); })
      .catch(()=>{ if (!controller.signal.aborted) setError(true); })
      .finally(()=>{ if (!controller.signal.aborted) setLoading(false); });
    return ()=>controller.abort();
  },[playerId,days,queue,selected,retry]);
  const scopes = selected.length ? selected : [0];
  const name = (id:number)=>id===0?t("playerTrends.account"):(STATIC_CHAMPIONS.find(c=>c.id===id)?.name ?? String(id));
  const value = (total:PlayerTrendTotals|undefined):number|null => metric==="elo" ? null : metric==="winRate" ? total && total.matches>0 ? 100*total.wins/total.matches : null : trendMean(total,metric);
  const chart = useMemo(()=>{
    if (!data) return [];
    const totals = new Map(scopes.map(id=>[id,openingTrendTotals(data.totals.find(row=>row.championId===id) ?? emptyTotal(id),data.buckets)]));
    const ratings = new Map<number,number>(data.totals.filter(row=>row.openingElo!=null).map(row=>[row.championId,row.openingElo!]));
    return Array.from({length:data.days},(_,index)=>{
      const date = new Date(new Date(data.from).getTime()+index*86400000).toISOString().slice(0,10);
      const point:Record<string,unknown>={date:new Intl.DateTimeFormat(locale,{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(`${date}T00:00:00Z`))};
      for (const id of scopes) {
        const bucket=data.buckets.find(row=>row.championId===id && row.date===date);
        const total=totals.get(id)!;
        if (bucket) {
          total.matches+=bucket.matches; total.wins+=bucket.wins;
          for (const key of Object.keys(bucket.samples) as PlayerTrendMetric[]) {
            total.sums[key]=(total.sums[key]??0)+(bucket.sums[key]??0);
            total.samples[key]=(total.samples[key]??0)+(bucket.samples[key]??0);
          }
          if (bucket.elo!=null) ratings.set(id,bucket.elo);
        }
        point[name(id)]=metric==="elo" ? ratings.get(id)??null : value(mode==="cumulative" ? total : bucket);
      }
      return point;
    });
  // Localized chart names and metric values intentionally follow current selectors.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[data,selected,metric,mode,t,locale]);
  const queues = [...new Set([486,424,452,469,queue,...(data?.queueIds??[])])];
  const hasData = chart.some(row=>Object.entries(row).some(([key,value])=>key!=="date" && value!=null));
  return <section className="pc-card space-y-4" aria-labelledby={showTitle ? titleId : undefined} aria-label={showTitle ? undefined : t(champions?"playerTrends.championTitle":"playerTrends.title")}>
    {showTitle && <h2 id={titleId} className="pc-heading text-xl">{t(champions?"playerTrends.championTitle":"playerTrends.title")}</h2>}
    <div className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs text-pc-text-secondary">{t("playerTrends.metric")}<select className={control} value={metric} onChange={event=>updateUrl({trendMetric:event.target.value})}>
        {(Object.keys(LABELS) as Metric[]).filter(key=>queue===486 || key!=="elo").map(key=><option key={key} value={key}>{t(LABELS[key])}</option>)}
      </select></label>
      <label className="grid gap-1 text-xs text-pc-text-secondary">{t("playerTrends.queue")}<select className={control} value={queue} onChange={event=>{const next=Number(event.target.value);updateUrl({trendQueue:String(next),...(next!==486&&metric==="elo"?{trendMetric:"winRate"}:{})});}}>
        {queues.map(id=><option key={id} value={id}>{getQueueLabel(id)}</option>)}
      </select></label>
      <SegmentedControl label={t("playerTrends.window")} value={String(days)} onChange={value=>updateUrl({trendDays:value})} items={[{value:"7",label:t("generated.stats.last7Days")},{value:"30",label:t("generated.stats.last30Days")}]} />
      {metric!=="elo" && <SegmentedControl label={t("playerTrends.metric")} value={mode} onChange={value=>updateUrl({trendMode:value})} items={[{value:"daily",label:t("playerTrends.daily")},{value:"cumulative",label:t("playerTrends.cumulative")}]} />}
    </div>
    {champions && <details className="pc-surface rounded-lg p-3"><summary className="cursor-pointer text-sm font-semibold">{t("playerTrends.champions")} ({selected.length}/59)</summary>
      <div className="mt-3 flex flex-wrap gap-2"><input className={control} value={search} onChange={event=>setSearch(event.target.value)} placeholder={t("playerTrends.search")} aria-label={t("playerTrends.search")} />
        <button type="button" className={control} onClick={()=>updateUrl({trendChampions:STATIC_CHAMPIONS.map(c=>c.id).join(",")})}>{t("playerTrends.selectAll")}</button>
        <button type="button" className={control} onClick={()=>updateUrl({trendChampions:""})}>{t("playerTrends.clear")}</button></div>
      <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-auto sm:grid-cols-4 lg:grid-cols-6">{STATIC_CHAMPIONS.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())).map(c=><label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(c.id)} onChange={event=>updateUrl({trendChampions:(event.target.checked?[...selected,c.id]:selected.filter(id=>id!==c.id)).join(",")})} />{c.name}</label>)}</div>
    </details>}
    <p className="text-xs text-pc-text-secondary">{data?.coverage.availableFrom?t("playerTrends.coverage",{date:formatDate(data.coverage.availableFrom)}):t("playerTrends.noCoverage")} · {t(mode==="cumulative"&&metric!=="elo"?"playerTrends.cumulativeHelp":"playerTrends.dailyHelp")}</p>
    {metric==="kpm" && <p className="text-xs text-pc-text-secondary">{t("playerTrends.kpmHelp")}</p>}
    {metric==="deaths_per_minute" && <p className="text-xs text-pc-text-secondary">{t("playerTrends.deathsHelp")}</p>}
    {loading?<LoadingIndicator />:error?<ErrorState title={t("playerTrends.failed")} onRetry={()=>setRetry(value=>value+1)} />:!hasData?<EmptyState title={t("playerTrends.empty")} />:<div className="min-w-0 space-y-3">
      <LineChartComponent data={chart} xKey="date" yKeys={scopes.map(name)} height={300} percentageScale={metric==="winRate"} showLegend={false} showDots={scopes.length<=10} tooltipValueFormatter={raw=>typeof raw==="number"?formatNumber(raw,{minimumFractionDigits:2,maximumFractionDigits:2}):String(raw)} />
      <div className="max-h-32 overflow-y-auto overscroll-contain rounded-lg border border-pc-border p-2 focus-visible:outline-2 focus-visible:outline-pc-accent" role="region" tabIndex={0} aria-label={t(champions?"playerTrends.champions":"playerTrends.account")}>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-pc-text-secondary">{scopes.map((id,index)=><li key={id} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-4 shrink-0" style={{background:metric==="winRate"?`linear-gradient(to right, ${getPercentageColor(0)}, ${getPercentageColor(50)}, ${getPercentageColor(100)})`:chartColors[index%chartColors.length]}} />
          <span>{name(id)}</span>
        </li>)}</ul>
      </div>
    </div>}
    {!loading&&!error&&data&&metric!=="elo"&&<details className="pc-surface rounded-lg p-3"><summary className="cursor-pointer text-sm font-semibold text-pc-text">{t("generated.matches.details")}</summary><div className="mt-2 overflow-x-auto"><table className="w-full whitespace-nowrap text-sm"><thead><tr className="text-left text-xs text-pc-text-secondary"><th className="py-2">{t("playerTrends.champions")}</th><th>{t("playerTrends.current")}</th><th>{t("playerTrends.change")}</th><th>{t("playerTrends.global")}</th><th>{t("playerTrends.samples")}</th></tr></thead><tbody>
      {scopes.map(id=>{const total=data.totals.find(row=>row.championId===id);const current=value(total);const before=total?value(openingTrendTotals(total,data.buckets)):null;const global=value(data.globalTotals.find(row=>row.championId===id));const fmt=(v:number|null)=>v==null?"—":formatNumber(v,{minimumFractionDigits:2,maximumFractionDigits:2});return <tr key={id} className="border-t border-pc-border"><th className="py-2 text-left font-medium">{name(id)}</th><td>{fmt(current)}</td><td>{current==null||before==null?"—":formatNumber(current-before,{minimumFractionDigits:2,maximumFractionDigits:2,signDisplay:"always"})}</td><td>{fmt(global)}</td><td>{formatNumber(metric==="winRate"?total?.matches??0:total?.samples[metric]??0)}</td></tr>;})}
    </tbody></table></div></details>}
  </section>;
}
