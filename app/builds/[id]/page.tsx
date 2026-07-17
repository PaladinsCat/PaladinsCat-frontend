"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { getBuildDetail, toggleBuildLike, getAuthUser, getAuthToken, type Build } from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";
import { championSlug } from "@/lib/utils";
import { loadBuildReferenceData, type BuildReferenceData } from "@/lib/build-reference";
import { LoadingPanel } from "@/components/async-state";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import { useLocalization } from "@/lib/localization-context";

function AssetImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-pc-border bg-pc-bg-secondary text-xs text-pc-text-muted">
        {alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={alt} className="h-10 w-10 shrink-0 rounded-md border border-pc-border object-cover" loading="lazy" />;
}

function AssetRow({ iconUrl, title, subtitle, talentId }: { iconUrl?: string | null; title: string; subtitle?: string; talentId?: number }) {
  return (
    <div className="pc-surface-light flex items-center gap-3 rounded-lg border border-pc-border p-3 text-sm text-pc-text">
      {talentId ? <CanonicalTalentImage talentId={talentId} talentName={title} alt={title} className="h-10 w-10 shrink-0 rounded-md border border-pc-border object-cover" fallbackClassName="h-10 w-10 shrink-0 rounded-md border border-pc-border bg-pc-bg-secondary" /> : <AssetImage src={iconUrl} alt={title} />}
      <div className="min-w-0">
        <div className="truncate font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-pc-text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function BuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLocalization();
  const [build, setBuild] = useState<Build | null>(null);
  const [referenceData, setReferenceData] = useState<BuildReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const loadBuild = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getBuildDetail(parseInt(id, 10));
      setBuild(data);
      loadBuildReferenceData(data.championId, championSlug(data.championName))
        .then(setReferenceData)
        .catch(() => setReferenceData(null));
    } catch {
      setError(t("generated.builds.failedToLoadBuild"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBuild();
  }, [loadBuild]);

  const itemById = useMemo(() => new Map((referenceData?.items ?? []).map((item) => [item.id, item])), [referenceData]);
  const cardById = useMemo(() => new Map((referenceData?.cards ?? []).map((card) => [card.id, card])), [referenceData]);
  const talentById = useMemo(() => new Map((referenceData?.talents ?? []).map((talent) => [talent.id, talent])), [referenceData]);
  const cardPointTotal = build?.cards.reduce((sum, card) => sum + card.level, 0) ?? 0;

  async function handleLike() {
    if (!build) return;
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      const newLikes = await toggleBuildLike(build.id, user.id, token);
      setBuild((prev) => prev ? { ...prev, likes: newLikes } : null);
    } catch {
      // Ignore like errors so a failed reaction never hides the build itself.
    }
  }

  if (loading) return <LoadingPanel />;
  if (error) return <div className="text-center py-12 text-pc-text-muted">{error}</div>;
  if (!build) return <div className="text-center py-12 text-pc-text-muted">{t("generated.builds.buildNotFound")}</div>;

  return (
    <div className="space-y-6">
      <Link href="/builds" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
        {t("generated.builds.backToBuilds")}</Link>

      <div className="pc-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-pc-text">{build.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-pc-text-secondary">
              <span>{build.championName}</span>
              <span>{t("generated.builds.by.4081586")}{" "}{build.username}</span>
              <span>{formatLocalDateTime(build.createdAt)}</span>
              <span className={build.visibility === "public" ? "text-green-400" : "text-yellow-400"}>
                {build.visibility}
              </span>
            </div>
          </div>
          <button
            onClick={handleLike}
            className="flex items-center gap-2 rounded-lg border border-pc-border px-3 py-2 text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent"
          >
            {t("generated.builds.like")}{" "}{build.likes}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-pc-text-secondary">{t("generated.builds.items.409dd57")}{build.items.length}/4)</h3>
            <div className="space-y-2">
              {build.items.length === 0 ? (
                <p className="text-sm text-pc-text-muted">{t("generated.builds.noItems")}</p>
              ) : (
                build.items.map((itemId) => {
                  const item = itemById.get(itemId);
                  return (
                    <AssetRow
                      key={itemId}
                      iconUrl={item?.iconUrl}
                      title={item?.name ?? t("generated.builds.itemValue1", { value1: itemId })}
                      subtitle={item?.category}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-pc-text-secondary">{t("generated.builds.talent")}{build.talents.length}/1)</h3>
            <div className="space-y-2">
              {build.talents.length === 0 ? (
                <p className="text-sm text-pc-text-muted">{t("generated.builds.noTalent")}</p>
              ) : (
                build.talents.map((talentId) => {
                  const talent = talentById.get(talentId);
                  return (
                    <AssetRow
                      key={talentId}
                      talentId={talentId}
                      iconUrl={talent?.iconUrl}
                      title={talent?.name ?? t("generated.builds.talentValue1", { value1: talentId })}
                      subtitle={t("generated.builds.selectedTalent")}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-pc-text-secondary">{t("generated.builds.loadout")}{build.cards.length}/5, {cardPointTotal}{t("generated.builds.text15Pts")}</h3>
            <div className="space-y-2">
              {build.cards.length === 0 ? (
                <p className="text-sm text-pc-text-muted">{t("generated.builds.noCards")}</p>
              ) : (
                build.cards.map((selection) => {
                  const card = cardById.get(selection.cardId);
                  return (
                    <AssetRow
                      key={selection.cardId}
                      iconUrl={card?.iconUrl}
                      title={card?.name ?? t("generated.builds.cardValue1", { value1: selection.cardId })}
                      subtitle={`Level ${selection.level}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {build.notes && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-pc-text-secondary">{t("generated.builds.notes")}</h3>
            <p className="rounded-lg bg-pc-bg-secondary p-4 text-pc-text whitespace-pre-wrap">{build.notes}</p>
          </div>
        )}

        <div className="mt-6 flex gap-6 text-sm text-pc-text-secondary">
          <span>{t("generated.builds.views.4776159")}{" "}{build.viewCount}</span>
          <span>{t("generated.builds.likes.ea70b16")}{" "}{build.likes}</span>
        </div>
      </div>
    </div>
  );
}
