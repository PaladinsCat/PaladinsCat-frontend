/**
 * Define the player route surface for id loadouts championId loadoutId page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import { ErrorState, LoadingPanel } from "@/components/async-state";
import LoadoutExportButton from "@/components/loadout-export-button";
import { fetchPlayerLoadoutDeck, fetchPlayerProfile, type PlayerLoadout, type PlayerLoadoutFreshness } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { loadBuildCardReferences, type BuildCardReference } from "@/lib/build-reference";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";
import styles from "./page.module.css";

function cardDescription(description: string | null | undefined, level: number, formatValue: (value: number) => string) {
  if (!description) return "Card description is not available in the local reference yet.";
  const safeLevel = Math.max(1, Math.min(5, Math.floor(Number(level) || 1)));
  return description.replace(/\{(?:scale=)?(-?[\d,]+(?:\.\d+)?)\|(-?[\d,]+(?:\.\d+)?)}/gi, (_match, baseText: string, stepText: string) => {
    const base = Number(baseText.replaceAll(",", ""));
    const step = Number(stepText.replaceAll(",", ""));
    const value = base + step * (safeLevel - 1);
    return formatValue(value);
  });
}

const FRAME_RARITY = ["Common", "Uncommon", "Rare", "Epic", "Legendary"] as const;

function loadoutFrame(level: number) {
  const safeLevel = Math.max(1, Math.min(5, Math.floor(Number(level) || 1)));
  return `/images/cards/frames/Card_Frame_Level_${safeLevel}_${FRAME_RARITY[safeLevel - 1]}.avif`;
}

function championBanner(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  const assetName = normalized === "bettylabomba"
    ? "Betty_la_Bomba"
    : normalized === "maldamba"
      ? "Mal'Damba"
      : name.trim().replaceAll(" ", "_");
  return `/images/champions/Banner_${assetName}.avif`;
}

/**
 * Render the PlayerLoadoutDetailPage view for the player id loadouts championId loadoutId page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function PlayerLoadoutDetailPage() {
  const { t, formatNumber } = useLocalization();
  const params = useParams<{ id: string; championId: string; loadoutId: string }>();
  const playerId = String(params.id ?? "");
  const championId = Number(params.championId ?? 0);
  const loadoutId = Number(params.loadoutId ?? 0);
  const [loadout, setLoadout] = useState<PlayerLoadout | null>(null);
  const [freshness, setFreshness] = useState<PlayerLoadoutFreshness | null>(null);
  const [playerName, setPlayerName] = useState(`Player ${playerId}`);
  const [references, setReferences] = useState<BuildCardReference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loadoutRef = useRef<HTMLElement>(null);
  const championName = loadout?.championId === championId ? loadout.championName : "";
  const formatCardValue = (value: number) => formatNumber(value, { maximumFractionDigits: 2 });

  useEffect(() => {
    let cancelled = false;
    fetchPlayerLoadoutDeck(playerId, loadoutId).then((data) => {
      if (cancelled) return;
      setFreshness(data.freshness);
      setLoadout(data.loadout.championId === championId ? data.loadout : null);
    }).catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : t("generated.players.[id].loadouts.[championId].[loadoutId].page.couldnotloadthissaveddeck"));
    });
    fetchPlayerProfile(playerId).then((profile) => {
      if (!cancelled && profile.name) setPlayerName(profile.name);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [playerId, championId, loadoutId, t]);
  useEffect(() => { if (!championName) return; loadBuildCardReferences(championId, championSlug(championName)).then(setReferences).catch(() => setReferences([])); }, [championId, championName]);
  const cardsById = useMemo(() => new Map(references.map((card) => [card.id, card])), [references]);

  if (error) return <ErrorState title={t("generated.players.loadoutUnavailable")} message={error} />;
  if (!loadout && !freshness) return <LoadingPanel />;
  if (!championName || !loadout) return <ErrorState title={t("generated.players.loadoutUnavailable")} message={t("generated.players.thisSavedDeckIsNoLongerInThePlayerS")} />;

  const entries = loadout.cardIds.slice(0, 5).map((cardId, index) => ({ cardId, level: Math.max(1, loadout.cardLevels[index] ?? 1), card: cardsById.get(cardId) }));
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <Link href={`/players/${playerId}/loadouts/${championId}`} className="inline-block text-xs text-pc-accent hover:underline">← {championName} {t("generated.players.savedDecks")}</Link>
      <LoadoutExportButton championName={championName} loadoutId={loadoutId} target={loadoutRef} />
    </div>
    <section ref={loadoutRef} className={styles.detail} aria-label={t("generated.players.fiveCardSavedDeck")}>
      <SmartImage src={championBanner(championName)} onError={(event) => { event.currentTarget.src = getChampionIconSafe(championName); }} alt="" aria-hidden="true" className={styles.background} />
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.brand}><SmartImage src="/images/icons/paladinscat.png" alt="" /><span>{t("generated.common.paladinscat")}</span><span className={styles.tag}>{t("generated.matches.loadout")}</span></div>
          <h1>{playerName}</h1>
          <div className={styles.context}><span>{championName}</span><span>{loadout.loadoutName || "Unnamed Loadout"}</span></div>
        </div>
      </header>
      <section className={styles.cards} aria-label={t("generated.players.deckCards")}>
        {entries.map(({ cardId, level, card }) => {
          const name = card?.name || t("generated.players.cardValue1", { value1: cardId });
          return <article key={cardId} className={styles.card} aria-label={t("common.match.cardLevel", { level })}>
            <SmartImage src={card?.iconUrl || "/images/icons/Player_Loadouts_Icon.png"} alt="" className={styles.cardArt} />
            <SmartImage src={loadoutFrame(level)} alt="" className={styles.cardFrame} />
            <h2 className={name.length >= 22 ? styles.extraLongCardName : name.length >= 20 ? styles.longCardName : undefined}>{name}</h2>
            <p>{cardDescription(card?.description, level, formatCardValue)}</p>
            <span className={styles.level}>{level}</span>
          </article>;
        })}
      </section>
    </section>
  </div>;
}
