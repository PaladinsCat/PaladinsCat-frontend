"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import ChampionLoadoutGrid from "@/components/champion-loadout-grid";
import ContextBackLink from "@/components/context-back-link";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { getChampionData, type ChampionData, type ChampionTalent } from "@/lib/champion-data";
import {
  fetchChampionCardStats,
  fetchChampions,
  fetchChampionTalentStats,
  type ChampionCardStatsResponse,
  type ChampionTalentStat,
} from "@/lib/api-client";
import { getStatQuality } from "@/lib/stat-quality";
import { championSlug } from "@/lib/utils";

function parsePositiveInteger(value: string | string[] | null | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function statNameKey(value: string | null | undefined): string {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatPlays(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function ChampionTalentDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawName = params?.name;
  const name = Array.isArray(rawName) ? rawName[0] ?? "" : rawName ?? "";
  const talentId = parsePositiveInteger(params?.talentId);

  const [championData, setChampionData] = useState<ChampionData | null>(null);
  const [talentStat, setTalentStat] = useState<ChampionTalentStat | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [cardStats, setCardStats] = useState<ChampionCardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!name || !talentId) {
      setLoading(false);
      setError("Invalid talent route.");
      return;
    }

    Promise.all([fetchChampions(), getChampionData(name)])
      .then(async ([champions, localData]) => {
        const champion = champions.find((entry) => championSlug(entry.name) === name.toLowerCase());
        if (!champion) throw new Error("Champion not found.");
        if (!localData) throw new Error("Champion reference data is unavailable.");

        const [talentStats, filteredCardStats] = await Promise.all([
          fetchChampionTalentStats(champion.id),
          fetchChampionCardStats(champion.id, "ranked", talentId),
        ]);
        const selectedTalent = talentStats.talents.find((talent) => talent.talentId === talentId);
        if (!selectedTalent) throw new Error("Talent statistics not found.");
        if (cancelled) return;

        setChampionData(localData);
        setTalentStat(selectedTalent);
        setTotalMatches(talentStats.totalMatches);
        setCardStats(filteredCardStats);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setChampionData(null);
        setTalentStat(null);
        setCardStats(null);
        setError(reason instanceof Error ? reason.message : "Unable to load talent statistics.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, talentId]);

  const talentMeta = useMemo<ChampionTalent | null>(() => {
    if (!championData || !talentStat) return null;
    return championData.talents.find((talent) => statNameKey(talent.name) === statNameKey(talentStat.talentName)) ?? null;
  }, [championData, talentStat]);

  const currentLocation = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  if (loading) return <RouteSkeleton variant="detail" />;

  if (error || !championData || !talentStat || !cardStats || !talentId) {
    return (
      <div className="space-y-4">
        <ContextBackLink fallbackHref={`/champions/${name}`} />
        <ErrorState title="Talent statistics unavailable" message={error ?? "No talent data is available for this queue."} />
      </div>
    );
  }

  const pickRate = totalMatches > 0 ? (talentStat.totalPlays / totalMatches) * 100 : 0;
  const quality = getStatQuality(talentStat.winRate, pickRate, 100);
  const talentImageUrl = talentMeta?.iconUrl || `/images/champions/Talent ${championData.name} ${talentStat.talentName}.png`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ContextBackLink fallbackHref={`/champions/${name}`} />
        <span className="text-pc-text-muted" aria-hidden="true">/</span>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{talentStat.talentName}</h1>
      </div>

      <section className="pc-card">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr]">
          <div className="pc-surface-light flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-pc-border p-4 sm:max-w-[220px] lg:max-w-none">
            <SmartImage src={talentImageUrl} alt={talentStat.talentName} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 space-y-4">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-pc-text-muted">{championData.name} talent</div>
              <p className="text-sm leading-relaxed text-pc-text-secondary">
                {talentMeta?.description ?? "No local talent description is available yet."}
              </p>
              {talentMeta?.category && <div className="mt-2 text-xs text-pc-text-muted">Linked: {talentMeta.category}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label="Talent Plays" value={formatPlays(talentStat.totalPlays)} />
              <SummaryTile label="Pick Rate" value={`${pickRate.toFixed(1)}%`} color={quality.color} />
              <SummaryTile label="Win Rate" value={`${talentStat.winRate.toFixed(1)}%`} color={quality.color} />
              <SummaryTile label="Record" value={`${talentStat.wins.toLocaleString()}W/${talentStat.losses.toLocaleString()}L`} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="pc-card-title">Loadout Cards</h2>
          <div className="text-xs text-pc-text-secondary">
            Ranked performance with <span className="font-medium text-pc-accent">{talentStat.talentName}</span> · {cardStats.totalMatches.toLocaleString()} plays
          </div>
        </div>
        {championData.loadouts?.length ? (
          <ChampionLoadoutGrid
            championSlug={name}
            loadouts={championData.loadouts}
            cardStats={cardStats}
            talentId={talentId}
            returnTo={currentLocation}
          />
        ) : (
          <EmptyState title="No loadout cards" description="This champion does not have local loadout-card metadata yet." />
        )}
      </section>
    </div>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="pc-surface-light rounded-lg border border-pc-border p-4 text-center">
      <div className="mb-1 text-xs text-pc-text-muted">{label}</div>
      <div className="break-words font-mono text-lg text-pc-text" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
