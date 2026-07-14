import Link from "next/link";
import PlayerName from "@/components/player-name";

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/15 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/15 text-amber-400",
  low: "border-yellow-500/30 bg-yellow-500/15 text-yellow-400",
};

const value = (input: unknown) => input == null || input === "" ? "—" : Number.isFinite(Number(input)) ? Number(input).toLocaleString() : String(input);

export default function PlayerModerationCards({ players, showSeverity = false }: { players: any[]; showSeverity?: boolean }) {
  return <div className="space-y-2 lg:hidden">
    {players.map((player, index) => <article key={player.id} className="pc-mobile-panel overflow-hidden">
      <div className="flex min-w-0 items-center gap-3 p-3">
        <span className="w-6 shrink-0 text-center text-xs text-pc-text-muted">{index + 1}</span>
        {CLASS_ICONS[player.className] && <img src={CLASS_ICONS[player.className]} alt="" className="h-7 w-7 shrink-0 object-contain" />}
        <div className="min-w-0 flex-1"><Link href={`/players/${player.id}`} className="block truncate text-sm font-semibold text-pc-text hover:text-pc-accent"><PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount ?? player.sus_count}>{player.name}</PlayerName></Link><div className="text-[10px] text-pc-text-muted">{player.region || "Unknown region"} · {value(player.totalMatches)} matches</div></div>
        {showSeverity && <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${SEVERITY_STYLES[player.severity] || "border-pc-border text-pc-text-muted"}`}>{player.severity || "Review"}</span>}
      </div>
      <dl className="grid grid-cols-3 gap-px border-y border-pc-border/60 bg-pc-border/60 min-[420px]:grid-cols-6">
        {[
          ["DPM", player.avgDpm ?? player.dpm], ["HPM", player.avgHpm ?? player.hpm],
          ["CPM", player.avgCpm ?? player.gpm], ["SPM", player.avgSpm ?? player.mpm],
          ["KDA", player.kda], ["Win rate", player.winRate == null ? "—" : `${player.winRate}%`],
        ].map(([label, metric]) => <div key={label} className="bg-pc-bg-elevated px-2 py-2 text-center"><dt className="text-[8px] uppercase tracking-wide text-pc-text-muted">{label}</dt><dd className="mt-0.5 truncate font-mono text-xs font-semibold text-pc-text-secondary">{value(metric)}</dd></div>)}
      </dl>
      {player.reason && <p className="break-words px-3 py-2 text-xs leading-relaxed text-pc-text-muted [overflow-wrap:anywhere]">{player.reason}</p>}
    </article>)}
  </div>;
}
