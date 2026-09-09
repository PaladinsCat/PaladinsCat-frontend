/** Browse cumulative ranked champion relationships across stored ranked history.
 * refs: see: lib/champion-matchups-api.ts · documents/06-reference/design/frontend-design-system.md
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import { LoadingIndicator } from "@/components/async-state";
import PageHeader from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fetchChampions, type Champion } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getChampionData } from "@/lib/champion-data";
import { getPercentageColor } from "@/lib/stat-quality";
import { useLocalization } from "@/lib/localization-context";
import {
  fetchChampionTalentMatchups,
  type ChampionRelationship,
} from "@/lib/champion-matchups-api";

type TalentRelationship = {
  talentId: number;
  talentName: string;
  wins: number;
  losses: number;
  encounters: number;
  winRate: number | null;
};

const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

/** Render every opposing-champion relationship from cumulative ranked facts. */
export default function ChampionMatchups({ initialSlug }: { initialSlug?: string }): React.JSX.Element {
  const router = useRouter();
  const { t, formatNumber, formatPercent } = useLocalization();
  const [roster, setRoster] = useState<Champion[]>([]);
  const [champion, setChampion] = useState(0);
  const [relationships, setRelationships] = useState<ChampionRelationship[]>([]);
  const [talentRelationships, setTalentRelationships] = useState<Map<number, TalentRelationship[]>>(new Map());
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState(false);
  const [talentError, setTalentError] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [talentLoading, setTalentLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    fetchChampions().then((rows) => {
      if (!live) return;
      const currentSlug = decodeURIComponent(window.location.pathname.split("/")[3] ?? initialSlug ?? "");
      const selected = rows.find((candidate) => championSlug(candidate.name) === currentSlug) ?? rows[0];
      setRoster(rows);
      setChampion(Number(selected?.id ?? 0));
      if (!rows.length) {
        setGlobalError(true);
        setGlobalLoading(false);
      }
    }).catch(() => {
      if (live) {
        setGlobalError(true);
        setGlobalLoading(false);
      }
    });
    return () => { live = false; };
  }, [initialSlug, retry]);

  useEffect(() => {
    if (!champion) return;
    const controller = new AbortController();
    Promise.all([
      fetchChampionTalentMatchups(champion, 0, controller.signal),
      Promise.all(roster.filter((row) => Number(row.id) !== champion).map(async (opponent) => ({
        opponent,
        current: await getChampionData(championSlug(opponent.name)),
      }))),
    ])
      .then(([matchupData, opponents]) => {
        if (controller.signal.aborted) return;
        const observed = new Map<string, TalentRelationship>();
        const globals = new Map<number, ChampionRelationship>();
        for (const row of matchupData.rows) {
          const key = `${row.opponentChampionId}:${row.opponentTalentId}`;
          const current = observed.get(key) ?? {
            talentId: row.opponentTalentId,
            talentName: row.opponentTalentName,
            wins: 0,
            losses: 0,
            encounters: 0,
            winRate: null,
          };
          current.wins += row.wins;
          current.losses += row.losses;
          current.encounters += row.encounters;
          current.winRate = current.encounters > 0 ? (100 * current.wins) / current.encounters : null;
          observed.set(key, current);
          const global = globals.get(row.opponentChampionId) ?? {
            opponentChampionId: row.opponentChampionId,
            opponentChampionName: row.opponentChampionName,
            wins: 0,
            losses: 0,
            encounters: 0,
            winRate: null,
          };
          global.wins += row.wins;
          global.losses += row.losses;
          global.encounters += row.encounters;
          global.winRate = global.encounters > 0 ? (100 * global.wins) / global.encounters : null;
          globals.set(row.opponentChampionId, global);
        }
        const byOpponent = new Map<number, TalentRelationship[]>();
        for (const { opponent, current } of opponents) {
          const opponentId = Number(opponent.id);
          byOpponent.set(opponentId, (current?.talents ?? []).map((activeTalent) =>
            observed.get(`${opponentId}:${activeTalent.id}`) ?? {
              talentId: Number(activeTalent.id),
              talentName: activeTalent.name,
              wins: 0,
              losses: 0,
              encounters: 0,
              winRate: null,
            }));
        }
        setRelationships([...globals.values()].sort((left, right) => (right.winRate ?? 0) - (left.winRate ?? 0)));
        setTalentRelationships(byOpponent);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setGlobalError(true);
          setTalentError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setGlobalLoading(false);
          setTalentLoading(false);
        }
      });
    return () => controller.abort();
  }, [champion, retry, roster]);

  const visibleRelationships = useMemo(() => relationships.filter((row) => {
    const matchesSearch = row.opponentChampionName.toLowerCase().includes(search.trim().toLowerCase());
    const opponent = roster.find((candidate) => Number(candidate.id) === row.opponentChampionId);
    const matchesRole = !filterRole || opponent?.roles?.includes(filterRole);
    return matchesSearch && matchesRole;
  }), [relationships, search, filterRole, roster]);
  const loading = globalLoading;
  const error = globalError;

  function selectChampion(championId: number) {
    setChampion(championId);
    setRelationships([]);
    setTalentRelationships(new Map());
    setGlobalLoading(true);
    setTalentLoading(true);
    setGlobalError(false);
    setTalentError(false);
    const selected = roster.find((row) => Number(row.id) === championId);
    router.push(`/stats/champions/${championSlug(selected?.name ?? "")}`, { scroll: false });
  }

  return <div className="space-y-6">
    <PageHeader
      parentHref="/stats"
      parentLabel={t("stats.matchups.directory")}
      title={t("stats.matchups.title")}
    />

    <div className="flex flex-wrap items-end gap-4">
      <label className="min-w-52 flex-1 space-y-2 text-sm">
        {t("stats.matchups.champion")}
        <select className="pc-input w-full" value={champion} onChange={(event) => selectChampion(Number(event.target.value))}>
          {roster.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </label>
      <label className="min-w-52 flex-1 space-y-2 text-sm">
        {t("stats.matchups.search")}
        <input className="pc-input w-full" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <div className="space-y-2">
        <span className="block text-sm">{t("generated.champions.class.41ff354")}</span>
        <SegmentedControl
          label={t("generated.champions.class.41ff354")}
          value={filterRole ?? "all"}
          onChange={(role) => setFilterRole(role === "all" ? null : role)}
          items={[
            { value: "all", label: t("generated.stats.all") },
            ...ROLES.map((role) => ({
              value: role.value,
              label: t(role.labelKey),
              icon: <SmartImage src={role.icon} alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5" />,
            })),
          ]}
        />
      </div>
    </div>

    {loading && <p role="status">{t("stats.matchups.loading")}</p>}
    {error && <div role="alert" className="pc-card p-4">
      {t("stats.matchups.error")}{" "}
      <button className="pc-button" onClick={() => {
        setGlobalLoading(true);
        setGlobalError(false);
        setTalentLoading(true);
        setTalentError(false);
        setRetry((value) => value + 1);
      }}>
        {t("stats.matchups.retry")}
      </button>
    </div>}
    {!loading && !error && visibleRelationships.length === 0 && <p className="pc-card p-4 text-sm text-pc-text-secondary">{t("stats.matchups.empty")}</p>}
    {!loading && !error && visibleRelationships.length > 0 && <div className="grid gap-3 lg:grid-cols-2">
      {visibleRelationships.map((row) => {
        const talentRows = talentRelationships.get(row.opponentChampionId) ?? [];
        const enemyRate = row.encounters > 0 ? (100 * row.losses) / row.encounters : null;
        return <article key={row.opponentChampionId} className="rounded-lg border border-pc-border bg-pc-bg-elevated p-3">
          <Link href={`/stats/champions/${championSlug(row.opponentChampionName)}`} className="flex items-center gap-2.5">
            <SmartImage src={getChampionIconSafe(row.opponentChampionName)} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-contain" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-pc-text hover:text-pc-accent">{row.opponentChampionName}</h2>
              <p className="text-xs uppercase tracking-wide text-pc-text-muted">{t("stats.matchups.global")}</p>
            </div>
            {row.encounters < 30 && <span className="text-xs text-pc-text-muted">{t("stats.matchups.lowSample")}</span>}
          </Link>
          <div className="mt-3 grid gap-3 border-t border-pc-border/60 pt-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="space-y-2" aria-label={t("stats.matchups.global")}>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs tabular-nums">
                <div><dt className="text-pc-text-muted">{t("stats.matchups.samples")}</dt><dd className="font-semibold text-pc-text-secondary">{formatNumber(row.encounters)}</dd></div>
                <div><dt className="text-pc-text-muted">{t("stats.matchups.wins")}</dt><dd className="font-semibold text-pc-text-secondary">{formatNumber(row.wins)}</dd></div>
                <div><dt className="text-pc-text-muted">{t("generated.champions.losses")}</dt><dd className="font-semibold text-pc-text-secondary">{formatNumber(row.losses)}</dd></div>
                <div><dt className="text-pc-text-muted">{t("stats.matchups.rate")}</dt><dd className="font-semibold" style={row.winRate == null ? undefined : { color: getPercentageColor(row.winRate) }}>{formatPercent(row.winRate, { maximumFractionDigits: 1 })}</dd></div>
                <div><dt className="text-pc-text-muted">{t("stats.matchups.enemyRate")}</dt><dd className="font-semibold" style={enemyRate == null ? undefined : { color: getPercentageColor(enemyRate) }}>{formatPercent(enemyRate, { maximumFractionDigits: 1 })}</dd></div>
              </dl>
            </section>
            <section className="border-t border-pc-border/60 pt-3 lg:border-t-0 lg:border-l lg:pl-3 lg:pt-0">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-pc-text-muted">{t("stats.matchups.talents")}</h3>
              {talentLoading ? <LoadingIndicator /> : talentError ? <p className="text-xs text-rose-300">{t("stats.matchups.error")}</p> : (
              <div className="divide-y divide-pc-border/50">
                {talentRows.map((talentRow) => {
                  const against = talentRow.encounters > 0 ? (100 * talentRow.losses) / talentRow.encounters : null;
                  return <div key={talentRow.talentId} className="flex items-center gap-2 px-2.5 py-2">
                    <CanonicalTalentImage talentId={talentRow.talentId} talentName={talentRow.talentName} alt="" className="h-8 w-8 shrink-0 rounded object-cover" fallbackClassName="h-8 w-8 shrink-0 rounded" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-pc-text-secondary">{talentRow.talentName}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-pc-text-muted">
                        <span>{t("stats.matchups.rate")} <strong style={talentRow.winRate == null ? undefined : { color: getPercentageColor(talentRow.winRate) }}>{formatPercent(talentRow.winRate, { maximumFractionDigits: 1 })}</strong></span>
                        <span>{t("stats.matchups.enemyRate")} <strong style={against == null ? undefined : { color: getPercentageColor(against) }}>{formatPercent(against, { maximumFractionDigits: 1 })}</strong></span>
                        <span>{formatNumber(talentRow.wins)}W/{formatNumber(talentRow.losses)}L · {formatNumber(talentRow.encounters)}</span>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            )}
            </section>
          </div>
        </article>;
      })}
    </div>}
  </div>;
}
