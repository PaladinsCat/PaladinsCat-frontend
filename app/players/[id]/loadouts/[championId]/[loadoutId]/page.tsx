"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import { ErrorState, LoadingPanel } from "@/components/async-state";
import { fetchPlayerLoadouts, type PlayerLoadout, type PlayerLoadoutFreshness } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { loadBuildReferenceData, type BuildCardReference } from "@/lib/build-reference";
import { getPlayerLoadoutChampionRoster, type PlayerLoadoutChampion } from "@/lib/player-loadout-roster";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";

function cardDescription(description: string | null | undefined, level: number) {
  if (!description) return "Card description is not available in the local reference yet.";
  return description.replace(/\{([^}]+)\}/g, (_match, values: string) => {
    const variants = values.split("|");
    return variants[Math.min(Math.max(level - 1, 0), variants.length - 1)] ?? values;
  });
}

export default function PlayerLoadoutDetailPage() {
  const { t } = useLocalization();
  const params = useParams<{ id: string; championId: string; loadoutId: string }>();
  const playerId = String(params.id ?? "");
  const championId = Number(params.championId ?? 0);
  const loadoutId = Number(params.loadoutId ?? 0);
  const [champions, setChampions] = useState<PlayerLoadoutChampion[]>([]);
  const champion = champions.find((entry) => entry.id === championId) ?? null;
  const [loadout, setLoadout] = useState<PlayerLoadout | null>(null);
  const [freshness, setFreshness] = useState<PlayerLoadoutFreshness | null>(null);
  const [references, setReferences] = useState<BuildCardReference[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { let cancelled = false; fetchPlayerLoadouts(playerId).then((data) => { if (cancelled) return; setFreshness(data.freshness); setLoadout(data.loadouts.find((entry) => entry.id === loadoutId && entry.championId === championId) ?? null); }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load this saved deck."); }); return () => { cancelled = true; }; }, [playerId, championId, loadoutId]);
  useEffect(() => { getPlayerLoadoutChampionRoster().then(setChampions); }, []);
  useEffect(() => { if (!champion) return; loadBuildReferenceData(champion.id, championSlug(champion.name)).then((reference) => setReferences(reference.cards)).catch(() => setReferences([])); }, [champion]);
  const cardsById = useMemo(() => new Map(references.map((card) => [card.id, card])), [references]);

  if (error) return <ErrorState title={t("generated.players.loadoutUnavailable")} message={error} />;
  if (!champions.length) return <LoadingPanel />;
  if (!loadout && !freshness) return <LoadingPanel />;
  if (!champion || !loadout) return <ErrorState title={t("generated.players.loadoutUnavailable")} message={t("generated.players.thisSavedDeckIsNoLongerInThePlayerS")} />;

  const entries = loadout.cardIds.slice(0, 5).map((cardId, index) => ({ cardId, level: Math.max(1, loadout.cardLevels[index] ?? 1), card: cardsById.get(cardId) }));
  return <div className="space-y-6"><div><Link href={`/players/${playerId}/loadouts/${championId}`} className="mb-2 inline-block text-xs text-pc-accent hover:underline">← {champion.name} {t("generated.players.savedDecks")}</Link><section className="relative overflow-hidden rounded-2xl border border-pc-accent/30 bg-gradient-to-br from-pc-bg-elevated via-pc-bg-elevated to-pc-accent/10 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><img src={getChampionIconSafe(champion.name)} alt="" className="h-14 w-14 rounded-xl object-contain" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-pc-text-muted">{t("generated.players.chooseYourLoadout")}</p><h1 className="text-2xl font-bold text-pc-accent">{loadout.loadoutName}</h1><p className="mt-1 text-sm text-pc-text-secondary">{champion.name} {t("generated.players.fiveCardSavedDeck")}</p></div></div><span className="rounded-full border border-pc-accent/30 bg-pc-accent/10 px-3 py-1.5 text-xs font-semibold text-pc-accent">{t("generated.players.level15Total")}</span></div></section></div><section><h2 className="mb-3 text-sm font-bold text-pc-text">{t("generated.players.deckCards")}</h2><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{entries.map(({ cardId, level, card }) => <article key={cardId} className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><div className="relative aspect-[0.72] bg-pc-bg"><SmartImage src={card?.iconUrl || "/images/icons/Player_Loadouts_Icon.png"} alt={card?.name || t("generated.players.cardValue1", { value1: cardId })} className="h-full w-full object-cover" /><span className="absolute bottom-2 right-2 rounded-lg border border-white/20 bg-black/80 px-2 py-1 text-sm font-bold text-white">{level}</span></div><div className="p-3"><h3 className="truncate text-sm font-bold text-pc-text">{card?.name || t("generated.players.cardValue1", { value1: cardId })}</h3><p className="mt-2 text-xs leading-5 text-pc-text-secondary">{cardDescription(card?.description, level)}</p></div></article>)}</div></section><div className="rounded-xl border border-pc-border bg-pc-bg-secondary/50 px-4 py-3 text-xs text-pc-text-muted">{t("generated.players.savedLoadoutsAreReadFromTheLocalCacheReturnTo")}</div></div>;
}
