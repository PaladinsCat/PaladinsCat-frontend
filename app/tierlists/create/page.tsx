"use client";

import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchChampions, getAuthToken, type Champion } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { createTierList, type TierName } from "@/lib/tierlists-api";
import { TIER_ORDER, tierTone } from "@/components/tier-list-board";
import { LoadingIndicator } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

type GroupKey = TierName | "tray";
type Groups = Record<GroupKey, number[]>;

function emptyGroups(): Groups {
  return { S: [], A: [], B: [], C: [], D: [], F: [], tray: [] };
}

export default function CreateTierListPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [champions, setChampions] = useState<Champion[]>([]);
  const [groups, setGroups] = useState<Groups>(emptyGroups);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChampions({ limit: "200" })
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name));
        setChampions(sorted);
        setGroups({ ...emptyGroups(), tray: sorted.map((champion) => champion.id) });
        if (sorted.length === 0) setError(t("tierLists.loadError"));
      })
      .catch(() => setError(t("tierLists.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const championsById = useMemo(() => new Map(champions.map((champion) => [champion.id, champion])), [champions]);

  function moveChampion(championId: number, target: GroupKey) {
    setGroups((current) => {
      const next = emptyGroups();
      for (const group of [...TIER_ORDER, "tray"] as GroupKey[]) next[group] = current[group].filter((id) => id !== championId);
      next[target] = [...next[target], championId];
      return next;
    });
  }

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function dropInto(event: DragEvent<HTMLElement>, target: GroupKey) {
    event.preventDefault();
    const championId = Number(event.dataTransfer.getData("application/x-paladinscat-champion"));
    if (Number.isInteger(championId)) moveChampion(championId, target);
  }

  function reset() {
    setGroups({ ...emptyGroups(), tray: champions.map((champion) => champion.id) });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const token = getAuthToken();
    if (!token) {
      setError(t("tierLists.loginRequired"));
      return;
    }
    if (groups.tray.length > 0) {
      setError(t("tierLists.completeRequired"));
      return;
    }
    setSaving(true);
    try {
      const entries = TIER_ORDER.flatMap((tier) => groups[tier].map((championId, position) => ({ championId, tier, position })));
      const result = await createTierList({ title: title.trim(), description: description.trim(), entries, token });
      router.push(`/tierlists/${result.postId}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("generated.tierlists.create.page.failedtopublishtierlist"));
      setSaving(false);
    }
  }

  if (loading) return <div className="py-20 text-center"><LoadingIndicator /></div>;

  const championCard = (championId: number, group: GroupKey) => {
    const champion = championsById.get(championId);
    if (!champion) return null;
    return <div key={champion.id} draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-paladinscat-champion", String(champion.id)); }} className="group relative flex w-16 cursor-grab flex-col items-center rounded-lg border border-pc-border bg-pc-bg p-1.5 active:cursor-grabbing sm:w-20">
      <img src={getChampionIconSafe(champion.name)} alt="" className="h-10 w-10 rounded object-contain sm:h-12 sm:w-12" />
      <span className="mt-1 w-full truncate text-center text-[9px] text-pc-text-secondary sm:text-[10px]">{champion.name}</span>
      <select aria-label={t("tierLists.moveChampion", { name: champion.name })} value={group === "tray" ? "" : group} onChange={(event) => moveChampion(champion.id, (event.target.value || "tray") as GroupKey)} className="mt-1 w-full rounded border border-pc-border bg-pc-bg-secondary px-0.5 py-0.5 text-[9px] text-pc-text sm:hidden">
        <option value="">{t("tierLists.tray")}</option>{TIER_ORDER.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
      </select>
    </div>;
  };

  return <form onSubmit={submit} className="space-y-6">
    <div><Link href="/tierlists" className="text-xs text-pc-accent hover:underline">{t("tierLists.back")}</Link><h1 className="mt-2 pc-heading pc-heading-lg text-pc-accent">{t("tierLists.create")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("tierLists.description")}</p></div>
    {error && <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div>}
    <div className="grid gap-4 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 md:grid-cols-2">
      <label className="text-xs text-pc-text-secondary">{t("tierLists.name")}<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("tierLists.namePlaceholder")} className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text" /></label>
      <label className="text-xs text-pc-text-secondary">{t("tierLists.notes")}<textarea maxLength={4000} rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("tierLists.notesPlaceholder")} className="mt-1.5 w-full resize-y rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text" /></label>
    </div>
    <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary/50">
      {TIER_ORDER.map((tier) => <section key={tier} onDragOver={allowDrop} onDrop={(event) => dropInto(event, tier)} className="grid grid-cols-[3.5rem_minmax(0,1fr)] border-b border-pc-border/70 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <div className={`flex items-center justify-center border-r text-2xl font-black sm:text-3xl ${tierTone(tier)}`}>{tier}</div>
        <div className="flex min-h-24 flex-wrap content-start gap-2 p-2 sm:p-3">{groups[tier].length === 0 && <span className="m-auto text-xs text-pc-text-muted">{t("tierLists.dropHere")}</span>}{groups[tier].map((id) => championCard(id, tier))}</div>
      </section>)}
      <section onDragOver={allowDrop} onDrop={(event) => dropInto(event, "tray")} className="p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-pc-text">{t("tierLists.championTray")}</h2><p className="text-[11px] text-pc-text-muted">{t("tierLists.trayHelp")}</p></div><span className={groups.tray.length === 0 ? "text-xs font-semibold text-emerald-400" : "text-xs font-semibold text-pc-accent"}>{groups.tray.length === 0 ? t("tierLists.allPlaced") : t("tierLists.unplaced", { count: groups.tray.length })}</span></div><div className="flex min-h-20 flex-wrap gap-2">{groups.tray.map((id) => championCard(id, "tray"))}</div></section>
    </div>
    <div className="flex flex-wrap items-center justify-end gap-3"><button type="button" onClick={reset} className="rounded-lg border border-pc-border px-4 py-2 text-sm text-pc-text-secondary hover:text-pc-text">{t("tierLists.reset")}</button><button type="submit" disabled={saving || !title.trim() || groups.tray.length > 0 || champions.length === 0} className="rounded-lg bg-pc-accent px-5 py-2 text-sm font-semibold text-white hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50">{saving ? t("tierLists.saving") : t("tierLists.save")}</button></div>
  </form>;
}
