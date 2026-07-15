"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchBuilds, type Build } from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { formatLocalDateTime } from "@/lib/time-format";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";

export default function BuildsPage() {
  const { t } = useLocalization();
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [championFilter, setChampionFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("public");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchBuilds({
          visibility: visibilityFilter,
          limit: "50",
        });
        setBuilds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load builds");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [visibilityFilter]);


  const filteredBuilds = championFilter
    ? builds.filter((b) => b.championName.toLowerCase().includes(championFilter.toLowerCase()))
    : builds;

  if (loading) return <RouteSkeleton variant="list" />;
  if (error) return <ErrorState title={t("generated.builds.buildsUnavailable")} message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text={t("generated.builds.builds")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <Link
          href="/builds/create"
          className="px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t("generated.builds.createBuild")}</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder={t("generated.builds.filterByChampion")}
          value={championFilter}
          onChange={(e) => setChampionFilter(e.target.value)}
          className="px-3 py-2 bg-pc-bg-elevated border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
        />
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value)}
          className="px-3 py-2 bg-pc-bg-elevated border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
        >
          <option value="public">{t("generated.builds.public")}</option>
          <option value="private">{t("generated.builds.private")}</option>
          <option value="all">{t("generated.builds.all")}</option>
        </select>
      </div>

      {filteredBuilds.length === 0 ? (
        <EmptyState title={t("generated.builds.noBuildsFound")} description={t("generated.builds.shareTheFirstDeckBuildForThisSelection")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBuilds.map((build) => (
            <Link
              key={build.id}
              href={`/builds/${build.id}`}
              className="block bg-pc-bg-elevated rounded-lg border border-pc-border p-5 hover:border-pc-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-pc-text hover:text-pc-accent transition-colors">
                    {build.name}
                  </h2>
                  <p className="text-pc-text-secondary text-sm mt-1">
                    {build.championName} {t("generated.builds.by")}{" "}{build.username}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-pc-text-muted text-sm">
                    <span>{formatLocalDateTime(build.createdAt)}</span>
                    <span>{build.items.length}{t("generated.builds.text4Items")}</span>
                    <span>{build.cards.length}{t("generated.builds.text5Cards")}</span>
                    <span>{build.talents.length}{t("generated.builds.text1Talent")}</span>
                    <span>{build.likes} {t("generated.builds.likes")}</span>
                    <span>{build.viewCount} {t("generated.builds.views")}</span>
                    <span className={build.visibility === "public" ? "text-green-400" : "text-yellow-400"}>
                      {build.visibility}
                    </span>
                  </div>
                </div>
                <span className="text-pc-text-muted ml-4">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
