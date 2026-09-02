"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { fetchPlayerLevelLeaderboard, fetchPlayerSearch, type PlayerLevelLeaderboardEntry, type PlayerSearchResult } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { useChampions } from "@/lib/champion-names";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";
import PlayerName from "@/components/player-name";
import TablePagination, { type TablePageSize } from "@/components/table-pagination";
import { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { useLocalization } from "@/lib/localization-context";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuth } from "@/lib/auth-context";

type LevelMode = "account" | "champion";
type ChampionClass = "Frontline" | "Damage" | "Flank" | "Support";
type ChampionSort = "level" | "champion" | "class";

const CHAMPION_CLASSES: Array<{ value: ChampionClass; icon: string }> = [
  { value: "Frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", icon: "/images/icons/Class_Support_Icon.avif" },
];

export default function PlayerLevelLeaderboard({ mode }: { mode: LevelMode }) {
  const { t, formatNumber } = useLocalization();
  const { user, isLoading: authLoading } = useAuth();
  const { champions: referenceChampions } = useChampions();
  const [rows, setRows] = useState<PlayerLevelLeaderboardEntry[]>([]);
  const [loadedLeaderboardScopeKey, setLoadedLeaderboardScopeKey] = useState<string | null>(null);
  const [leaderboardErrorKey, setLeaderboardErrorKey] = useState<string | null>(null);
  const [leaderboardRequestVersion, setLeaderboardRequestVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [positionRows, setPositionRows] = useState<PlayerLevelLeaderboardEntry[]>([]);
  const [positionKey, setPositionKey] = useState<string | null>(null);
  const [positionErrorKey, setPositionErrorKey] = useState<string | null>(null);
  const [positionRequestVersion, setPositionRequestVersion] = useState(0);
  const [page, setPage] = usePersistentDirectoryPage(`playerLevelLeaderboard:${mode}`);
  const [pageSize, setPageSize] = useState<TablePageSize>(25);
  const [championClass, setChampionClass] = useState<ChampionClass | "all">("all");
  const [championId, setChampionId] = useState<number | null>(null);
  const [sort, setSort] = useState<ChampionSort>("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const leaderboardFilters = useMemo(
    () => mode === "champion" ? {
      role: championClass === "all" ? undefined : championClass,
      championId: championId ?? undefined,
    } : {},
    [championClass, championId, mode],
  );
  const linkedPlayerId = user?.linkedPlayerId == null ? null : Number(user.linkedPlayerId);
  const lookupPlayerId = selectedPlayerId ?? (
    authLoading || linkedPlayerId === null || !Number.isSafeInteger(linkedPlayerId) ? null : linkedPlayerId
  );
  const leaderboardScopeKey = `${mode}:${leaderboardFilters.role ?? "all"}:${leaderboardFilters.championId ?? "all"}`;
  const leaderboardError = leaderboardErrorKey === leaderboardScopeKey;
  const loading = !leaderboardError && loadedLeaderboardScopeKey !== leaderboardScopeKey;
  const currentPositionKey = lookupPlayerId === null ? null : `${leaderboardScopeKey}:${lookupPlayerId}`;
  const searchActive = selectedPlayerId === null && searchQuery.trim().length >= 2 && !/^\d+$/.test(searchQuery.trim());
  const positionError = positionErrorKey === currentPositionKey;
  const positionFetchReady = lookupPlayerId !== null && (selectedPlayerId !== null || !loading);
  const positionLoading = positionFetchReady && !positionError && positionKey !== currentPositionKey;
  const title = [t(mode === "account" ? "generated.players.account" : "generated.players.champion"), t("common.playerChampions.level", { level: "" }).trim()].join(" ");
  const championClassLabel = (value: ChampionClass) => t(value === "Frontline"
    ? "common.roles.frontline"
    : value === "Damage"
      ? "common.roles.damage"
      : value === "Flank"
        ? "common.roles.flank"
        : "common.roles.support");
  const resolvedChampions = useMemo(() => {
    const idsByName = new Map((referenceChampions ?? []).map((champion) => [champion.name.toLocaleLowerCase(), champion.id]));
    return STATIC_CHAMPIONS.flatMap((champion) => {
      const id = idsByName.get(champion.name.toLocaleLowerCase());
      return id == null ? [] : [{ ...champion, id }];
    });
  }, [referenceChampions]);
  const availableChampions = useMemo(
    () => resolvedChampions.filter((champion) => championClass === "all" || champion.roles.includes(championClass)),
    [championClass, resolvedChampions],
  );
  const sortedRows = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...rows]
      .sort((left, right) => {
        const leftClass = left.className ?? "";
        const rightClass = right.className ?? "";
        const comparison = sort === "level"
          ? left.level - right.level || left.xp - right.xp
          : sort === "champion"
            ? (left.championName ?? "").localeCompare(right.championName ?? "") || left.playerName.localeCompare(right.playerName)
            : leftClass.localeCompare(rightClass) || (left.championName ?? "").localeCompare(right.championName ?? "") || left.playerName.localeCompare(right.playerName);
        return comparison === 0 ? left.rank - right.rank : comparison * direction;
      });
  }, [rows, sort, sortDirection]);
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const positionRow = useMemo(() => {
    if (positionKey !== currentPositionKey) return null;
    if (mode !== "champion") return positionRows[0] ?? null;
    if (championId !== null) {
      return positionRows.find((row) => row.championId === championId) ?? null;
    }
    return positionRows.reduce<PlayerLevelLeaderboardEntry | null>((highest, row) => {
      if (highest === null) return row;
      if (row.level !== highest.level) return row.level > highest.level ? row : highest;
      if (row.xp !== highest.xp) return row.xp > highest.xp ? row : highest;
      return row.rank < highest.rank ? row : highest;
    }, null);
  }, [championId, currentPositionKey, mode, positionKey, positionRows]);

  useEffect(() => {
    let active = true;
    fetchPlayerLevelLeaderboard(mode, 100, leaderboardFilters)
      .then((data) => { if (active) { setRows(data); setLoadedLeaderboardScopeKey(leaderboardScopeKey); } })
      .catch(() => { if (active) setLeaderboardErrorKey(leaderboardScopeKey); });
    return () => { active = false; };
  }, [leaderboardFilters, leaderboardRequestVersion, leaderboardScopeKey, mode]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (selectedPlayerId !== null || query.length < 2 || /^\d+$/.test(query)) return;
    let active = true;
    const timer = window.setTimeout(() => {
      fetchPlayerSearch(query)
        .then((result) => { if (active) setSearchResults(result.slice(0, 8)); })
        .catch(() => { if (active) setSearchResults([]); })
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [searchQuery, selectedPlayerId]);

  useEffect(() => {
    if (!positionFetchReady || lookupPlayerId == null) return;
    let active = true;
    fetchPlayerLevelLeaderboard(mode, mode === "champion" && championId === null ? 100 : 1, { ...leaderboardFilters, playerId: lookupPlayerId })
      .then((result) => { if (active) { setPositionRows(result.filter((row) => row.playerId === lookupPlayerId)); setPositionKey(currentPositionKey); } })
      .catch(() => { if (active) setPositionErrorKey(currentPositionKey); });
    return () => { active = false; };
  }, [championId, currentPositionKey, leaderboardFilters, lookupPlayerId, mode, positionFetchReady, positionRequestVersion]);

  const selectPlayer = (player: PlayerSearchResult) => {
    setSelectedPlayerId(Number(player.id));
    setSearchQuery(player.name);
    setSearchResults([]);
  };

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSelectedPlayerId(null);
      setSearchResults([]);
      return;
    }
    if (/^\d+$/.test(query)) {
      const playerId = Number(query);
      if (Number.isSafeInteger(playerId) && playerId > 0) {
        setSelectedPlayerId(playerId);
        setSearchResults([]);
      }
      return;
    }
    try {
      const result = await fetchPlayerSearch(query);
      setSearchResults(result.slice(0, 8));
      const exact = result.find((player) => player.name.localeCompare(query, undefined, { sensitivity: "accent" }) === 0);
      if (exact) selectPlayer(exact);
    } catch {
      setSearchResults([]);
    }
  };

  return <div className="space-y-6">
    <PlayersPageHeader title={title} />
    {lookupPlayerId !== null && (positionLoading || positionRow || positionError) && <section aria-label={t("generated.players.rank")} className="mx-auto w-full max-w-5xl">
      {positionError ? <ErrorState onRetry={() => { setPositionErrorKey(null); setPositionRequestVersion((version) => version + 1); }} /> : <div className="pc-card-flush overflow-hidden px-4 py-3 sm:px-5">
        {positionLoading ? <dl aria-busy="true" aria-label={t("async.loading")} className={`grid gap-x-5 gap-y-3 ${mode === "champion" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
          {Array.from({ length: mode === "champion" ? 6 : 5 }, (_, index) => <div key={index}><span className="pc-skeleton block h-3 w-16 rounded" /><span className="pc-skeleton mt-2 block h-5 w-24 rounded" /></div>)}
        </dl> : positionRow && <dl className={`grid gap-x-5 gap-y-3 ${mode === "champion" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
          <div><dt className="pc-label">{t("generated.players.rank")}</dt><dd className="mt-1 font-bold tabular-nums text-pc-accent">{positionRow.rank}</dd></div>
          <div className="min-w-0"><dt className="pc-label">{t("generated.players.player")}</dt><dd className="mt-1 truncate font-medium text-pc-text"><Link href={`/players/${positionRow.playerId}`} className="hover:text-pc-accent"><PlayerName playerId={positionRow.playerId}>{positionRow.playerName}</PlayerName></Link></dd></div>
          {mode === "champion" && <div className="min-w-0"><dt className="pc-label">{t("generated.players.champion")}</dt><dd className="mt-1 truncate text-pc-text-secondary">{positionRow.championName ?? "—"}</dd></div>}
          <div><dt className="pc-label">{t("generated.players.level")}</dt><dd className="mt-1 font-bold tabular-nums text-pc-text">{formatNumber(positionRow.level)}</dd></div>
          <div><dt className="pc-label">{mode === "account" ? t("generated.players.totalXp") : t("generated.players.championXp")}</dt><dd className="mt-1 tabular-nums text-pc-text-secondary">{formatNumber(positionRow.xp)}</dd></div>
          <div><dt className="pc-label">{t("generated.players.region")}</dt><dd className="mt-1 text-pc-text-muted">{positionRow.region ?? "—"}</dd></div>
        </dl>}
      </div>}
    </section>}
    <form onSubmit={submitSearch} className="mx-auto flex w-full max-w-5xl flex-wrap items-end gap-3">
      <label className="relative min-w-60 flex-1">
        <span className="pc-label">{t("generated.players.player")}</span>
        <input
          className="pc-input mt-1 w-full"
          value={searchQuery}
          onChange={(event) => { setSearchQuery(event.target.value); setSelectedPlayerId(null); }}
          placeholder={t("generated.players.searchByInGameNameOrPlayerId")}
        />
        {searchActive && searchResults.length > 0 && <div role="listbox" className="pc-surface absolute z-10 mt-1 w-full overflow-hidden rounded-lg py-1 shadow-lg">
          {searchResults.map((player) => <button key={player.id} type="button" role="option" aria-selected="false" className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-pc-text hover:bg-pc-bg-secondary" onClick={() => selectPlayer(player)}>
            <span className="truncate">{player.name}</span><span className="shrink-0 text-xs tabular-nums text-pc-text-muted">{player.id}</span>
          </button>)}
        </div>}
      </label>
      <button type="submit" className="pc-surface flex h-[38px] w-11 items-center justify-center rounded-lg text-pc-text-secondary transition-colors hover:text-pc-text" aria-label={t("generated.players.search")} title={t("generated.players.search")}>
        <Search aria-hidden="true" className="h-4 w-4" />
      </button>
      {(selectedPlayerId !== null || searchQuery) && <button type="button" className="pc-surface flex h-[38px] w-11 items-center justify-center rounded-lg text-pc-text-secondary transition-colors hover:text-pc-text" onClick={() => { setSearchQuery(""); setSelectedPlayerId(null); setSearchResults([]); }} aria-label={t("generated.players.clearSearch")} title={t("generated.players.clearSearch")}>
        <X aria-hidden="true" className="h-4 w-4" />
      </button>}
    </form>
    {lookupPlayerId !== null && positionKey === currentPositionKey && !positionLoading && !positionError && !positionRow && <p className="mx-auto w-full max-w-5xl text-sm text-pc-text-muted">{t("performance.noData", { mode: title })}</p>}
    {mode === "champion" && <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end gap-4">
      <div>
        <span className="pc-label">{t("generated.players.class")}</span>
        <SegmentedControl
          label={t("generated.players.class")}
          value={championClass}
          onChange={(value) => {
            const nextClass = value as ChampionClass | "all";
            setChampionClass(nextClass);
            if (nextClass !== "all" && championId !== null && !resolvedChampions.find((champion) => champion.id === championId)?.roles.includes(nextClass)) setChampionId(null);
            setPage(1);
          }}
          items={[
            { value: "all", label: t("generated.players.all") },
            ...CHAMPION_CLASSES.map(({ value, icon }) => ({
              value,
              label: championClassLabel(value),
              icon: <Image src={icon} alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5 object-contain" />,
            })),
          ]}
        />
      </div>
      <label className="min-w-48 flex-1">
        <span className="pc-label">{t("generated.players.champion")}</span>
        <select className="pc-select mt-1 w-full" value={championId ?? ""} onChange={(event) => { setChampionId(event.target.value ? Number(event.target.value) : null); setPage(1); }}>
          <option value="">{t("generated.players.all")}</option>
          {availableChampions.map((champion) => <option key={champion.id} value={champion.id}>{champion.name}</option>)}
        </select>
      </label>
      <label className="min-w-40">
        <span className="pc-label">{t("generated.players.sort")}</span>
        <select className="pc-select mt-1 w-full" value={sort} onChange={(event) => { const nextSort = event.target.value as ChampionSort; setSort(nextSort); setSortDirection(nextSort === "level" ? "desc" : "asc"); setPage(1); }}>
          <option value="level">{t("generated.players.level")}</option>
          <option value="champion">{t("generated.players.champion")}</option>
          <option value="class">{t("generated.players.class")}</option>
        </select>
      </label>
      <button type="button" className="pc-surface flex h-[38px] w-11 items-center justify-center rounded-lg text-pc-text-secondary transition-colors hover:text-pc-text motion-reduce:transition-none" onClick={() => { setSortDirection((direction) => direction === "asc" ? "desc" : "asc"); setPage(1); }} aria-label={t(sortDirection === "asc" ? "generated.players.ascending" : "generated.players.descending")} title={t(sortDirection === "asc" ? "generated.players.ascending" : "generated.players.descending")}>
        {sortDirection === "asc" ? <ArrowUp aria-hidden="true" className="h-4 w-4" /> : <ArrowDown aria-hidden="true" className="h-4 w-4" />}
      </button>
    </div>}
    {leaderboardError ? <ErrorState className="mx-auto w-full max-w-5xl" onRetry={() => { setLeaderboardErrorKey(null); setLeaderboardRequestVersion((version) => version + 1); }} /> : loading ? <DataTableSkeleton rows={pageSize} className="mx-auto w-full max-w-5xl" /> : <div className="pc-card-flush mx-auto w-full max-w-5xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${mode === "champion" ? "min-w-[940px]" : "min-w-[680px]"}`}>
          <thead>
            <tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs uppercase text-pc-text-muted">
              <th className="px-4 py-3">{t("generated.players.rank")}</th>
              {mode === "champion" && <><th className="px-3 py-3 text-right">{t("generated.players.class")} {t("generated.players.rank")}</th><th className="px-3 py-3 text-right">{t("generated.players.champion")} {t("generated.players.rank")}</th></>}
              <th className="px-3 py-3">{t("generated.players.player")}</th>
              {mode === "champion" && <th className="px-3 py-3">{t("generated.players.champion")}</th>}
              <th className="px-3 py-3 text-right">{t("generated.players.level")}</th>
              <th className="px-3 py-3 text-right">{mode === "account" ? t("generated.players.totalXp") : t("generated.players.championXp")}</th>
              <th className="px-4 py-3">{t("generated.players.region")}</th>
            </tr>
          </thead>
          <tbody>{visibleRows.map((row) => <tr key={`${row.playerId}-${row.championId ?? "account"}`} className="border-b border-pc-border/50 last:border-b-0 hover:bg-pc-bg-secondary/50">
            <td className="px-4 py-3 font-bold tabular-nums text-pc-text-muted">{row.rank}</td>
            {mode === "champion" && <><td className="px-3 py-3 text-right tabular-nums text-pc-text-muted">{row.classRank == null ? "—" : formatNumber(row.classRank)}</td><td className="px-3 py-3 text-right tabular-nums text-pc-text-muted">{row.championRank == null ? "—" : formatNumber(row.championRank)}</td></>}
            <td className="px-3 py-3"><Link href={`/players/${row.playerId}`} className="font-medium text-pc-text hover:text-pc-accent"><PlayerName playerId={row.playerId}>{row.playerName}</PlayerName></Link></td>
            {mode === "champion" && <td className="px-3 py-3">{row.championName && <span className="inline-flex items-center gap-2 text-pc-text-secondary"><Image src={getChampionIconSafe(row.championName)} alt="" width={24} height={24} className="h-6 w-6 rounded object-contain" />{row.championName}</span>}</td>}
            <td className="px-3 py-3 text-right font-bold tabular-nums text-pc-accent">{formatNumber(row.level)}</td>
            <td className="px-3 py-3 text-right tabular-nums text-pc-text-secondary">{formatNumber(row.xp)}</td>
            <td className="px-4 py-3 text-pc-text-muted">{row.region ?? "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {sortedRows.length === 0 ? <div className="p-10 text-center text-sm text-pc-text-muted">{t("performance.noData", { mode: title })}</div> : <TablePagination page={page} pageSize={pageSize} totalItems={sortedRows.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />}
    </div>}
  </div>;
}
