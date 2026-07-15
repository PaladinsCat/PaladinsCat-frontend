"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createBuild,
  fetchChampions,
  getAuthToken,
  getAuthUser,
  type BuildCardSelection,
  type ChampionNameOnly,
} from "@/lib/api-client";
import {
  groupByCategory,
  loadBuildReferenceData,
  type BuildCardReference,
  type BuildItemReference,
  type BuildReferenceData,
  type BuildTalentReference,
} from "@/lib/build-reference";
import { championSlug } from "@/lib/utils";
import { AsyncButton, LoadingPanel } from "@/components/async-state";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import { useLocalization } from "@/lib/localization-context";

const MAX_ITEMS = 4;
const MAX_CARDS = 5;
const MAX_CARD_POINTS = 15;
const DEFAULT_CARD_LEVEL = 3;

function AssetImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-pc-border bg-pc-bg-secondary text-xs text-pc-text-muted">
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-12 w-12 shrink-0 rounded-md border border-pc-border object-cover bg-pc-bg-secondary"
      loading="lazy"
    />
  );
}

function SelectionBadge({ selected }: { selected: boolean }) {
  const { t } = useLocalization();
  return (
    <span className={`text-[11px] font-semibold ${selected ? "text-pc-accent" : "text-pc-text-muted"}`}>
      {selected ? t("generated.builds.selected") : t("generated.builds.select")}
    </span>
  );
}

function ItemTile({ item, selected, disabled, onToggle }: {
  item: BuildItemReference;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`pc-surface-light flex min-h-[88px] items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-pc-accent bg-pc-accent/10" : "border-pc-border hover:border-pc-accent-mid"
      } ${disabled && !selected ? "cursor-not-allowed opacity-45" : ""}`}
    >
      <AssetImage src={item.iconUrl} alt={item.name} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-pc-text">{item.name}</span>
        <span className="mt-1 block text-xs text-pc-text-muted">{item.category}</span>
        <SelectionBadge selected={selected} />
      </span>
    </button>
  );
}

function TalentTile({ talent, selected, onSelect }: {
  talent: BuildTalentReference;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={talent.id <= 0}
      className={`pc-surface-light flex min-h-[112px] items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-pc-accent bg-pc-accent/10" : "border-pc-border hover:border-pc-accent-mid"
      } ${talent.id <= 0 ? "cursor-not-allowed opacity-45" : ""}`}
    >
      <CanonicalTalentImage talentId={talent.id} talentName={talent.name} alt={talent.name} className="h-10 w-10 shrink-0 rounded-md border border-pc-border object-cover" fallbackClassName="h-10 w-10 shrink-0 rounded-md border border-pc-border bg-pc-bg-secondary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-pc-text">{talent.name}</span>
        <span className="mt-1 line-clamp-3 block text-xs text-pc-text-secondary">{talent.description}</span>
        <SelectionBadge selected={selected} />
      </span>
    </button>
  );
}

function CardTile({ card, selection, disabled, onToggle, onLevelChange }: {
  card: BuildCardReference;
  selection?: BuildCardSelection;
  disabled: boolean;
  onToggle: () => void;
  onLevelChange: (level: number) => void;
}) {
  const { t } = useLocalization();
  const selected = Boolean(selection);
  const blocked = (disabled && !selected) || card.id <= 0;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (blocked) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <div
      role="button"
      tabIndex={blocked ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={blocked}
      onClick={() => {
        if (!blocked) onToggle();
      }}
      onKeyDown={handleKeyDown}
      className={`pc-surface-light rounded-lg border p-3 transition-colors ${
        selected ? "border-pc-accent bg-pc-accent/10" : "border-pc-border hover:border-pc-accent-mid"
      } ${blocked ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
    >
      <div className="flex items-start gap-3">
        <AssetImage src={card.iconUrl} alt={card.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-left text-sm font-semibold text-pc-text">
              {card.name}
            </span>
            <SelectionBadge selected={selected} />
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-pc-text-secondary">{card.description}</p>
        </div>
      </div>

      {selected && selection && (
        <div
          className="mt-3 flex items-center justify-between gap-3 border-t border-pc-border/60 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <span className="text-xs font-medium text-pc-text-secondary">{t("generated.builds.level")}</span>
          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => onLevelChange(level)}
                className={`h-7 w-8 rounded border text-xs font-semibold transition-colors ${
                  selection.level === level
                    ? "border-pc-accent bg-pc-accent text-black"
                    : "border-pc-border bg-pc-bg-secondary text-pc-text-secondary hover:border-pc-accent-mid"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default function CreateBuildPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [champions, setChampions] = useState<ChampionNameOnly[]>([]);
  const [name, setName] = useState("");
  const [championId, setChampionId] = useState(0);
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedCards, setSelectedCards] = useState<BuildCardSelection[]>([]);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [referenceData, setReferenceData] = useState<BuildReferenceData | null>(null);
  const [loadingChampions, setLoadingChampions] = useState(true);
  const [loadingReference, setLoadingReference] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchChampions({ limit: "200" })
      .then((rows) => {
        if (cancelled) return;
        setChampions([...rows].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => setError(t("generated.builds.failedToLoadChampions")))
      .finally(() => {
        if (!cancelled) setLoadingChampions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedChampion = useMemo(
    () => champions.find((champion) => champion.id === championId),
    [championId, champions],
  );

  useEffect(() => {
    setSelectedItems([]);
    setSelectedCards([]);
    setSelectedTalentId(null);
    setReferenceData(null);

    if (!selectedChampion) return;
    let cancelled = false;
    setLoadingReference(true);
    loadBuildReferenceData(selectedChampion.id, championSlug(selectedChampion.name))
      .then((data) => {
        if (!cancelled) setReferenceData(data);
      })
      .catch(() => {
        if (!cancelled) setError(t("generated.builds.failedToLoadChampionBuildReferences"));
      })
      .finally(() => {
        if (!cancelled) setLoadingReference(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChampion]);

  const selectedCardMap = useMemo(
    () => new Map(selectedCards.map((card) => [card.cardId, card])),
    [selectedCards],
  );
  const cardPointTotal = useMemo(() => selectedCards.reduce((sum, card) => sum + card.level, 0), [selectedCards]);
  const overCardBudget = cardPointTotal > MAX_CARD_POINTS;
  const canSubmit = Boolean(
    name.trim()
      && championId
      && selectedTalentId
      && selectedCards.length === MAX_CARDS
      && cardPointTotal === MAX_CARD_POINTS
      && !overCardBudget,
  );

  function toggleItem(itemId: number) {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, itemId];
    });
  }

  function toggleCard(cardId: number) {
    setSelectedCards((prev) => {
      if (prev.some((card) => card.cardId === cardId)) return prev.filter((card) => card.cardId !== cardId);
      if (prev.length >= MAX_CARDS) return prev;
      return [...prev, { cardId, level: DEFAULT_CARD_LEVEL }];
    });
  }

  function setCardLevel(cardId: number, level: number) {
    setSelectedCards((prev) => prev.map((card) => (card.cardId === cardId ? { ...card, level } : card)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError(t("generated.builds.choose1TalentAndExactly5CardsTotaling15Points"));
      return;
    }
    const user = getAuthUser();
    const token = getAuthToken();
    if (!user || !token) {
      router.push("/auth/login");
      return;
    }

    try {
      setSubmitting(true);
      const build = await createBuild(
        user.id,
        championId,
        name.trim(),
        selectedItems,
        selectedCards,
        selectedTalentId ? [selectedTalentId] : [],
        notes.trim() || null,
        visibility,
        token,
      );
      router.push(`/builds/${build.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create build");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/builds" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
        {t("generated.builds.backToBuilds")}</Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pc-accent">{t("generated.builds.createBuild")}</h1>
          <p className="mt-2 text-sm text-pc-text-secondary">
            {t("generated.builds.pickAChampionThenChooseUpTo4Items5")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="pc-card space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-pc-text-secondary">{t("generated.builds.buildName")}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
                placeholder={t("generated.builds.mainRankedLoadout")}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-pc-text-secondary">{t("generated.builds.champion")}</span>
              <select
                value={championId || ""}
                onChange={(e) => setChampionId(Number(e.target.value))}
                disabled={loadingChampions}
                className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
                required
              >
                <option value="">{t("generated.builds.selectChampion")}</option>
                {champions.map((champion) => (
                  <option key={champion.id} value={champion.id}>{champion.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-pc-text-secondary">{t("generated.builds.visibility")}</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              >
                <option value="public">{t("generated.builds.public")}</option>
                <option value="private">{t("generated.builds.private")}</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-pc-text-secondary">{t("generated.builds.notes")}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.builds.matchupsMapNotesPlaystyleOrBuyOrderGuidance")}
            />
          </label>
        </div>

        {!selectedChampion && (
          <div className="pc-card text-sm text-pc-text-secondary">{t("generated.builds.selectAChampionToLoadCardsAndTalents")}</div>
        )}

        {loadingReference && (
          <LoadingPanel />
        )}

        {referenceData && (
          <>
            <section className="pc-card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="pc-card-title">{t("generated.builds.items")}</h2>
                  <p className="text-xs text-pc-text-secondary">{t("generated.builds.currentItemStore20OptionsChooseUpTo4")}</p>
                </div>
                <span className="text-sm font-semibold text-pc-accent">{selectedItems.length}/{MAX_ITEMS}</span>
              </div>
              {groupByCategory(referenceData.items).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-pc-text-muted">{category}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {items.map((item) => (
                      <ItemTile
                        key={item.id}
                        item={item}
                        selected={selectedItems.includes(item.id)}
                        disabled={selectedItems.length >= MAX_ITEMS}
                        onToggle={() => toggleItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="pc-card space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="pc-card-title">{t("generated.builds.talents")}</h2>
                  <p className="text-xs text-pc-text-secondary">{referenceData.talents.length} {t("generated.builds.talentsAvailableChoose1")}</p>
                </div>
                <span className="text-sm font-semibold text-pc-accent">{selectedTalentId ? 1 : 0}/1</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {referenceData.talents.map((talent) => (
                  <TalentTile
                    key={talent.id}
                    talent={talent}
                    selected={selectedTalentId === talent.id}
                    onSelect={() => setSelectedTalentId((current) => (current === talent.id ? null : talent.id))}
                  />
                ))}
              </div>
            </section>

            <section className="pc-card space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="pc-card-title">{t("generated.builds.loadoutCards")}</h2>
                  <p className="text-xs text-pc-text-secondary">{referenceData.cards.length} {t("generated.builds.championCardsChoose5AndSpendExactly15Points")}</p>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span className="text-pc-accent">{selectedCards.length}/{MAX_CARDS}</span>
                  <span className={cardPointTotal === MAX_CARD_POINTS ? "text-green-400" : overCardBudget ? "text-red-400" : "text-yellow-300"}>
                    {cardPointTotal}/{MAX_CARD_POINTS} {t("generated.builds.pts")}</span>
                </div>
              </div>
              {groupByCategory(referenceData.cards).map(([category, cards]) => (
                <div key={category} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-pc-text-muted">{category}</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => (
                      <CardTile
                        key={card.id}
                        card={card}
                        selection={selectedCardMap.get(card.id)}
                        disabled={selectedCards.length >= MAX_CARDS}
                        onToggle={() => toggleCard(card.id)}
                        onLevelChange={(level) => setCardLevel(card.id, level)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        <div className="sticky bottom-4 z-10 pc-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-pc-text-secondary">
            {canSubmit ? t("generated.builds.readyToSave") : t("generated.builds.aValidBuildNeeds1TalentAnd5CardsTotaling")}
          </div>
          <AsyncButton
            type="submit"
            disabled={!canSubmit}
            loading={submitting}
            className="rounded-lg bg-pc-accent px-5 py-2 font-semibold text-black transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("generated.builds.saveBuild")}</AsyncButton>
        </div>
      </form>
    </div>
  );
}
