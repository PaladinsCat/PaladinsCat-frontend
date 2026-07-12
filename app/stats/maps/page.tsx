"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SmartImage from "@/components/SmartImage";
import { fetchMapStats, type MapStat } from "@/lib/api-client";
import { mapImagePath } from "@/lib/map-images";

function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

export default function MapsPage() {
  const [maps, setMaps] = useState<MapStat[]>([]);
  useEffect(() => { fetchMapStats({ queueId: 486, limit: 100 }).then(setMaps); }, []);

  return <div className="space-y-6">
    <div><Link href="/stats" className="text-sm text-pc-text-secondary hover:text-pc-accent">← Global Stats</Link><h1 className="mt-3 pc-heading pc-heading-lg text-pc-accent">Map Stats</h1><p className="mt-1 text-sm text-pc-text-secondary">Ranked map distribution, champion drafts, talents, and item choices.</p></div>
    {maps.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">Map stats unavailable.</div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {maps.map((map) => <Link key={map.name} href={`/stats/maps/${encodeURIComponent(map.name)}`} className="group overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated transition-colors hover:border-pc-accent-mid"><div className="relative h-36 overflow-hidden bg-pc-bg"><SmartImage src={mapImagePath(map.name)} alt="" className="h-full w-full object-cover opacity-75 transition-transform duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-pc-bg-elevated via-pc-bg-elevated/10 to-transparent" /><h2 className="absolute bottom-3 left-4 right-4 truncate text-base font-bold text-pc-text group-hover:text-pc-accent">{map.name.replace(/^Ranked\s+/, "")}</h2></div><div className="grid grid-cols-3 gap-2 p-3 text-center text-xs"><div><div className="text-[9px] uppercase text-pc-text-muted">Map Share</div><div className="font-bold text-pc-accent">{map.distributionRate.toFixed(1)}%</div></div><div><div className="text-[9px] uppercase text-pc-text-muted">Avg. Time</div><div className="font-medium text-pc-text">{duration(map.avgDurationSeconds)}</div></div><div><div className="text-[9px] uppercase text-pc-text-muted">Matches</div><div className="font-medium text-pc-text">{map.totalMatches.toLocaleString()}</div></div></div></Link>)}
    </div>}
  </div>;
}
