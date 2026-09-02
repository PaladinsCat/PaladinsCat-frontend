"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { fetchPlayerLevelLeaderboard, type PlayerLevelLeaderboardEntry } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { LoadingPanel } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import TablePagination, { type TablePageSize } from "@/components/table-pagination";
import { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { useLocalization } from "@/lib/localization-context";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";

type LevelMode = "account" | "champion";
type ChampionClass = "Frontline" | "Damage" | "Flank" | "Support";
type ChampionSort = "level" | "champion" | "class";

const CHAMPION_CLASSES: Array<{ value: ChampionClass; icon: string }> = [
  { value: "Frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", icon: "/images/icons/Class_Support_Icon.avif" },
];
const championClassByName = new Map(STATIC_CHAMPIONS.map(({ name, roles }) => [name, roles[0]]));

export default function PlayerLevelLeaderboard({ mode }: { mode: LevelMode }) {
  const { t, formatNumber } = useLocalization();
  const [rows, setRows] = useState<PlayerLevelLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = usePersistentDirectoryPage(`playerLevelLeaderboard:${mode}`);
  const [pageSize, setPageSize] = useState<TablePageSize>(25);
  const [championClass, setChampionClass] = useState<ChampionClass | "all">("all");
  const [championId, setChampionId] = useState<number | null>(null);
  const [sort, setSort] = useState<ChampionSort>("level");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const title = [t(mode === "account" ? "generated.players.account" : "generated.players.champion"), t("common.playerChampions.level", { level: "" }).trim()].join(" ");
  const championClassLabel = (value: ChampionClass) => t(value === "Frontline"
    ? "common.roles.frontline"
    : value === "Damage"
      ? "common.roles.damage"
      : value === "Flank"
        ? "common.roles.flank"
        : "common.roles.support");
  const availableChampions = useMemo(
    () => STATIC_CHAMPIONS.filter((champion) => championClass === "all" || champion.roles.includes(championClass)),
    [championClass],
  );
  const sortedRows = useMemo(() => {
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...rows]
      .filter((row) => {
        const rowClass = championClassByName.get(row.championName ?? "");
        return (championClass === "all" || rowClass === championClass)
          && (championId === null || row.championId === championId);
      })
      .sort((left, right) => {
        const leftClass = championClassByName.get(left.championName ?? "") ?? "";
        const rightClass = championClassByName.get(right.championName ?? "") ?? "";
        const comparison = sort === "level"
          ? left.level - right.level || left.xp - right.xp
          : sort === "champion"
            ? (left.championName ?? "").localeCompare(right.championName ?? "") || left.playerName.localeCompare(right.playerName)
            : leftClass.localeCompare(rightClass) || (left.championName ?? "").localeCompare(right.championName ?? "") || left.playerName.localeCompare(right.playerName);
        return comparison === 0 ? left.rank - right.rank : comparison * direction;
      });
  }, [championClass, championId, rows, sort, sortDirection]);
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    let active = true;
    fetchPlayerLevelLeaderboard(mode)
      .then((data) => { if (active) setRows(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode]);

  return <div className="space-y-6">
    <PlayersPageHeader title={title} />
    {mode === "champion" && <div className="flex flex-wrap items-end gap-4">
      <div>
        <span className="pc-label">{t("generated.players.class")}</span>
        <SegmentedControl
          label={t("generated.players.class")}
          value={championClass}
          onChange={(value) => {
            const nextClass = value as ChampionClass | "all";
            setChampionClass(nextClass);
            if (nextClass !== "all" && championId !== null && !STATIC_CHAMPIONS.find((champion) => champion.id === championId)?.roles.includes(nextClass)) setChampionId(null);
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
    {loading ? <LoadingPanel /> : <div className="pc-card-flush overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-pc-border bg-pc-bg-secondary text-left text-xs uppercase text-pc-text-muted">
              <th className="px-4 py-3">{t("generated.players.rank")}</th>
              <th className="px-3 py-3">{t("generated.players.player")}</th>
              {mode === "champion" && <th className="px-3 py-3">{t("generated.players.champion")}</th>}
              <th className="px-3 py-3 text-right">{t("generated.players.level")}</th>
              <th className="px-3 py-3 text-right">{mode === "account" ? t("generated.players.totalXp") : t("generated.players.championXp")}</th>
              <th className="px-4 py-3">{t("generated.players.region")}</th>
            </tr>
          </thead>
          <tbody>{visibleRows.map((row) => <tr key={`${row.playerId}-${row.championId ?? "account"}`} className="border-b border-pc-border/50 last:border-b-0 hover:bg-pc-bg-secondary/50">
            <td className="px-4 py-3 font-bold tabular-nums text-pc-text-muted">{row.rank}</td>
            <td className="px-3 py-3"><Link href={`/players/${row.playerId}`} className="font-medium text-pc-text hover:text-pc-accent"><PlayerName playerId={row.playerId}>{row.playerName}</PlayerName></Link></td>
            {mode === "champion" && <td className="px-3 py-3">{row.championName && <span className="inline-flex items-center gap-2 text-pc-text-secondary"><img src={getChampionIconSafe(row.championName)} alt="" className="h-6 w-6 rounded object-contain" />{row.championName}</span>}</td>}
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
