import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import type { ChampionLoadout } from "@/lib/champion-data";
import type { ChampionCardStat, ChampionCardStatsResponse } from "@/lib/api-client";
import { getStatQuality } from "@/lib/stat-quality";

function statNameKey(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function LevelRateStrip({
  levels,
  totalMatches,
}: {
  levels: ChampionCardStat["levels"];
  totalMatches: number;
}) {
  if (levels.length === 0) return null;

  return (
    <div className="mt-1.5 flex min-w-0 gap-1 text-[8px] leading-none">
      <span className="pt-0.5 font-bold text-pc-text-muted">L</span>
      {levels.map((level) => {
        const pickRate = (level.plays / Math.max(1, totalMatches)) * 100;
        return (
          <span
            key={level.level}
            className="min-w-0 truncate rounded bg-pc-bg px-1 py-0.5 text-pc-text-secondary"
            title={`Level ${level.level}: ${level.winRate.toFixed(1)}% win rate, ${pickRate.toFixed(1)}% pick rate, ${level.plays.toLocaleString()} picks`}
          >
            {level.level} <span className="text-pc-text">{level.winRate.toFixed(0)}</span>
            <span className="text-pc-text-muted">/{pickRate.toFixed(0)}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function ChampionLoadoutGrid({
  championSlug,
  loadouts,
  cardStats,
  talentId,
  returnTo,
}: {
  championSlug: string;
  loadouts: ChampionLoadout[];
  cardStats: ChampionCardStatsResponse;
  talentId: number;
  returnTo: string;
}) {
  const statsByName = new Map(cardStats.cards.map((stat) => [statNameKey(stat.cardName), stat]));
  const maxCardPickRate = Math.max(
    1,
    ...cardStats.cards.map((stat) => (stat.totalPlays / Math.max(1, cardStats.totalMatches)) * 100),
  );
  const byCategory: Record<string, ChampionLoadout[]> = {};
  for (const loadout of loadouts) {
    const category = loadout.category || "General";
    (byCategory[category] ??= []).push(loadout);
  }

  return (
    <div className="pc-card">
      {Object.entries(byCategory).map(([category, cards]) => (
        <section key={category} className="mb-6 last:mb-0">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-pc-text-muted">{category}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((card) => {
              const stat: ChampionCardStat | undefined = statsByName.get(statNameKey(card.name));
              const pickRate = stat ? (stat.totalPlays / Math.max(1, cardStats.totalMatches)) * 100 : 0;
              const quality = stat ? getStatQuality(stat.winRate, pickRate, maxCardPickRate) : null;
              const params = new URLSearchParams({ talentId: String(talentId), returnTo });
              const href = stat ? `/champions/${championSlug}/cards/${stat.cardId}?${params.toString()}` : null;
              const className = "group block rounded-lg border bg-pc-bg-elevated p-2.5 text-left transition-colors hover:border-pc-accent-mid";
              const content = (
                <div className="flex gap-2">
                  {card.iconUrl ? (
                    <SmartImage src={card.iconUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-md border border-pc-border bg-pc-bg/50 object-cover" onError={(event) => { (event.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-pc-border bg-pc-bg-elevated">
                      <span className="text-xs text-pc-accent">?</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{card.name}</div>
                    {stat && stat.totalPlays > 0 && (
                      <>
                        <div className="mt-0.5 text-[11px]" style={quality ? { color: quality.color } : undefined}>
                          {stat.winRate.toFixed(1)}% WR <span className="text-pc-text-muted">· {pickRate.toFixed(1)}% PR</span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-pc-bg">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(4, (pickRate / maxCardPickRate) * 100)}%`, background: quality?.track }} />
                        </div>
                        <div className="mt-1 text-[9px] text-pc-text-muted">{stat.totalPlays.toLocaleString()} picks</div>
                        <LevelRateStrip levels={stat.levels} totalMatches={cardStats.totalMatches} />
                      </>
                    )}
                    {(!stat || stat.totalPlays === 0) && <div className="mt-1 text-[9px] text-pc-text-muted">No ranked sample</div>}
                  </div>
                </div>
              );

              return href ? (
                <Link key={card.name} href={href} className={className} style={quality ? { borderColor: quality.borderColor } : undefined}>{content}</Link>
              ) : (
                <div key={card.name} className={className} style={quality ? { borderColor: quality.borderColor } : undefined}>{content}</div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
