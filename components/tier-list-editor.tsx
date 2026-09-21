/**
 * Render tier list editor with `LoadingIndicator`.
 * refs: none
 */
"use client";

import { Fragment, useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import { fetchChampions, getAuthToken, hasCookieAuthSession, type Champion } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getChampionUltimate, type ChampionUltimate } from "@/lib/champion-data";
import { mapLoadingImagePath } from "@/lib/map-images";
import { getMapTierItem, MAP_TIER_CLASSIFICATIONS, MAP_TIER_ITEMS } from "@/lib/map-tier-list";
import {
  createTierList,
  updateTierList,
  type TierListEntry,
  type TierListMode,
  type TierListSummary,
  type TierName,
} from "@/lib/tierlists-api";
import { TIER_ORDER, tierTone } from "@/components/tier-list-board";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import ContextBackLink from "@/components/context-back-link";

type GroupKey = TierName | "tray";
type Groups = Record<GroupKey, string[]>;

function emptyGroups(): Groups {
  return { S: [], A: [], B: [], C: [], D: [], F: [], tray: [] };
}

function entryKey(entry: TierListEntry): string {
  return entry.entityType === "map" ? entry.mapName : String(entry.championId);
}

function groupsFromEntries(itemKeys: string[], entries: TierListEntry[] = []): Groups {
  const groups = emptyGroups();
  const currentItemKeys = new Set(itemKeys);
  const placed = new Set<string>();
  for (const tier of TIER_ORDER) {
    groups[tier] = entries
      .filter((entry) => entry.tier === tier && currentItemKeys.has(entryKey(entry)))
      .sort((a, b) => a.position - b.position)
      .map(entryKey)
      .filter((itemKey) => {
        if (placed.has(itemKey)) return false;
        placed.add(itemKey);
        return true;
      });
  }
  groups.tray = itemKeys.filter((itemKey) => !placed.has(itemKey));
  return groups;
}

/**
 * Render tier list editor with `LoadingIndicator`.
 * refs: none
 * I/O types: `{ initialList, }: { initialList?: TierListSummary; } -> JSX.Element`.
 */
export default function TierListEditor({
  initialList,
}: {
  initialList?: TierListSummary;
}) {
  const { t } = useLocalization();
  const router = useRouter();
  const [champions, setChampions] = useState<Champion[]>([]);
  const [ultimates, setUltimates] = useState<Record<number, ChampionUltimate>>({});
  const [groups, setGroups] = useState<Groups>(() => initialList?.mode === "map"
    ? groupsFromEntries(MAP_TIER_ITEMS.map((item) => item.name), initialList.entries)
    : emptyGroups());
  const [title, setTitle] = useState(initialList?.title ?? "");
  const [description, setDescription] = useState(initialList?.description ?? "");
  const [mode, setMode] = useState<TierListMode>(initialList?.mode ?? "champion");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = initialList != null;

  useEffect(() => {
    let active = true;
    fetchChampions({ limit: "200" })
      .then(async (rows) => {
        const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        const resolved = await Promise.all(sorted.map(async (champion) => [champion.id, await getChampionUltimate(champion.name).catch(() => undefined)] as const));
        if (!active) return;
        const nextUltimates: Record<number, ChampionUltimate> = {};
        for (const [championId, ultimate] of resolved) {
          if (ultimate) nextUltimates[championId] = ultimate;
        }
        setChampions(sorted);
        setUltimates(nextUltimates);
        const initialMode = initialList?.mode ?? "champion";
        setGroups(groupsFromEntries(
          initialMode === "map" ? MAP_TIER_ITEMS.map((item) => item.name) : sorted.map((champion) => String(champion.id)),
          initialList?.entries,
        ));
        if (sorted.length === 0) setError(t("tierLists.loadError"));
      })
      .catch(() => { if (active) setError(t("tierLists.loadError")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [initialList, t]);

  const championsById = useMemo(
    () => new Map(champions.map((champion) => [champion.id, champion])),
    [champions],
  );
  function itemKeysForMode(nextMode: TierListMode): string[] {
    return nextMode === "map"
      ? MAP_TIER_ITEMS.map((item) => item.name)
      : champions.map((champion) => String(champion.id));
  }

  function changeMode(nextMode: TierListMode) {
    setMode(nextMode);
    setGroups(groupsFromEntries(
      itemKeysForMode(nextMode),
      nextMode === initialList?.mode ? initialList.entries : [],
    ));
  }

  const placedCount = TIER_ORDER.reduce((total, tier) => total + groups[tier].length, 0);

  function moveItem(itemKey: string, target: GroupKey) {
    setGroups((current) => {
      const next = emptyGroups();
      for (const group of [...TIER_ORDER, "tray"] as GroupKey[]) {
        next[group] = current[group].filter((key) => key !== itemKey);
      }
      next[target] = [...next[target], itemKey];
      return next;
    });
  }

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function dropInto(event: DragEvent<HTMLElement>, target: GroupKey) {
    event.preventDefault();
    const itemKey = event.dataTransfer.getData("application/x-paladinscat-tier-item");
    if (itemKey) moveItem(itemKey, target);
  }

  function reset() {
    setGroups(groupsFromEntries(
      itemKeysForMode(mode),
      mode === initialList?.mode ? initialList.entries : [],
    ));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const token = getAuthToken();
    if (!token && !hasCookieAuthSession()) {
      setError(t("tierLists.loginRequired"));
      return;
    }
    const entries = TIER_ORDER.flatMap((tier) => groups[tier].map((itemKey, position) => (
      mode === "map"
        ? { mapName: getMapTierItem(itemKey)?.name ?? itemKey, tier, position }
        : { championId: Number(itemKey), tier, position }
    )));
    if (entries.length === 0) {
      setError(t("tierLists.placementRequired"));
      return;
    }
    setSaving(true);
    try {
      const input = { title: title.trim(), description: description.trim(), mode, entries, token };
      const result = editing
        ? await updateTierList(initialList.id, input)
        : await createTierList(input);
      router.push(`/tierlists/${result.postId}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t(
        editing
          ? "tierLists.updateError"
          : "generated.tierlists.create.page.failedtopublishtierlist",
      ));
      setSaving(false);
    }
  }

  if (loading) return <div className="py-20 text-center"><LoadingIndicator /></div>;

  const itemCard = (itemKey: string, group: GroupKey) => {
    if (mode === "map") {
      const map = getMapTierItem(itemKey);
      if (!map) return null;
      return <div key={map.name} title={map.name} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-paladinscat-tier-item", map.name); }} className="group relative flex w-28 cursor-grab flex-col items-center rounded-lg border border-pc-border bg-pc-bg p-1.5 active:cursor-grabbing sm:w-32">
        <SmartImage src={mapLoadingImagePath(map.name)} alt={map.name} className="aspect-video w-full rounded object-cover" />
        <span className="mt-1 w-full truncate text-center text-xs text-pc-text-secondary">{map.name}</span>
        <span className="w-full truncate text-center text-xs text-pc-text-muted">{map.classifications.join(" · ")}</span>
        <select aria-label={t("tierLists.moveItem", { name: map.name })} value={group === "tray" ? "" : group} onChange={(event) => moveItem(map.name, (event.target.value || "tray") as GroupKey)} className="mt-1 w-full rounded border border-pc-border bg-pc-bg-secondary px-0.5 py-0.5 text-xs text-pc-text sm:hidden">
          <option value="">{t("tierLists.tray")}</option>{TIER_ORDER.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
        </select>
      </div>;
    }
    const champion = championsById.get(Number(itemKey));
    if (!champion) return null;
    const ultimate = mode === "ultimate" ? ultimates[champion.id] : undefined;
    const label = ultimate?.name ?? champion.name;
    const image = ultimate?.iconUrl ?? getChampionIconSafe(champion.name);
    return <div key={champion.id} title={label} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-paladinscat-tier-item", String(champion.id)); }} className="group relative flex w-16 cursor-grab flex-col items-center rounded-lg border border-pc-border bg-pc-bg p-1.5 active:cursor-grabbing sm:w-20">
      <img src={image} alt={label} className="h-10 w-10 rounded object-contain sm:h-12 sm:w-12" />
      <span className="mt-1 w-full truncate text-center text-xs text-pc-text-secondary">{label}</span>
      {ultimate && <span className="w-full truncate text-center text-xs text-pc-text-muted">{champion.name}</span>}
      <select aria-label={t("tierLists.moveItem", { name: label })} value={group === "tray" ? "" : group} onChange={(event) => moveItem(String(champion.id), (event.target.value || "tray") as GroupKey)} className="mt-1 w-full rounded border border-pc-border bg-pc-bg-secondary px-0.5 py-0.5 text-xs text-pc-text sm:hidden">
        <option value="">{t("tierLists.tray")}</option>{TIER_ORDER.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
      </select>
    </div>;
  };

  return <form onSubmit={submit} className="space-y-6">
    <div><ContextBackLink fallbackHref={initialList ? `/tierlists/${initialList.id}` : "/tierlists"} label={t("tierLists.back")} className="text-xs text-pc-accent hover:underline" /><h1 className="mt-2 pc-heading pc-heading-lg text-pc-accent">{t(editing ? "tierLists.edit" : "tierLists.create")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("tierLists.description")}</p></div>
    {error && <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div>}
    <div className="space-y-4 rounded-xl border border-pc-border bg-pc-bg-elevated p-4">
      <label className="block text-xs text-pc-text-secondary">{t("tierLists.mode")}<select value={mode} onChange={(event) => changeMode(event.target.value as TierListMode)} className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text sm:max-w-xs"><option value="champion">{t("tierLists.championMode")}</option><option value="ultimate">{t("tierLists.ultimateMode")}</option><option value="map">{t("tierLists.mapMode")}</option></select></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-xs text-pc-text-secondary">{t("tierLists.name")}<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("tierLists.namePlaceholder")} className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text" /></label>
        <label className="text-xs text-pc-text-secondary">{t("tierLists.notes")}<textarea maxLength={4000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("tierLists.notesPlaceholder")} className="mt-1.5 w-full resize-y rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text" /></label>
      </div>
    </div>
    <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary/50">
      {TIER_ORDER.map((tier) => <section key={tier} onDragOver={allowDrop} onDrop={(event) => dropInto(event, tier)} className="grid grid-cols-[3.5rem_minmax(0,1fr)] border-b border-pc-border/70 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <div className={`flex items-center justify-center border-r text-2xl font-black sm:text-3xl ${tierTone(tier)}`}>{tier}</div>
        <div className="flex min-h-24 flex-wrap content-start gap-2 p-2 sm:p-3">{groups[tier].length === 0 && <span className="m-auto text-xs text-pc-text-muted">{t(mode === "ultimate" ? "tierLists.dropUltimateHere" : mode === "map" ? "tierLists.dropMapHere" : "tierLists.dropHere")}</span>}{groups[tier].map((itemKey) => itemCard(itemKey, tier))}</div>
      </section>)}
      <section onDragOver={allowDrop} onDrop={(event) => dropInto(event, "tray")} className="p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-pc-text">{t(mode === "ultimate" ? "tierLists.ultimateTray" : mode === "map" ? "tierLists.mapTray" : "tierLists.championTray")}</h2><p className="text-xs text-pc-text-muted">{t(mode === "ultimate" ? "tierLists.ultimateTrayHelp" : mode === "map" ? "tierLists.mapTrayHelp" : "tierLists.trayHelp")}</p>{mode === "map" && <div className="mt-2 flex flex-wrap gap-1.5">{MAP_TIER_CLASSIFICATIONS.map((classification) => <span key={classification} className="rounded-full border border-pc-border px-2 py-0.5 text-xs text-pc-text-muted">{classification}</span>)}</div>}<p className="mt-1 text-xs text-pc-accent">{t("tierLists.partialHint")}</p></div><span className={groups.tray.length === 0 ? "text-xs font-semibold text-emerald-400" : "text-xs font-semibold text-pc-accent"}>{groups.tray.length === 0 ? t(mode === "ultimate" ? "tierLists.allUltimatesPlaced" : mode === "map" ? "tierLists.allMapsPlaced" : "tierLists.allPlaced") : t(mode === "ultimate" ? "tierLists.unplacedUltimates" : mode === "map" ? "tierLists.unplacedMaps" : "tierLists.unplaced", { count: groups.tray.length })}</span></div><div className="flex min-h-20 flex-wrap gap-2">{groups.tray.map((itemKey, index) => { const map = mode === "map" ? getMapTierItem(itemKey) : undefined; const previousMap = mode === "map" && index > 0 ? getMapTierItem(groups.tray[index - 1]) : undefined; return <Fragment key={itemKey}>{map && (!previousMap || previousMap.primaryClassification !== map.primaryClassification) && <div className="basis-full border-b border-pc-border/70 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-pc-text-muted">{map.primaryClassification} {t("menu.maps")}</div>}{itemCard(itemKey, "tray")}</Fragment>; })}</div></section>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-pc-text-muted">{t(mode === "ultimate" ? (placedCount === 1 ? "tierLists.placedUltimateOne" : "tierLists.placedUltimateMany") : mode === "map" ? (placedCount === 1 ? "tierLists.placedMapOne" : "tierLists.placedMapMany") : (placedCount === 1 ? "tierLists.placedOne" : "tierLists.placedMany"), { count: placedCount })}</span><div className="flex gap-3"><button type="button" onClick={reset} className="rounded-lg border border-pc-border px-4 py-2 text-sm text-pc-text-secondary hover:text-pc-text">{t("tierLists.reset")}</button><button type="submit" disabled={saving || !title.trim() || placedCount === 0 || itemKeysForMode(mode).length === 0} className="rounded-lg bg-pc-accent px-5 py-2 text-sm font-semibold text-white hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50">{saving ? t(editing ? "tierLists.updating" : "tierLists.saving") : t(editing ? "tierLists.update" : "tierLists.save")}</button></div></div>
  </form>;
}
