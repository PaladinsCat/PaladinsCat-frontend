"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import ContextBackLink, { safeInternalReturnTo } from "@/components/context-back-link";
import { getChampionData, type ChampionData } from "@/lib/champion-data";
import {
  fetchChampionCardDetail,
  fetchChampions,
  type ChampionCardDetailResponse,
  type ChampionCardTalentStat,
  type ChampionCardLevelStat,
} from "@/lib/api-client";
import { championSlug } from "@/lib/utils";
import { getStatQuality } from "@/lib/stat-quality";
import { ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";

function parseMaybeNumber(value: string | string[] | null | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === "") return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function statNameKey(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default function ChampionCardDetailPage() {
  const { t, formatNumber, formatPercent: formatPct } = useLocalization();
  const formatPlays = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameParam = params?.name;
  const cardParam = params?.cardId;
  const name = Array.isArray(nameParam) ? nameParam[0] ?? "" : nameParam ?? "";
  const cardId = parseMaybeNumber(cardParam);
  const returnTo = safeInternalReturnTo(searchParams.get("returnTo"));

  const [championData, setChampionData] = useState<ChampionData | null>(null);
  const [detail, setDetail] = useState<ChampionCardDetailResponse | null>(null);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(() => parseMaybeNumber(searchParams.get("talentId")));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTalentId(parseMaybeNumber(searchParams.get("talentId")));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!name || !cardId) {
      setLoading(false);
      setError(t("generated.champions.invalidCardRoute"));
      return;
    }

    // Resolve the champion from the normal backend reference endpoint, then
    // query only stored match-card facts. This page is an analysis view and must
    // never call Hi-Rez directly just because someone clicks around card data.
    Promise.all([fetchChampions(), getChampionData(name)])
      .then(async ([champions, localData]) => {
        const champion = champions.find((entry) => championSlug(entry.name) === name.toLowerCase());
        if (!champion) throw new Error(t("generated.champions.championNotFound"));
        const cardDetail = await fetchChampionCardDetail(champion.id, cardId, "ranked", selectedTalentId);
        if (!cardDetail) throw new Error(t("generated.champions.cardStatsNotFound"));
        if (cancelled) return;
        setChampionData(localData ?? null);
        setDetail(cardDetail);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setChampionData(null);
        setDetail(null);
        setError(err instanceof Error ? err.message : t("generated.champions.[name].cards.[cardId].page.unabletoloadcardstats"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [name, cardId, selectedTalentId]);

  const cardMeta = useMemo(() => {
    if (!championData || !detail) return null;
    return (championData.loadouts ?? []).find((card) => statNameKey(card.name) === statNameKey(detail.cardName)) ?? null;
  }, [championData, detail]);

  const selectedTalent = useMemo(() => {
    if (selectedTalentId == null) return null;
    return (detail?.talents ?? []).find((talent) => talent.talentId === selectedTalentId) ?? null;
  }, [detail, selectedTalentId]);

  const maxTalentPlays = useMemo(() => Math.max(1, ...(detail?.talents ?? []).map((talent) => talent.totalPlays)), [detail]);
  const maxLevelPlays = useMemo(() => Math.max(1, ...(detail?.levels ?? []).map((level) => level.plays)), [detail]);

  function selectTalent(talentId: number | null) {
    setSelectedTalentId(talentId);
    if (!cardId) return;
    const base = `/champions/${name}/cards/${cardId}`;
    const query = new URLSearchParams();
    if (talentId) query.set("talentId", String(talentId));
    if (returnTo) query.set("returnTo", returnTo);
    router.replace(query.size > 0 ? `${base}?${query.toString()}` : base, { scroll: false });
  }

  if (loading) {
    return <RouteSkeleton variant="detail" />;
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <ContextBackLink fallbackHref={`/champions/${name}`} />
        <ErrorState title={t("generated.champions.cardStatisticsUnavailable")} message={error ?? "No card data is available for this queue."} />
      </div>
    );
  }

  const championDisplayName = championData?.name ?? detail.championName ?? name;
  const headlineQuality = getStatQuality(detail.winRate, detail.totalPlays, Math.max(detail.totalPlays, 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ContextBackLink fallbackHref={`/champions/${name}`} />
        <span className="text-pc-text-muted">/</span>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{detail.cardName}</h1>
      </div>

      <div className="pc-card">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
          <div className="pc-surface-light rounded-lg border border-pc-border p-3">
            {cardMeta?.iconUrl ? (
              <SmartImage src={cardMeta.iconUrl} alt={detail.cardName} className="w-full aspect-[4/3] rounded-md object-cover bg-pc-bg/50" />
            ) : (
              <div className="w-full aspect-[4/3] rounded-md bg-pc-bg-elevated border border-pc-border flex items-center justify-center text-pc-text-muted">
                {t("generated.champions.noImage")}</div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-pc-text-muted mb-1">{championDisplayName} {t("generated.champions.loadoutCard")}</div>
              <p className="text-sm text-pc-text-secondary leading-relaxed">
                {cardMeta?.description ?? t("generated.champions.noLocalCardDescriptionIsAvailableYet")}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryTile label={selectedTalent ? t("generated.champions.talentPlays") : t("common.sort.totalPlays")} value={formatPlays(detail.totalPlays)} />
              <SummaryTile label={t("generated.champions.winRate")} value={formatPct(detail.winRate)} color={headlineQuality.color} />
              <SummaryTile label={t("generated.champions.wins")} value={formatNumber(detail.wins)} />
              <SummaryTile label={t("generated.champions.losses")} value={formatNumber(detail.losses)} />
            </div>

            {selectedTalent && (
              <div className="text-xs text-pc-text-secondary">
                {t("generated.champions.filteredBy")}{" "}<span className="text-pc-accent font-medium">{selectedTalent.talentName}</span>{t("generated.champions.levelStatsBelowOnlyIncludeThisTalentPairing")}</div>
            )}
          </div>
        </div>
      </div>

      <section className="pc-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="pc-card-title">{t("generated.champions.talentPairings")}</h2>
          {selectedTalentId != null && (
            <button
              type="button"
              onClick={() => selectTalent(null)}
              className="text-xs px-3 py-1 rounded-lg border border-pc-border text-pc-text-secondary hover:text-pc-accent hover:border-pc-accent-mid transition-colors"
            >
              {t("generated.champions.clear")}</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {detail.talents.map((talent) => {
            return (
              <TalentPairingCard
                key={talent.talentId}
                talent={talent}
                selected={talent.talentId === selectedTalentId}
                maxTalentPlays={maxTalentPlays}
                onSelect={() => selectTalent(talent.talentId)}
              />
            );
          })}
        </div>
      </section>

      <section className="pc-card space-y-4">
        <h2 className="pc-card-title">{t("generated.champions.levelBreakdown")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {detail.levels.map((level) => (
            <LevelCard key={level.level} level={level} maxLevelPlays={maxLevelPlays} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="pc-surface-light rounded-lg p-4 border border-pc-border text-center">
      <div className="text-xs text-pc-text-muted mb-1">{label}</div>
      <div className="text-lg font-mono text-pc-text" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

function TalentPairingCard({
  talent,
  selected,
  maxTalentPlays,
  onSelect,
}: {
  talent: ChampionCardTalentStat;
  selected: boolean;
  maxTalentPlays: number;
  onSelect: () => void;
}) {
  const { t, formatNumber, formatPercent: formatPct, formatRecord } = useLocalization();
  const formatPlays = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
  const quality = getStatQuality(talent.winRate, talent.totalPlays, maxTalentPlays);
  const width = Math.max(talent.totalPlays > 0 ? 8 : 0, Math.round((talent.totalPlays / Math.max(1, maxTalentPlays)) * 100));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`pc-surface-light rounded-lg p-3 border text-left transition-colors ${selected ? "ring-1 ring-pc-accent border-pc-accent-mid" : "hover:border-pc-accent-mid"}`}
      style={{ borderColor: selected ? quality.color : quality.borderColor }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-md border border-pc-border bg-pc-bg/50 overflow-hidden flex-shrink-0">
          <CanonicalTalentImage talentId={talent.talentId} talentName={talent.talentName} alt={talent.talentName} className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-pc-accent truncate">{talent.talentName}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span style={{ color: quality.color }}><span className="text-pc-text-muted mr-1">{t("generated.champions.wr")}</span>{formatPct(talent.winRate)}</span>
            <span className="text-pc-border">|</span>
            <span className="text-pc-text-muted"><span className="mr-1">{t("generated.champions.picks")}</span><span style={{ color: quality.color }}>{formatPlays(talent.totalPlays)}</span></span>
            <span className="text-pc-border">|</span>
            <span className="text-pc-text-muted whitespace-nowrap">{formatRecord(talent.wins, talent.losses)}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-pc-bg-elevated overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${width}%`, background: quality.track }} />
          </div>
        </div>
      </div>
    </button>
  );
}

function LevelCard({ level, maxLevelPlays }: { level: ChampionCardLevelStat; maxLevelPlays: number }) {
  const { t, formatNumber, formatPercent: formatPct } = useLocalization();
  const formatPlays = (value: number) => formatNumber(value, { notation: "compact", maximumFractionDigits: 1 });
  const quality = getStatQuality(level.winRate, level.plays, maxLevelPlays);
  const width = Math.max(level.plays > 0 ? 8 : 0, Math.round((level.plays / Math.max(1, maxLevelPlays)) * 100));

  return (
    <div className="pc-surface-light rounded-lg p-4 border transition-colors" style={{ borderColor: quality.borderColor }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm font-semibold text-pc-text">{t("common.format.levelShort", { level: level.level })}</div>
        <div className="text-xs font-mono" style={{ color: quality.color }}>{formatPct(level.winRate)}</div>
      </div>
      <div className="h-2 rounded-full bg-pc-bg-elevated overflow-hidden mb-2">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: quality.track }} />
      </div>
      <div className="text-xs text-pc-text-muted">{formatPlays(level.plays)} {t("generated.champions.picks.b324c80")}</div>
    </div>
  );
}
