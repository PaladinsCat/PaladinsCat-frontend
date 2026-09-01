/**
 * Render the champions name talents talentId page and its data composition.
 * Assemble the page content exposed at this location.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import ChampionLoadoutGrid from "@/components/champion-loadout-grid";
import ContextBackLink from "@/components/context-back-link";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { getChampionData, type ChampionData, type ChampionTalent } from "@/lib/champion-data";
import {
  fetchChampionCardStats,
  fetchChampions,
  fetchChampionTalentStats,
  normalizeChampionCardStatsResponse,
  normalizeChampionTalentStatsResponse,
  type ChampionCardStatsResponse,
  type ChampionTalentStat,
} from "@/lib/api-client";
import { getStatQuality } from "@/lib/stat-quality";
import { withStoredLobbyTier } from "@/lib/lobby-tier";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";

const CHAMPION_DATA_BASE = "/_pc";

type ChampionTalentPagePayload = {
  championId: number;
  talentId: number;
  totalMatches: number;
  talentStat: ChampionTalentStat;
  cardStats: ChampionCardStatsResponse;
};

function parsePositiveInteger(value: string | string[] | null | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Render the ChampionTalentDetailPage view for champions name talents talentId page.
 * Return the React tree for the declared inputs and page data.
 */
export default function ChampionTalentDetailPage() {
  const { t, formatNumber, formatPercent, formatRecord } = useLocalization();
  const formatPlays = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
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
      setError(t("generated.champions.invalidTalentRoute"));
      return;
    }

    const controller = new AbortController();
    const talentPageUrl = withStoredLobbyTier(
      `/champions/${championSlug(name)}/talents/${talentId}/page-data`,
    );
    const loadTalentPage = async (): Promise<ChampionTalentPagePayload> => {
      const response = await fetch(`${CHAMPION_DATA_BASE}${talentPageUrl}`, { signal: controller.signal });
      if (response.ok) {
        const raw = await response.json() as any;
        const talentStats = normalizeChampionTalentStatsResponse({
          totalMatches: raw.totalMatches,
          talents: [raw.talentStat],
        });
        return {
          championId: Number(raw.championId),
          talentId: Number(raw.talentId),
          totalMatches: talentStats.totalMatches,
          talentStat: talentStats.talents[0],
          cardStats: normalizeChampionCardStatsResponse(raw.cardStats),
        };
      }
      if (response.status !== 404) throw new Error(t("generated.champions.talentPageDataIsUnavailable"));

      // Deployment compatibility: an updated frontend may briefly reach an
      // older backend that does not expose the composite route yet. Preserve
      // the previous requests only for that rolling-deploy window.
      const champions = await fetchChampions();
      const champion = champions.find((entry) => championSlug(entry.name) === championSlug(name));
      if (!champion) throw new Error(t("generated.champions.championNotFound"));
      const [talentStats, cardStats] = await Promise.all([
        fetchChampionTalentStats(champion.id),
        fetchChampionCardStats(champion.id, "ranked", talentId),
      ]);
      const talentStat = talentStats.talents.find((entry) => entry.talentId === talentId);
      if (!talentStat) throw new Error(t("generated.champions.talentStatisticsNotFound"));
      return {
        championId: champion.id,
        talentId,
        totalMatches: talentStats.totalMatches,
        talentStat,
        cardStats,
      };
    };
    Promise.all([
      getChampionData(name),
      loadTalentPage(),
    ])
      .then(([localData, pageData]) => {
        if (!localData) throw new Error(t("generated.champions.championReferenceDataIsUnavailable"));
        if (pageData.talentId !== talentId || !pageData.talentStat) {
          throw new Error(t("generated.champions.talentStatisticsNotFound"));
        }
        if (cancelled) return;

        setChampionData(localData);
        setTalentStat(pageData.talentStat);
        setTotalMatches(pageData.totalMatches);
        setCardStats(pageData.cardStats);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setChampionData(null);
        setTalentStat(null);
        setCardStats(null);
        setError(reason instanceof Error ? reason.message : t("generated.champions.[name].talents.[talentId].page.unabletoloadtalentstatisti"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [name, talentId]);

  const talentMeta = useMemo<ChampionTalent | null>(() => {
    if (!championData || !talentStat) return null;
    return championData.talents.find((talent) => talent.id === talentId) ?? null;
  }, [championData, talentId, talentStat]);

  const currentLocation = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  if (loading) return <RouteSkeleton variant="detail" />;

  if (error || !championData || !talentStat || !cardStats || !talentId) {
    return (
      <div className="space-y-4">
        <ContextBackLink fallbackHref={`/champions/${name}`} />
        <ErrorState title={t("generated.champions.talentStatisticsUnavailable")} message={error ?? t("generated.champions.noTalentDataForQueue")} />
      </div>
    );
  }

  const pickRate = totalMatches > 0 ? (talentStat.totalPlays / totalMatches) * 100 : 0;
  const quality = getStatQuality(talentStat.winRate, pickRate, 100);
  return (
    <div className="space-y-6">
      <header><ContextBackLink fallbackHref={`/champions/${name}`} label={championData.name} /><h1 className="mt-2 pc-heading pc-heading-lg">{talentStat.talentName}</h1></header>

      <section className="rounded-xl border border-pc-border bg-pc-bg-elevated/90 p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr]">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg p-2 sm:max-w-[220px] lg:max-w-none">
            <CanonicalTalentImage talentId={talentId} talentName={talentStat.talentName} alt={talentStat.talentName} className="h-full w-full object-contain" fallbackClassName="h-full w-full" />
          </div>
          <div className="min-w-0 space-y-4">
            <div>
              <div className="mb-1 text-xs uppercase tracking-wider text-pc-text-muted">{championData.name} {t("generated.champions.talent")}</div>
              <p className="text-sm leading-relaxed text-pc-text-secondary">
                {talentMeta?.description ?? t("generated.champions.noLocalTalentDescriptionIsAvailableYet")}
              </p>
              {talentMeta?.category && <div className="mt-2 text-xs text-pc-text-muted">{t("generated.champions.linked")}{" "}{talentMeta.category}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label={t("generated.champions.talentPlays")} value={formatPlays(talentStat.totalPlays)} />
              <SummaryTile label={t("generated.champions.pickRate")} value={formatPercent(pickRate)} color={quality.color} />
              <SummaryTile label={t("generated.champions.winRate")} value={formatPercent(talentStat.winRate)} color={quality.color} />
              <SummaryTile label={t("generated.champions.record")} value={formatRecord(talentStat.wins, talentStat.losses)} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="pc-card-title">{t("generated.champions.loadoutCards")}</h2>
          <div className="text-xs text-pc-text-secondary">
            {t("generated.champions.rankedPerformanceWith")}{" "}<span className="font-medium text-pc-accent">{talentStat.talentName}</span> · {formatNumber(cardStats.totalMatches)} {t("generated.champions.plays.0effba4")}</div>
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
          <EmptyState title={t("generated.champions.noLoadoutCards")} description={t("generated.champions.thisChampionDoesNotHaveLocalLoadoutCardMetadataYet")} />
        )}
      </section>
    </div>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2 text-center">
      <div className="mb-1 text-xs text-pc-text-muted">{label}</div>
      <div className="break-words font-mono text-lg text-pc-text" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
