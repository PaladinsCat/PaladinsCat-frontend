"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { MatchBan, MatchData, MatchPlayerDetail } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { mapImagePath } from "@/lib/map-images";
import { getRankIconPath, resolveEffectiveTier, TIER_NAMES } from "@/lib/tier-utils";
import { parseBackendDate } from "@/lib/time-format";
import PlayerName from "@/components/player-name";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import MatchExportButton from "./match-export-button";
import { computeDamageStats } from "./format";
import { getPartyNumber } from "./party-badge";
import type { MatchResultPlayer } from "./types";

type BrowserScoreboardProps = {
  match: MatchData;
  queueLabel: string;
  team1: MatchResultPlayer[];
  team2: MatchResultPlayer[];
  bans: MatchBan[];
};

type Metrics = {
  credits: number;
  objective: number;
  damage: number;
  taken: number;
  shielding: number;
  healing: number;
};

const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 1152;

function value(input: unknown) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function integer(input: unknown) {
  return Math.round(value(input)).toLocaleString("en-US");
}

function compact(input: unknown) {
  const parsed = value(input);
  return parsed >= 1000 ? `${(parsed / 1000).toFixed(1)}k` : integer(parsed);
}

function duration(seconds: number) {
  const total = Math.max(0, Math.floor(value(seconds)));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function cleanMapName(map: string) {
  return map.replace(/^(?:(?:Ranked|Live|WIP)\s+)+/i, "").replace(/\bv\d+\b/ig, "").trim() || map;
}

function cleanQueueMode(queueLabel: string) {
  return queueLabel.replace(/^(?:Ranked|Casual)\s+/i, "").trim() || queueLabel;
}

function utcTimestamp(value: string) {
  const date = parseBackendDate(value);
  if (!date) return "—";
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const timePart = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
  return `${datePart} · ${timePart} UTC`;
}

function metricsFor(player: MatchPlayerDetail): Metrics {
  return {
    credits: value(player.gold_earned),
    objective: value(player.objective_assists),
    damage: computeDamageStats(player).totalDamage,
    taken: value(player.damage_taken),
    shielding: value(player.damage_mitigated),
    healing: value(player.healing),
  };
}

function tierFor(player: MatchResultPlayer) {
  const rawTier = Number(player.profileData?.kbmTier ?? player.matchData.tier ?? player.matchData.league_tier);
  const tier = Number.isFinite(rawTier) && rawTier >= 0 ? Math.min(27, Math.round(rawTier)) : 0;
  const rank = player.profileData?.kbmRank && player.profileData.kbmRank > 0 ? player.profileData.kbmRank : 0;
  return { tier, rank, effective: resolveEffectiveTier(tier, rank) };
}

function TeamRows({ team }: { team: MatchResultPlayer[] }) {
  const players = team.slice(0, 5);
  const metrics = players.map((entry) => metricsFor(entry.matchData));
  const maximum = (key: keyof Metrics) => Math.max(0, ...metrics.map((entry) => entry[key]));

  return players.map((entry, index) => {
    const player = entry.matchData;
    const stat = metrics[index]!;
    const talent = entry.factData?.talents?.[0];
    const championHref = player.champion_name ? `/champions/${championSlug(player.champion_name)}` : null;
    const talentHref = talent?.talent_id && championHref ? `${championHref}/talents/${talent.talent_id}` : null;
    const tier = tierFor(entry);
    const party = getPartyNumber(player);
    const peak = (key: keyof Metrics, onlyIfPositive = false) => stat[key] === maximum(key) && (!onlyIfPositive || stat[key] > 0);

    return (
      <div className="player-row grid-row" key={player.player_id}>
        <div className="champion-wrap">
          {championHref ? (
            <Link href={championHref} aria-label={`${player.champion_name} champion page`} title={player.champion_name}>
              <img className="champion-icon" src={getChampionIconSafe(player.champion_name)} alt={player.champion_name} />
            </Link>
          ) : <img className="champion-icon" src={getChampionIconSafe(player.champion_name)} alt={player.champion_name} />}
          {party != null && <span className="party-badge" title={`Party ${party}`}>{party}</span>}
        </div>
        <div className="rank"><img src={getRankIconPath(tier.tier, tier.rank)} alt={tier.effective.displayName} title={tier.effective.displayName} /></div>
        <div className="level">{entry.profileData?.level != null ? integer(entry.profileData.level) : "—"}</div>
        <div className="player"><Link href={`/players/${player.player_id}`} className="player-name block" title={player.player_name || "PRIVATE"}><PlayerName playerId={player.player_id}>{player.player_name || "PRIVATE"}</PlayerName></Link><div className="player-sub">PID {player.player_id}</div></div>
        <div className="player-elo">{entry.profileData?.queueElo != null ? integer(entry.profileData.queueElo) : "—"}</div>
        {talent && talentHref ? (
          <Link href={talentHref} className="talent-link" title={talent.talent_name ?? "Talent"} aria-label={`${talent.talent_name ?? "Talent"} talent page`}>
            <CanonicalTalentImage
              talentId={talent.talent_id}
              talentName={talent.talent_name}
              className="talent-icon"
              alt={talent.talent_name ?? "Talent"}
              loading="eager"
            />
          </Link>
        ) : talent ? (
          <CanonicalTalentImage
            talentId={talent.talent_id}
            talentName={talent.talent_name}
            className="talent-icon"
            alt={talent.talent_name ?? "Talent"}
            loading="eager"
          />
        ) : <div className="talent-icon" aria-label="Talent unavailable">—</div>}
        <Metric className="credits" value={stat.credits} peak={peak("credits")} icon="/images/icons/Currency_Credits.avif" />
        <div className="metric kda">{player.kills} / {player.deaths} / {player.assists}</div>
        <Metric className="obj" value={stat.objective} peak={peak("objective")} />
        <Metric className="damage" value={stat.damage} peak={peak("damage")} />
        <Metric className="taken" value={stat.taken} peak={peak("taken")} />
        <Metric className="shield" value={stat.shielding} peak={peak("shielding", true)} />
        <Metric className="heal" value={stat.healing} peak={peak("healing", true)} />
      </div>
    );
  });
}

function Metric({ className, value: amount, peak, icon }: { className: string; value: number; peak: boolean; icon?: string }) {
  return <div className={`metric ${className}${peak ? " peak" : ""}`}>{icon && <img src={icon} alt="" />}{integer(amount)}</div>;
}

function TeamSummary({ label, won, team, teamNumber }: { label: string; won: boolean; team: MatchResultPlayer[]; teamNumber: 1 | 2 }) {
  const players = team.slice(0, 5);
  const rows = players.map((entry) => metricsFor(entry.matchData));
  const total = (key: keyof Metrics) => rows.reduce((sum, entry) => sum + entry[key], 0);
  const average = (get: (player: MatchResultPlayer) => number | null) => {
    const values = players.map(get).filter((entry): entry is number => entry != null && Number.isFinite(entry));
    return values.length ? Math.round(values.reduce((sum, entry) => sum + entry, 0) / values.length) : null;
  };
  const kda = players.reduce((sum, entry) => [sum[0] + entry.matchData.kills, sum[1] + entry.matchData.deaths, sum[2] + entry.matchData.assists], [0, 0, 0]);
  const averageLevel = average((entry) => entry.profileData?.level ?? null);
  const averageElo = average((entry) => entry.profileData?.queueElo ?? null);

  return (
    <div className={`team-bar team-${teamNumber === 1 ? "one" : "two"} grid-row`} id={`team-${teamNumber === 1 ? "one" : "two"}-summary`}>
      <div className="team-heading"><div className="team-name">{label} <span className="result">{won ? "Win" : "Defeat"}</span></div></div>
      <div className="team-total level-total average-total" title="Average level"><span className="team-average-label">AVG</span>{averageLevel == null ? "—" : integer(averageLevel)}</div>
      <div className="team-total elo-total average-total" title="Average Elo"><span className="team-average-label">AVG</span>{averageElo == null ? "—" : integer(averageElo)}</div>
      <div className="team-total credits-total" title="Total credits"><img src="/images/icons/Currency_Credits.avif" alt="" />{compact(total("credits"))}</div>
      <div className="team-total kda-total" title="Team K / D / A">{kda.join(" / ")}</div>
      <div className="team-total objective-total" title="Total objective time">{integer(total("objective"))}</div>
      <div className="team-total damage-total" title="Total damage">{compact(total("damage"))}</div>
      <div className="team-total taken-total" title="Total damage taken">{compact(total("taken"))}</div>
      <div className="team-total shield-total" title="Total shielding">{compact(total("shielding"))}</div>
      <div className="team-total healing-total" title="Total healing">{compact(total("healing"))}</div>
    </div>
  );
}

export default function BrowserScoreboard({ match, queueLabel, team1, team2, bans }: BrowserScoreboardProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const scoreboardRef = useRef<HTMLElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const mapName = useMemo(() => cleanMapName(match.map), [match.map]);
  const modeName = useMemo(() => cleanQueueMode(queueLabel), [queueLabel]);
  const ranked = match.is_ranked;
  const sortedBans = useMemo(() => [...bans].sort((a, b) => value(a.ban_slot) - value(b.ban_slot)), [bans]);
  const leftBans = sortedBans.slice(0, Math.ceil(sortedBans.length / 2)).slice(0, 4);
  const rightBans = sortedBans.slice(Math.ceil(sortedBans.length / 2)).slice(0, 4);
  const averageTier = Math.floor([...team1, ...team2].reduce((sum, player) => sum + tierFor(player).tier, 0) / Math.max(1, team1.length + team2.length));

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const resize = () => {
      const availableWidth = node.getBoundingClientRect().width;
      if (availableWidth <= 0) return;

      // Do not impose a minimum scale here. Narrow mobile containers can need
      // less than 0.2× to contain the full 2048px canvas; flooring the scale
      // made the healing/right-edge columns overflow the clipped preview.
      setPreviewScale(Math.min(1, availableWidth / CANVAS_WIDTH));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const banIcons = (entries: MatchBan[]) => entries.map((ban, index) => (
    <span className="ban-pick" key={`${ban.champion_id}-${index}`}><img src={getChampionIconSafe(ban.champion_name)} alt={ban.champion_name ?? "Banned champion"} /></span>
  ));

  return (
    <section id="browser-scoreboard" data-theme="dark" aria-label="Match scoreboard image">
      <div className="mb-2 flex justify-end"><MatchExportButton matchId={match.match_id} target={scoreboardRef} /></div>
      <div ref={previewRef} className="relative w-full overflow-hidden" style={{ height: `${CANVAS_HEIGHT * previewScale}px` }}>
        <main className="viewport" style={{ width: CANVAS_WIDTH, maxWidth: "none", transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
          <div className="scoreboard-canvas">
            <section ref={scoreboardRef} className="scoreboard" style={{ "--scoreboard-map": `url("${mapImagePath(match.map)}")` } as React.CSSProperties} aria-label="Paladins match scoreboard">
              <img className="scoreboard-map" src={mapImagePath(match.map)} alt="" aria-hidden="true" />
              <header className="hero">
                <div className="match-identity">
                  <div className="brand-line">
                    <span className="brand-name"><img src="/images/icons/paladinscat.avif" alt="" /> PaladinsCat</span>
                    <div className="status-tags">
                      <span className={`status-tag ${ranked ? "ranked" : "casual"}`}>{ranked ? "Ranked" : "Casual"}</span>
                      {match.broken && !match.recovered && <span className="status-tag broken">Broken</span>}
                      {match.recovered && <span className="status-tag recovered">Recovered</span>}
                      {match.private && <span className="status-tag private">Private</span>}
                    </div>
                  </div>
                  <div className="map-line"><div className={`map-name${mapName.length > 19 ? " long" : ""}`}>{mapName}</div></div>
                  <div className="match-context"><span>{match.region || "—"}</span><span>{modeName}</span></div>
                </div>
                <div className={`score${ranked ? "" : " casual"}`}>
                  {ranked && <div className="score-bans left"><span className="ban-label">Bans</span><div className="ban-picks">{banIcons(leftBans)}</div></div>}
                  <span className="score-number team-one-score">{match.team1_score ?? "?"}</span><span className="score-separator">/</span><span className="score-number team-two-score">{match.team2_score ?? "?"}</span>
                  {ranked && <div className="score-bans right"><span className="ban-label">Bans</span><div className="ban-picks">{banIcons(rightBans)}</div></div>}
                </div>
                <div className={`match-meta${ranked ? "" : " casual-meta"}`}>
                  <div className="tier-meta" aria-hidden={!ranked}><img src={getRankIconPath(averageTier, 0)} alt={ranked ? TIER_NAMES[averageTier] ?? "Unranked" : ""} /><div><div className="meta-value">{TIER_NAMES[averageTier] ?? "Unranked"}</div><div className="meta-label">Avg tier</div></div></div>
                  <time className="timestamp-meta" dateTime={match.entry_datetime}>{utcTimestamp(match.entry_datetime)}</time>
                  <div className="duration-meta"><div className="meta-value">{duration(match.duration_seconds)}</div><div className="meta-label">Duration</div></div>
                  <div className="match-id-meta"><div className="meta-value">{match.match_id}</div><div className="meta-label">Match ID</div></div>
                </div>
              </header>
              <div className="columns grid-row"><div>Party</div><div></div><div>Level</div><div>Player</div><div>Elo</div><div>Talent</div><div>Credits</div><div>K / D / A</div><div>OB. Time</div><div>Damage</div><div>Taken</div><div>Shielding</div><div>Healing</div></div>
              <div className="players" id="team-one"><TeamRows team={team1} /></div>
              <TeamSummary label="Team 1" won={match.winning_task_force === 1} team={team1} teamNumber={1} />
              <div className="players" id="team-two"><TeamRows team={team2} /></div>
              <TeamSummary label="Team 2" won={match.winning_task_force === 2} team={team2} teamNumber={2} />
            </section>
          </div>
        </main>
      </div>
    </section>
  );
}
