/** tier-list-board component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
import { getChampionIconSafe } from "@/lib/champion-icons";
import type { TierListEntry, TierName } from "@/lib/tierlists-api";

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export const TIER_ORDER: TierName[] = ["S", "A", "B", "C", "D", "F"];

const TIER_TONES: Record<TierName, string> = {
  S: "border-rose-400/50 bg-rose-500/15 text-rose-200",
  A: "border-orange-400/50 bg-orange-500/15 text-orange-200",
  B: "border-amber-400/50 bg-amber-500/15 text-amber-200",
  C: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200",
  D: "border-sky-400/50 bg-sky-500/15 text-sky-200",
  F: "border-violet-400/50 bg-violet-500/15 text-violet-200",
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export function tierTone(tier: TierName): string {
  return TIER_TONES[tier];
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function TierListBoard({ entries, compact = false }: { entries: TierListEntry[]; compact?: boolean }) {
  return <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary/50">
    {TIER_ORDER.map((tier) => {
      const champions = entries.filter((entry) => entry.tier === tier).sort((a, b) => a.position - b.position);
      return <div key={tier} className="grid grid-cols-[3.25rem_minmax(0,1fr)] border-b border-pc-border/70 last:border-b-0 sm:grid-cols-[4.25rem_minmax(0,1fr)]">
        <div className={`flex items-center justify-center border-r text-xl font-black sm:text-2xl ${TIER_TONES[tier]}`}>{tier}</div>
        <div className={`flex min-h-14 flex-wrap content-start gap-1.5 p-2 ${compact ? "sm:min-h-16" : "sm:min-h-20 sm:gap-2 sm:p-3"}`}>
          {champions.map((champion) => <div key={champion.championId} title={champion.championName} className="group relative">
            <img src={getChampionIconSafe(champion.championName)} alt={champion.championName} className={`${compact ? "h-9 w-9 sm:h-11 sm:w-11" : "h-11 w-11 sm:h-14 sm:w-14"} rounded-lg border border-pc-border bg-pc-bg object-contain`} />
            {!compact && <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate rounded-b-lg bg-black/75 px-1 py-0.5 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">{champion.championName}</span>}
          </div>)}
        </div>
      </div>;
    })}
  </div>;
}
