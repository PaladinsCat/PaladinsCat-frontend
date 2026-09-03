/**
 * Define the community diminishing returns page responsibility boundary.
 * Coordinates community diminishing returns page data loading, authorization, and presentation.
 * refs: none
 */
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, ChevronRight, Download, ExternalLink, Info, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchChampions,
  fetchPlayerLoadouts,
  type ChampionNameOnly,
  type PlayerLoadout,
} from "@/lib/api-client";
import {
  itemDescriptionAtLevel,
  loadBuildReferenceData,
  type BuildCardReference,
  type BuildItemReference,
  type BuildReferenceData,
  type BuildTalentReference,
} from "@/lib/build-reference";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { LoadingPanel } from "@/components/async-state";
import SmartImage from "@/components/SmartImage";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import { useLocalization } from "@/lib/localization-context";
import {
  calculateAdditiveValue,
  calculateDiminishedValue,
  detectDescriptionEffects,
  extractWeaponDamageOverride,
  resolveScaledDescription,
  type DetectedEffect,
  type EffectKey,
  type EffectTarget,
} from "@/lib/diminishing-returns";

const MAX_CARDS = 5;
const MAX_ITEMS = 4;
const EFFECT_TARGET_ORDER: EffectTarget[] = ["self", "enemy", "ally", "unknown"];

type CardSelection = { id: number; level: number };
type ItemSelection = { id: number; level: number };

const EFFECT_ORDER: EffectKey[] = [
  "movement-speed",
  "damage-reduction-direct",
  "damage-reduction-area",
  "life-steal",
  "healing-received",
  "crowd-control-reduction",
  "cooldown-reduction",
  "reload-speed",
  "ultimate-charge",
  "mount-speed",
  "weapon-damage",
  "weapon-damage-deployables",
  "weapon-damage-shields",
  "maximum-health",
  "maximum-ammo",
  "shield-health",
  "shield-effectiveness",
];

const EFFECT_LABELS = {
  "movement-speed": "diminishingReturns.movementSpeedEffect",
  "mount-speed": "diminishingReturns.mountSpeedEffect",
  "damage-reduction-direct": "diminishingReturns.directDamageReduction",
  "damage-reduction-area": "diminishingReturns.areaDamageReduction",
  "life-steal": "diminishingReturns.lifeSteal",
  "healing-received": "diminishingReturns.healingReceived",
  "crowd-control-reduction": "diminishingReturns.crowdControlReduction",
  "cooldown-reduction": "diminishingReturns.cooldownReduction",
  "reload-speed": "diminishingReturns.reloadSpeed",
  "ultimate-charge": "diminishingReturns.ultimateCharge",
  "maximum-health": "diminishingReturns.maximumHealth",
  "maximum-ammo": "diminishingReturns.maximumAmmo",
  "shield-health": "diminishingReturns.shieldHealth",
  "shield-effectiveness": "diminishingReturns.shieldEffectiveness",
  "weapon-damage": "diminishingReturns.weaponDamagePlayers",
  "weapon-damage-deployables": "diminishingReturns.weaponDamageDeployables",
  "weapon-damage-shields": "diminishingReturns.weaponDamageShields",
} as const;

const EFFECT_TARGET_LABELS = {
  self: "diminishingReturns.targetSelf",
  enemy: "diminishingReturns.targetEnemy",
  ally: "diminishingReturns.targetAlly",
  unknown: "diminishingReturns.targetUnknown",
} as const;

function effectGroupKey(key: EffectKey, target: EffectTarget) {
  return `${key}:${target}`;
}

function SelectableImage({ src, alt }: { src?: string | null; alt: string }) {
  return src ? (
    <SmartImage src={src} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-pc-border bg-pc-bg object-cover" />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-pc-border bg-pc-bg text-xs font-bold text-pc-text-muted">
      {alt.slice(0, 2).toUpperCase()}
    </span>
  );
}

function LevelButtons({ level, maximum, onChange }: { level: number; maximum: number; onChange: (level: number) => void }) {
  return (
    <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
      {Array.from({ length: maximum }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`h-7 min-w-7 rounded border px-1 text-xs font-bold transition-colors ${
            value === level
              ? "border-pc-accent bg-pc-accent text-black"
              : "border-pc-border bg-pc-bg text-pc-text-secondary hover:border-pc-accent-mid"
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function SelectionCard({
  name,
  description,
  image,
  selected,
  disabled,
  level,
  maximumLevel,
  onToggle,
  onLevelChange,
  imageNode,
}: {
  name: string;
  description?: string | null;
  image?: string | null;
  selected: boolean;
  disabled?: boolean;
  level?: number;
  maximumLevel?: number;
  onToggle: () => void;
  onLevelChange?: (level: number) => void;
  imageNode?: React.ReactNode;
}) {
  const { t } = useLocalization();
  return (
    <article className={`rounded-xl border p-3 transition-colors ${selected ? "border-pc-accent bg-pc-accent/10" : "border-pc-border bg-pc-bg-secondary/50"} ${disabled ? "opacity-45" : "hover:border-pc-accent-mid"}`}>
      <button type="button" disabled={disabled} onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        {imageNode ?? <SelectableImage src={image} alt={name} />}
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-pc-text">{name}</span>
            <span className={`text-xs font-bold ${selected ? "text-pc-accent" : "text-pc-text-muted"}`}>
              {t(selected ? "diminishingReturns.selected" : "diminishingReturns.select")}
            </span>
          </span>
          <span className="mt-1 block text-xs leading-5 text-pc-text-secondary">{description}</span>
        </span>
      </button>
      {selected && level && maximumLevel && onLevelChange && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-pc-border/60 pt-3">
          <span className="text-xs text-pc-text-muted">{t("diminishingReturns.level", { level })}</span>
          <LevelButtons level={level} maximum={maximumLevel} onChange={onLevelChange} />
        </div>
      )}
    </article>
  );
}

function parseNumber(value: string | null | undefined) {
  const number = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function DiminishingReturnsPage() {
  const { t, formatNumber } = useLocalization();
  const { user, isLoading: authLoading } = useAuth();
  const [champions, setChampions] = useState<ChampionNameOnly[]>([]);
  const [championId, setChampionId] = useState(0);
  const [reference, setReference] = useState<BuildReferenceData | null>(null);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [selectedCards, setSelectedCards] = useState<CardSelection[]>([]);
  const [selectedItems, setSelectedItems] = useState<ItemSelection[]>([]);
  const [loadingReference, setLoadingReference] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadoutOpen, setLoadoutOpen] = useState(false);
  const [loadouts, setLoadouts] = useState<PlayerLoadout[]>([]);
  const [loadingLoadouts, setLoadingLoadouts] = useState(false);
  const [pendingLoadout, setPendingLoadout] = useState<PlayerLoadout | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchChampions({ limit: "200" })
      .then((rows) => {
        if (!cancelled) setChampions([...rows].sort((left, right) => left.name.localeCompare(right.name)));
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : t("generated.builds.failedToLoadChampions"));
      });
    return () => { cancelled = true; };
  }, [t]);

  const champion = useMemo(() => champions.find((entry) => entry.id === championId), [championId, champions]);

  useEffect(() => {
    if (!champion) {
      setReference(null);
      return;
    }
    let cancelled = false;
    setLoadingReference(true);
    setReference(null);
    setError(null);
    loadBuildReferenceData(champion.id, championSlug(champion.name))
      .then((value) => { if (!cancelled) setReference(value); })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : t("generated.builds.failedToLoadChampionBuildReferences"));
      })
      .finally(() => { if (!cancelled) setLoadingReference(false); });
    return () => { cancelled = true; };
  }, [champion, t]);

  useEffect(() => {
    if (
      !reference
      || !pendingLoadout
      || pendingLoadout.championId !== championId
      || reference.championId !== championId
    ) return;
    const cardIds = new Set(reference.cards.map((card) => card.id));
    const talentIds = new Set(reference.talents.map((talent) => talent.id));
    setSelectedCards(pendingLoadout.cardIds.slice(0, MAX_CARDS).flatMap((id, index) => (
      cardIds.has(id) ? [{ id, level: Math.max(1, Math.min(5, pendingLoadout.cardLevels[index] ?? 1)) }] : []
    )));
    setSelectedTalentId(pendingLoadout.talentId && talentIds.has(pendingLoadout.talentId) ? pendingLoadout.talentId : null);
    setSelectedItems([]);
    setImportNotice(t("diminishingReturns.imported", { name: pendingLoadout.loadoutName }));
    setPendingLoadout(null);
  }, [championId, pendingLoadout, reference, t]);

  useEffect(() => {
    if (!loadoutOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [loadoutOpen]);

  const cardSelections = useMemo(() => new Map(selectedCards.map((entry) => [entry.id, entry.level])), [selectedCards]);
  const itemSelections = useMemo(() => new Map(selectedItems.map((entry) => [entry.id, entry.level])), [selectedItems]);
  const pointTotal = selectedCards.reduce((sum, card) => sum + card.level, 0);

  const selectedTalent = reference?.talents.find((talent) => talent.id === selectedTalentId) ?? null;
  const effectAnalysis = useMemo(() => {
    if (!reference) return { effects: [] as DetectedEffect[], unsupported: [] as Array<{ id: number; name: string; description: string }> };
    const values: DetectedEffect[] = [];
    const unsupported: Array<{ id: number; name: string; description: string }> = [];
    const collect = (input: Parameters<typeof detectDescriptionEffects>[0]) => {
      const detected = detectDescriptionEffects(input);
      values.push(...detected);
      const hasWeaponOverride = input.type === "talent" && extractWeaponDamageOverride(input.description) != null;
      if (!detected.length && !hasWeaponOverride) unsupported.push({ id: input.id, name: input.name, description: resolveScaledDescription(input.description, input.level ?? 1) });
    };
    if (selectedTalent) {
      collect({ id: selectedTalent.id, name: selectedTalent.name, type: "talent", description: selectedTalent.description });
    }
    for (const selection of selectedCards) {
      const card = reference.cards.find((entry) => entry.id === selection.id);
      if (card) collect({ id: card.id, name: card.name, type: "card", description: card.description, level: selection.level });
    }
    for (const selection of selectedItems) {
      const item = reference.items.find((entry) => entry.id === selection.id);
      if (item) {
        const tierDescription = itemDescriptionAtLevel(item, selection.level);
        const description = tierDescription ?? (item.descriptionKey ? t(item.descriptionKey) : null);
        collect({ id: item.id, name: item.name, type: "item", description, level: tierDescription ? 1 : selection.level });
      }
    }
    return { effects: values, unsupported };
  }, [reference, selectedCards, selectedItems, selectedTalent, t]);
  const effects = effectAnalysis.effects;
  const unsupportedEffects = effectAnalysis.unsupported;

  const groupedEffects = useMemo(() => new Map(
    EFFECT_ORDER.flatMap((key) => EFFECT_TARGET_ORDER.map((target) => [
      effectGroupKey(key, target),
      effects.filter((entry) => entry.key === key && entry.target === target),
    ] as const)),
  ), [effects]);
  const baseHealth = parseNumber(reference?.champion?.stats.health);
  const baseSpeed = parseNumber(reference?.champion?.stats.speed);
  const primaryDamage = parseNumber(reference?.champion?.skills[0]?.damage);
  const baseShield = reference?.champion?.skills.reduce((maximum, skill) => {
    if (!/shield/i.test(skill.description ?? "")) return maximum;
    const described = String(skill.description ?? "").match(/shield[^.]*?(?:with|has|of)\s+([\d,.]+)\s+(?:maximum )?health/i);
    return Math.max(maximum, parseNumber(described?.[1]) || parseNumber(skill.damage));
  }, 0) ?? 0;
  const weaponOverride = extractWeaponDamageOverride(selectedTalent?.description);

  function resetForChampion(nextChampionId: number) {
    setChampionId(nextChampionId);
    setSelectedTalentId(null);
    setSelectedCards([]);
    setSelectedItems([]);
    setPendingLoadout(null);
    setImportNotice(null);
  }

  function toggleCard(card: BuildCardReference) {
    setSelectedCards((current) => {
      if (current.some((entry) => entry.id === card.id)) return current.filter((entry) => entry.id !== card.id);
      return current.length >= MAX_CARDS ? current : [...current, { id: card.id, level: 3 }];
    });
  }

  function toggleItem(item: BuildItemReference) {
    setSelectedItems((current) => {
      if (current.some((entry) => entry.id === item.id)) return current.filter((entry) => entry.id !== item.id);
      return current.length >= MAX_ITEMS ? current : [...current, { id: item.id, level: 1 }];
    });
  }

  async function openLoadouts() {
    if (!user?.linkedPlayerId) return;
    setLoadoutOpen(true);
    setLoadingLoadouts(true);
    setError(null);
    try {
      const response = await fetchPlayerLoadouts(user.linkedPlayerId);
      setLoadouts(response.loadouts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("diminishingReturns.loadoutUnavailable"));
      setLoadouts([]);
    } finally {
      setLoadingLoadouts(false);
    }
  }

  function importLoadout(loadout: PlayerLoadout) {
    setLoadoutOpen(false);
    setPendingLoadout(loadout);
    setChampionId(loadout.championId);
    setSelectedTalentId(null);
    setSelectedCards([]);
    setSelectedItems([]);
  }

  function rawEstimate(key: EffectKey, final: number, flatValue: number) {
    if (key === "movement-speed" && baseSpeed) return t("diminishingReturns.speedRaw", { value: formatNumber(baseSpeed * (1 + final / 100), { maximumFractionDigits: 1 }) });
    if (key === "mount-speed") return t("diminishingReturns.mountRaw", { value: formatNumber(1 + final / 100, { maximumFractionDigits: 3 }) });
    if ((key === "damage-reduction-direct" || key === "damage-reduction-area") && baseHealth && final < 100) return t("diminishingReturns.effectiveHealthRaw", { value: formatNumber(baseHealth / (1 - final / 100), { maximumFractionDigits: 0 }) });
    if (key === "life-steal" && (weaponOverride || primaryDamage)) return t("diminishingReturns.lifeStealRaw", { value: formatNumber((weaponOverride || primaryDamage) * final / 100, { maximumFractionDigits: 1 }) });
    if (key === "healing-received") return t("diminishingReturns.healingRaw", { value: formatNumber(1000 * (1 + final / 100), { maximumFractionDigits: 0 }) });
    if (key === "crowd-control-reduction") return t("diminishingReturns.durationRaw", { value: formatNumber(Math.max(0, 1 - final / 100), { maximumFractionDigits: 3 }) });
    if (key === "cooldown-reduction") return t("diminishingReturns.cooldownRaw", { value: formatNumber(Math.max(0, 1 - final / 100), { maximumFractionDigits: 3 }) });
    if (key === "reload-speed") return t("diminishingReturns.reloadRaw", { value: formatNumber(Math.max(0, 1 - final / 100), { maximumFractionDigits: 3 }) });
    if (key === "ultimate-charge") return t("diminishingReturns.chargeRaw", { value: formatNumber(1 + final / 100, { maximumFractionDigits: 3 }) });
    if (key === "weapon-damage" && (weaponOverride || primaryDamage)) return t("diminishingReturns.weaponDamagePlayersRaw", { value: formatNumber((weaponOverride || primaryDamage) * (1 + final / 100), { maximumFractionDigits: 1 }) });
    if (key === "weapon-damage-deployables" && (weaponOverride || primaryDamage)) return t("diminishingReturns.weaponDamageDeployablesRaw", { value: formatNumber((weaponOverride || primaryDamage) * (1 + final / 100), { maximumFractionDigits: 1 }) });
    if (key === "weapon-damage-shields" && (weaponOverride || primaryDamage)) return t("diminishingReturns.weaponDamageShieldsRaw", { value: formatNumber((weaponOverride || primaryDamage) * (1 + final / 100), { maximumFractionDigits: 1 }) });
    if (key === "maximum-health") return t("diminishingReturns.healthRaw", { value: formatNumber(baseHealth + flatValue) });
    if (key === "maximum-ammo") return t("diminishingReturns.ammoRaw", { value: formatNumber(flatValue) });
    if (key === "shield-health") return t("diminishingReturns.shieldRaw", { value: formatNumber(flatValue) });
    if (key === "shield-effectiveness" && baseShield) return t("diminishingReturns.shieldEffectivenessRaw", { value: formatNumber(baseShield * (1 + final / 100), { maximumFractionDigits: 0 }) });
    return null;
  }

  return (
    <div className="space-y-6">
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/60 bg-red-950/70 px-4 py-3 text-sm font-semibold text-red-100 shadow-lg shadow-red-950/20">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
        <p>{t("diminishingReturns.betaWarning")}</p>
      </div>
      <header className="relative overflow-hidden rounded-2xl border border-pc-accent/25 bg-gradient-to-br from-pc-bg-elevated via-pc-bg-elevated to-pc-accent/10 p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-pc-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-pc-accent/30 bg-pc-accent/10 text-pc-accent"><Calculator className="h-6 w-6" /></div>
            <h1 className="pc-heading pc-heading-lg">{t("diminishingReturns.title")}</h1>
            <p className="mt-2 text-sm leading-6 text-pc-text-secondary">{t("diminishingReturns.subtitle")}</p>
            <p className="mt-2 text-xs leading-5 text-pc-text-muted">{t("diminishingReturns.sourceNote")}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <a href="https://paladins.fandom.com/wiki/Diminishing_returns" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text-secondary hover:border-pc-accent-mid hover:text-pc-accent">{t("diminishingReturns.paladinsWiki")}<ExternalLink className="h-3.5 w-3.5" /></a>
            <a href="https://jscalc.io/embed/ol6wTNRhdYEyTWIl" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text-secondary hover:border-pc-accent-mid hover:text-pc-accent">{t("diminishingReturns.referenceCalculator")}<ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-pc-text">{t("diminishingReturns.champion")}</span>
            <select value={championId || ""} onChange={(event) => resetForChampion(Number(event.target.value))} className="w-full rounded-xl border border-pc-border bg-pc-bg-secondary px-4 py-3 text-pc-text outline-none focus:border-pc-accent">
              <option value="">{t("diminishingReturns.chooseChampion")}</option>
              {champions.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </label>
          <div>
            <button type="button" disabled={authLoading || !user?.linkedPlayerId} onClick={openLoadouts} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pc-accent/40 bg-pc-accent/10 px-4 py-3 text-sm font-semibold text-pc-accent transition-colors hover:bg-pc-accent/20 disabled:cursor-not-allowed disabled:opacity-45 lg:w-auto">
              <Download className="h-4 w-4" />{t("diminishingReturns.loadMyLoadout")}
            </button>
          </div>
        </div>
        {!authLoading && !user?.linkedPlayerId && <p className="text-xs text-pc-text-muted">{t("diminishingReturns.loadoutLoginRequired")}</p>}
        {importNotice && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{importNotice}</p>}
        {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
      </section>

      {loadingReference && <LoadingPanel />}

      {reference?.champion && (
        <>
          <section className="pc-card space-y-4">
            <div className="flex items-center gap-3">
              <img src={getChampionIconSafe(reference.champion.name)} alt="" className="h-14 w-14 rounded-xl object-contain" />
              <div><h2 className="pc-card-title">{reference.champion.name}</h2><p className="text-xs uppercase tracking-wider text-pc-text-muted">{t("diminishingReturns.baseStats")}</p></div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-pc-border border-y border-pc-border/70 py-3">
              <div className="pr-4"><span className="text-xs text-pc-text-muted">{t("diminishingReturns.health")}</span><div className="mt-1 font-mono text-xl font-bold text-pc-text">{formatNumber(baseHealth)}</div></div>
              <div className="pl-4"><span className="text-xs text-pc-text-muted">{t("diminishingReturns.movementSpeed")}</span><div className="mt-1 font-mono text-xl font-bold text-pc-text">{formatNumber(baseSpeed)}</div></div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-pc-text">{t("diminishingReturns.skills")}</h3>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {reference.champion.skills.map((skill, index) => {
                  const shieldMatch = String(skill.description ?? "").match(/shield[^.]*?(?:with|has|of)\s+([\d,.]+)\s+(?:maximum )?health/i);
                  const describedDamage = String(skill.description ?? "").match(/deal(?:ing|s)?\s+([\d,.]+)\s+(?:direct |area )?damage/i);
                  const shieldHealth = shieldMatch?.[1] ?? (/shield/i.test(skill.description ?? "") ? skill.damage : null);
                  const damage = shieldHealth ? null : index === 0 && weaponOverride ? String(weaponOverride) : skill.damage ?? describedDamage?.[1] ?? null;
                  const healing = skill.healing;
                  const summary = shieldHealth
                    ? t("diminishingReturns.skillShieldHealth", { health: shieldHealth })
                    : healing
                      ? t("diminishingReturns.skillHealing", { healing })
                      : damage && /^ultimate$/i.test(skill.cooldown ?? "")
                        ? t("diminishingReturns.skillDamageUltimate", { damage })
                        : damage && skill.cooldown
                    ? t("diminishingReturns.skillDamageCooldown", { damage, cooldown: skill.cooldown })
                    : damage
                      ? t("diminishingReturns.skillDamage", { damage })
                      : skill.cooldown
                        ? t("diminishingReturns.skillCooldown", { cooldown: skill.cooldown })
                        : t("diminishingReturns.noNumericDamage");
                  return <div key={`${skill.key}-${skill.name}`} className="flex items-center gap-3 border-b border-pc-border/70 py-3"><SelectableImage src={skill.iconUrl} alt={skill.name} /><div className="min-w-0"><div className="truncate text-sm font-semibold text-pc-text">{skill.name}</div><div className="mt-1 text-xs text-pc-text-secondary">{summary}</div></div></div>;
                })}
              </div>
              {weaponOverride && <p className="mt-2 text-xs text-pc-accent">{t("diminishingReturns.weaponOverride", { value: weaponOverride })}</p>}
            </div>
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.75fr)]">
            <div className="space-y-6">
              <section className="pc-card space-y-4">
                <div className="flex items-center justify-between"><div><h2 className="pc-card-title">{t("diminishingReturns.talent")}</h2><p className="text-xs text-pc-text-muted">{t("diminishingReturns.noTalent")}</p></div>{selectedTalentId && <button type="button" onClick={() => setSelectedTalentId(null)} className="text-xs text-pc-text-muted hover:text-pc-accent">{t("diminishingReturns.noTalent")}</button>}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  {reference.talents.map((talent: BuildTalentReference) => <SelectionCard key={talent.id} name={talent.name} description={talent.description} selected={talent.id === selectedTalentId} onToggle={() => setSelectedTalentId((current) => current === talent.id ? null : talent.id)} imageNode={<CanonicalTalentImage talentId={talent.id} talentName={talent.name} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-pc-border object-cover" fallbackClassName="h-11 w-11 shrink-0 rounded-lg border border-pc-border bg-pc-bg" />} />)}
                </div>
              </section>

              <section className="pc-card space-y-4">
                <div className="flex items-center justify-between gap-3"><div><h2 className="pc-card-title">{t("diminishingReturns.cards")}</h2><p className={selectedCards.length === 5 && pointTotal !== 15 ? "text-xs text-amber-300" : "text-xs text-pc-text-muted"}>{selectedCards.length === 5 && pointTotal !== 15 ? t("diminishingReturns.invalidPointTotal") : t("diminishingReturns.points", { points: pointTotal })}</p></div><span className="text-sm font-bold text-pc-accent">{t("diminishingReturns.cardsSelected", { count: selectedCards.length })}</span></div>
                <div className="grid gap-3 md:grid-cols-2">
                  {reference.cards.map((card) => {
                    const level = cardSelections.get(card.id);
                    return <SelectionCard key={card.id} name={card.name} image={card.iconUrl} description={resolveScaledDescription(card.description, level ?? 1)} selected={level != null} disabled={level == null && selectedCards.length >= MAX_CARDS} level={level} maximumLevel={5} onToggle={() => toggleCard(card)} onLevelChange={(next) => setSelectedCards((current) => current.map((entry) => entry.id === card.id ? { ...entry, level: next } : entry))} />;
                  })}
                </div>
              </section>

              <section className="pc-card space-y-4">
                <div className="flex items-center justify-between gap-3"><h2 className="pc-card-title">{t("diminishingReturns.items")}</h2><span className="text-sm font-bold text-pc-accent">{t("diminishingReturns.itemsSelected", { count: selectedItems.length })}</span></div>
                <div className="grid gap-3 md:grid-cols-2">
                  {reference.items.map((item) => {
                    const level = itemSelections.get(item.id);
                    const tierDescription = itemDescriptionAtLevel(item, level ?? 1);
                    const description = tierDescription ?? (item.descriptionKey ? t(item.descriptionKey) : null);
                    return <SelectionCard key={item.id} name={item.name} image={item.iconUrl} description={resolveScaledDescription(description, tierDescription ? 1 : level ?? 1)} selected={level != null} disabled={level == null && selectedItems.length >= MAX_ITEMS} level={level} maximumLevel={3} onToggle={() => toggleItem(item)} onLevelChange={(next) => setSelectedItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, level: next } : entry))} />;
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-5">
              <section className="pc-card space-y-4">
                <div><h2 className="pc-card-title">{t("diminishingReturns.results")}</h2><p className="mt-1 text-xs leading-5 text-pc-text-muted">{t("diminishingReturns.conditionalWarning")}</p></div>
                {effects.length === 0 ? <p className="rounded-xl border border-dashed border-pc-border p-5 text-sm leading-6 text-pc-text-muted">{t("diminishingReturns.emptyResults")}</p> : (
                  <div className="space-y-3">
                    {EFFECT_ORDER.flatMap((key) => EFFECT_TARGET_ORDER.flatMap((target) => {
                      const sources = groupedEffects.get(effectGroupKey(key, target)) ?? [];
                      if (!sources.length) return [];
                      const signedValues = sources.map((entry) => entry.direction === "decrease" ? -entry.value : entry.value);
                      const flat = key === "maximum-health" || key === "maximum-ammo" || key === "shield-health";
                      const additiveOnly = flat || key === "weapon-damage" || key === "weapon-damage-deployables" || key === "weapon-damage-shields";
                      const calculated = additiveOnly
                        ? calculateAdditiveValue(signedValues)
                        : calculateDiminishedValue(signedValues, { movement: key === "movement-speed" || key === "mount-speed", reload: key === "reload-speed" });
                      const raw = target === "self" || target === "unknown" ? rawEstimate(key, calculated.final, calculated.additive) : null;
                      const hasOpposition = calculated.positive.additive > 0 && calculated.negative.additive > 0;
                      return [<article key={effectGroupKey(key, target)} className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary/45">
                        <div className="border-b border-pc-border/70 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-pc-text">{t(EFFECT_LABELS[key])}</h3><span className="rounded-full border border-pc-border bg-pc-bg px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-pc-text-muted">{t(EFFECT_TARGET_LABELS[target])}</span></div>
                          <div className="mt-2 grid grid-cols-2 gap-2"><div><div className="text-xs uppercase tracking-wide text-pc-text-muted">{t("diminishingReturns.additive")}</div><div className="mt-0.5 font-mono text-lg font-bold text-pc-text">{flat ? t("diminishingReturns.signedFlatValue", { value: formatNumber(calculated.additive) }) : t("diminishingReturns.percentValue", { value: formatNumber(calculated.additive, { maximumFractionDigits: 2 }) })}</div></div><div><div className="text-xs uppercase tracking-wide text-pc-text-muted">{t(additiveOnly ? "diminishingReturns.afterStacking" : "diminishingReturns.afterDiminishing")}</div><div className="mt-0.5 font-mono text-lg font-bold text-pc-accent">{flat ? t("diminishingReturns.signedFlatValue", { value: formatNumber(calculated.final) }) : t("diminishingReturns.percentValue", { value: formatNumber(calculated.final, { maximumFractionDigits: 2 }) })}</div></div></div>
                          {!additiveOnly && (calculated.thresholdApplied || hasOpposition) && <div className="mt-2 space-y-1 rounded-lg border border-pc-border/70 bg-pc-bg px-2.5 py-2 text-xs text-pc-text-secondary">
                            {calculated.positive.additive > 0 && <p>{t("diminishingReturns.directionBreakdown", { direction: t("diminishingReturns.positiveGroup"), base: formatNumber(calculated.positive.guaranteedBase, { maximumFractionDigits: 2 }), subject: formatNumber(Math.max(0, calculated.positive.additive - calculated.positive.guaranteedBase), { maximumFractionDigits: 2 }), final: formatNumber(calculated.positive.final, { maximumFractionDigits: 2 }) })}</p>}
                            {calculated.negative.additive > 0 && <p>{t("diminishingReturns.directionBreakdown", { direction: t("diminishingReturns.opposingGroup"), base: formatNumber(calculated.negative.guaranteedBase, { maximumFractionDigits: 2 }), subject: formatNumber(Math.max(0, calculated.negative.additive - calculated.negative.guaranteedBase), { maximumFractionDigits: 2 }), final: formatNumber(calculated.negative.final, { maximumFractionDigits: 2 }) })}</p>}
                          </div>}
                          {calculated.lost > 0.005 && <p className="mt-1 text-xs text-amber-300">{t("diminishingReturns.reduction", { value: t("diminishingReturns.percentValue", { value: formatNumber(calculated.lost, { maximumFractionDigits: 2 }) }) })}</p>}{calculated.capped && <p className="mt-1 text-xs text-amber-300">{t("diminishingReturns.capApplied")}</p>}{raw && <p className="mt-2 rounded-lg bg-pc-bg px-2.5 py-2 text-xs text-pc-text-secondary"><span className="font-semibold text-pc-text">{t("diminishingReturns.rawEstimate")}:</span> {raw}</p>}
                        </div>
                        <div className="space-y-2 p-3">{sources.map((source, index) => { const signedValue = source.direction === "decrease" ? -source.value : source.value; return <div key={`${source.sourceType}-${source.sourceId}-${index}`}><div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-pc-text">{source.sourceName}</span><span className="font-mono text-pc-accent">{t(flat ? "diminishingReturns.signedFlatValue" : signedValue > 0 ? "diminishingReturns.signedPercentValue" : "diminishingReturns.percentValue", { value: formatNumber(signedValue, { maximumFractionDigits: 2 }) })}</span></div><p className="mt-0.5 text-xs leading-4 text-pc-text-muted">{source.description}</p></div>; })}</div>
                      </article>];
                    }))}
                  </div>
                )}
                {unsupportedEffects.length > 0 && <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <h3 className="text-sm font-semibold text-amber-200">{t("diminishingReturns.unsupportedTitle")}</h3>
                  <p className="mt-1 text-xs leading-5 text-pc-text-muted">{t("diminishingReturns.unsupportedDescription")}</p>
                  <div className="mt-2 space-y-2">{unsupportedEffects.map((source) => <div key={source.id}><p className="text-xs font-semibold text-pc-text">{source.name}</p><p className="text-xs leading-4 text-pc-text-muted">{source.description || t("diminishingReturns.noDetectedEffect")}</p></div>)}</div>
                </div>}
              </section>

              {effects.some((entry) => entry.key === "cooldown-reduction") && reference.champion.skills.some((skill) => parseNumber(skill.cooldown) > 0) && (() => {
                const cooldownSources = [
                  ...(groupedEffects.get(effectGroupKey("cooldown-reduction", "self")) ?? []),
                  ...(groupedEffects.get(effectGroupKey("cooldown-reduction", "unknown")) ?? []),
                ];
                const cooldown = calculateDiminishedValue(cooldownSources.map((entry) => entry.direction === "decrease" ? -entry.value : entry.value)).final;
                return <section className="pc-card"><h2 className="mb-3 text-sm font-semibold text-pc-text">{t("diminishingReturns.adjustedCooldowns")}</h2><div className="space-y-2">{reference.champion.skills.flatMap((skill) => { const seconds = parseNumber(skill.cooldown); return seconds > 0 ? [<div key={skill.name} className="flex items-center justify-between gap-3 text-xs"><span className="text-pc-text-secondary">{skill.name}</span><span className="font-mono font-semibold text-pc-accent">{t("diminishingReturns.secondsValue", { value: formatNumber(seconds * (1 - cooldown / 100), { maximumFractionDigits: 2 }) })}</span></div>] : []; })}</div></section>;
              })()}

              <section className="pc-card space-y-3 text-xs leading-5 text-pc-text-secondary"><div className="flex items-center gap-2 text-sm font-semibold text-pc-text"><Info className="h-4 w-4 text-pc-accent" />{t("diminishingReturns.formulaTitle")}</div><p>{t("diminishingReturns.formulaHighest")}</p><p>{t("diminishingReturns.formulaCaps")}</p><p>{t("diminishingReturns.formulaOpposing")}</p><p className="border-t border-pc-border pt-3 text-pc-text-muted">{t("diminishingReturns.estimatedDisclaimer")}</p></section>
            </aside>
          </div>
        </>
      )}

      {!championId && <section className="pc-card flex items-center justify-between gap-4 text-sm text-pc-text-secondary"><span>{t("diminishingReturns.chooseChampion")}</span><ChevronRight className="h-4 w-4 text-pc-accent" /></section>}

      {loadoutOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="loadout-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoadoutOpen(false); }}>
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-elevated shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-pc-border p-4 sm:p-5"><div><h2 id="loadout-dialog-title" className="pc-card-title">{t("diminishingReturns.savedLoadouts")}</h2><p className="mt-1 text-xs leading-5 text-pc-text-secondary">{t("diminishingReturns.savedLoadoutsDescription")}</p></div><button type="button" onClick={() => setLoadoutOpen(false)} className="rounded-lg p-2 text-pc-text-muted hover:bg-pc-bg-secondary hover:text-pc-text" aria-label={t("diminishingReturns.close")}><X className="h-5 w-5" /></button></div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {loadingLoadouts ? <LoadingPanel /> : loadouts.length === 0 ? <p className="rounded-xl border border-dashed border-pc-border p-8 text-center text-sm text-pc-text-muted">{t("diminishingReturns.noSavedLoadouts")}</p> : <div className="grid gap-3 sm:grid-cols-2">{loadouts.map((loadout) => <button key={loadout.id} type="button" onClick={() => importLoadout(loadout)} className="flex items-center gap-3 rounded-xl border border-pc-border bg-pc-bg-secondary/50 p-3 text-left transition-colors hover:border-pc-accent-mid"><img src={getChampionIconSafe(loadout.championName)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-contain" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-pc-text">{loadout.loadoutName}</span><span className="mt-1 block text-xs text-pc-text-muted">{loadout.championName} · {t("diminishingReturns.points", { points: loadout.cardLevels.reduce((sum, level) => sum + level, 0) })}</span></span><span className="shrink-0 text-xs font-semibold text-pc-accent">{t("diminishingReturns.load")}</span></button>)}</div>}
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-pc-text-muted"><Link href="/community" className="hover:text-pc-accent">← {t("nav.community")}</Link></div>
    </div>
  );
}
