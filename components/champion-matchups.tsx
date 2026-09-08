/** Browse all champion opponents with explicit sample and queue context.
 * Uses canonical page surfaces and shared localization; filters are shareable.
 * refs: see: lib/champion-matchups-api.ts · documents/06-reference/frontend-design-system.md
 */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { fetchChampions, type Champion } from "@/lib/api-client";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";
import { fetchChampionMatchups, type ChampionMatchups as MatchupData } from "@/lib/champion-matchups-api";

/**
 * Render an interactive roster and opposing-talent results.
 * I/O types: `{initialSlug?: string}` -> `React.JSX.Element`; fetches aggregate data only.
 * refs: endpoints: GET /stats/champions/{champion_id}/matchups
 */
export default function ChampionMatchups({initialSlug}: {initialSlug?: string}): React.JSX.Element {
  const router = useRouter();
  const {t, formatNumber, formatPercent} = useLocalization();
  const [roster,setRoster] = useState<Champion[]>([]);
  const [champion,setChampion] = useState(0);
  const [talent,setTalent] = useState(0);
  const [queue,setQueue] = useState(486);
  const [days,setDays] = useState(30);
  const [search,setSearch] = useState("");
  const [data,setData] = useState<MatchupData|null>(null);
  const [error,setError] = useState(false);
  const [loading,setLoading] = useState(true);
  const [retry,setRetry] = useState(0);
  useEffect(()=>{
    let live=true;
    fetchChampions().then(rows=>{
      if(!live)return;
      // Native history updates can rerender with the previous server route prop.
      // Read the current URL after the asynchronous roster request, not that prop.
      const currentUrl=new URL(window.location.href);
      const query=currentUrl.searchParams;
      const currentSlug=decodeURIComponent(currentUrl.pathname.split("/")[3]??"");
      const q=Number(query.get("queueId")), d=Number(query.get("days"));
      setQueue([486,424,452].includes(q)?q:486);
      setDays([7,30,90,365].includes(d)?d:30);
      setTalent(Math.max(0,Number(query.get("talentId"))||0));
      setRoster(rows);
      const selected=rows.find(c=>championSlug(c.name)===currentSlug);
      setChampion(Number((selected??rows[0])?.id??0));
      if(!rows.length){setError(true);setLoading(false);}
    }).catch(()=>{if(live){setError(true);setLoading(false);}});
    return()=>{live=false;};
  },[initialSlug,retry]);
  useEffect(()=>{
    if(!champion)return;
    const controller=new AbortController();
    setLoading(true);setError(false);
    fetchChampionMatchups(champion,talent,queue,days,controller.signal)
      .then(result=>{if(!controller.signal.aborted){setData(result);setError(false);}})
      .catch(()=>{if(!controller.signal.aborted)setError(true);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[champion,talent,queue,days,retry]);
  function update(next:{champion?:number;talent?:number;queue?:number;days?:number}) {
    const c=next.champion??champion, tl=next.talent??talent, q=next.queue??queue, d=next.days??days;
    setLoading(true);setError(false);
    if(c!==champion)setData(null);
    setChampion(c);setTalent(tl);setQueue(q);setDays(d);
    const selected=roster.find(row=>Number(row.id)===c);
    const query=new URLSearchParams({queueId:String(q),days:String(d)});
    if(tl)query.set("talentId",String(tl));
    router.push(`/stats/champions/${championSlug(selected?.name??"")}?${query}`, { scroll: false });
  }
  const opponents=roster.filter(c=>Number(c.id)!==champion&&c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedData=data&&Number(data.championId)===champion&&(data.talentId??0)===talent&&data.queueId===queue&&data.days===days?data:null;
  const coverage=selectedData?.rows.map(row=>row.coverage_from).sort()[0];
  return <div className="space-y-6">
    <PageHeader parentHref="/stats" parentLabel={t("stats.matchups.directory")} title={t("stats.matchups.title")} description={t("stats.matchups.description")} />
    <div className="pc-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-2 text-sm">{t("stats.matchups.champion")}<select className="pc-input w-full" value={champion} onChange={e=>update({champion:Number(e.target.value),talent:0})}>{roster.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="space-y-2 text-sm">{t("stats.matchups.talent")}<select className="pc-input w-full" value={talent} onChange={e=>update({talent:Number(e.target.value)})}><option value={0}>{t("stats.matchups.allTalents")}</option>{selectedData?.talents.map(row=><option key={row.talent_id} value={row.talent_id}>{row.talent_name}</option>)}</select></label>
      <label className="space-y-2 text-sm">{t("stats.matchups.queue")}<select className="pc-input w-full" value={queue} onChange={e=>update({queue:Number(e.target.value)})}><option value={486}>{t("stats.matchups.ranked")}</option><option value={424}>{t("stats.matchups.siege")}</option><option value={452}>{t("stats.matchups.onslaught")}</option></select></label>
      <label className="space-y-2 text-sm">{t("stats.matchups.window")}<select className="pc-input w-full" value={days} onChange={e=>update({days:Number(e.target.value)})}>{[7,30,90,365].map(n=><option key={n} value={n}>{formatNumber(n)}</option>)}</select></label>
    </div>
    <p className="text-sm text-pc-text-secondary">{t("stats.matchups.context")}{coverage&&<> {t("stats.matchups.coverage")}: {coverage.slice(0,10)}.</>}</p>
    <label className="block text-sm">{t("stats.matchups.search")}<input className="pc-input mt-2 w-full" value={search} onChange={e=>setSearch(e.target.value)} /></label>
    {loading&&<p role="status">{t("stats.matchups.loading")}</p>}
    {error&&<div role="alert" className="pc-card p-4">{t("stats.matchups.error")} <button className="pc-button" onClick={()=>{setLoading(true);setError(false);setRetry(n=>n+1);}}>{t("stats.matchups.retry")}</button></div>}
    {!loading&&!error&&(opponents.length===0||selectedData?.rows.length===0)&&<p className="pc-card p-4 text-sm text-pc-text-secondary">{t("stats.matchups.empty")}</p>}
    {!loading&&!error&&opponents.length>0&&Boolean(selectedData?.rows.length)&&<div className="grid gap-3 lg:grid-cols-2">{opponents.map(opponent=>{
      const rows=selectedData?.rows.filter(row=>Number(row.opponent_champion_id)===Number(opponent.id))??[];
      const samples=rows.reduce((n,row)=>n+Number(row.samples),0);
      return <details key={opponent.id} className="pc-card p-4">
        <summary className="cursor-pointer font-semibold">{opponent.name}<span className="ml-3 text-sm font-normal text-pc-text-secondary">{formatNumber(samples)} {t("stats.matchups.samples")}</span></summary>
        {rows.length?<div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="py-2">{t("stats.matchups.talent")}</th><th>{t("stats.matchups.rate")}</th><th>{t("stats.matchups.wins")}</th><th>{t("stats.matchups.samples")}</th></tr></thead><tbody>{rows.map(row=><tr key={row.opponent_talent_id} className="border-t border-white/10"><td className="py-3">{row.opponent_talent_name}{Number(row.samples)<30&&<span className="block text-xs text-pc-text-secondary">{t("stats.matchups.lowSample")}</span>}</td><td>{row.win_rate===null?"—":formatPercent(Number(row.win_rate),{maximumFractionDigits:1})}</td><td>{formatNumber(Number(row.wins))}</td><td>{formatNumber(Number(row.samples))}</td></tr>)}</tbody></table></div>:<p className="mt-3 text-sm text-pc-text-secondary">{t("stats.matchups.empty")}</p>}
        <Link className="mt-3 inline-block text-sm text-pc-accent" href={`/champions/${championSlug(opponent.name)}`}>{opponent.name}</Link>
      </details>;
    })}</div>}
  </div>;
}
