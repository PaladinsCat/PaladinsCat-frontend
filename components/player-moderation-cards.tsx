/** player-moderation-cards component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
import Link from "next/link";
import PlayerName from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

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

const SEVERITY_LABEL_KEYS: Record<string, TranslationKey> = {
  high: "common.severity.high",
  medium: "common.severity.medium",
  low: "common.severity.low",
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PlayerModerationCards({ players, showSeverity = false }: { players: any[]; showSeverity?: boolean }) {
  const { formatNumber, formatPercent, t } = useLocalization();
  const value = (input: unknown) => input == null || input === "" ? "—" : Number.isFinite(Number(input)) ? formatNumber(Number(input)) : String(input);
  return <div className="space-y-2 lg:hidden">
    {players.map((player, index) => <article key={player.id} className="pc-mobile-panel overflow-hidden">
      <div className="flex min-w-0 items-center gap-3 p-3">
        <span className="w-6 shrink-0 text-center text-xs text-pc-text-muted">{formatNumber(index + 1)}</span>
        {CLASS_ICONS[player.className] && <img src={CLASS_ICONS[player.className]} alt="" className="h-7 w-7 shrink-0 object-contain" />}
        <div className="min-w-0 flex-1"><Link href={`/players/${player.id}`} className="block truncate text-sm font-semibold text-pc-text hover:text-pc-accent"><PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount ?? player.sus_count}>{player.name}</PlayerName></Link><div className="text-xs text-pc-text-muted">{player.region || t("common.fallback.unknownRegion")} · {value(player.totalMatches)} {t("generated.players.matches.9f3e924")}</div></div>
        {showSeverity && <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold capitalize ${SEVERITY_STYLES[player.severity] || "border-pc-border text-pc-text-muted"}`}>{player.severity ? t(SEVERITY_LABEL_KEYS[player.severity] ?? "common.fallback.review") : t("common.fallback.review")}</span>}
      </div>
      <dl className="grid grid-cols-3 gap-px border-y border-pc-border/60 bg-pc-border/60 min-[420px]:grid-cols-6">
        {[
          [t("common.metrics.dpm"), value(player.avgDpm ?? player.dpm)], [t("common.metrics.hpm"), value(player.avgHpm ?? player.hpm)],
          [t("common.metrics.cpm"), value(player.avgCpm ?? player.gpm)], [t("common.metrics.spm"), value(player.avgSpm ?? player.mpm)],
          [t("common.metrics.kda"), value(player.kda)], [t("common.metrics.winRate"), player.winRate == null ? "—" : formatPercent(player.winRate)],
        ].map(([label, metric]) => <div key={label} className="bg-pc-bg-elevated px-2 py-2 text-center"><dt className="text-xs uppercase tracking-wide text-pc-text-muted">{label}</dt><dd className="mt-0.5 truncate font-mono text-xs font-semibold text-pc-text-secondary">{metric}</dd></div>)}
      </dl>
      {player.reason && <p className="break-words px-3 py-2 text-xs leading-relaxed text-pc-text-muted [overflow-wrap:anywhere]">{player.reason}</p>}
    </article>)}
  </div>;
}
