"use client";

import type { MatchBan, MatchFactPlayer, MatchPlayerDetail } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getTalentImageUrl } from "@/lib/image-assets";
import { getRankIconPath, TIER_NAMES } from "@/lib/tier-utils";
import type { PlayerProfileData } from "./types";

export type MatchImageTheme = "dark" | "light";
export const DEFAULT_MATCH_IMAGE_THEME: MatchImageTheme = "dark";
export const MATCH_IMAGE_WIDTH = 2048;
export const MATCH_IMAGE_HEIGHT = 1152;

export type MatchScoreboardInput = {
  matchId: number;
  map: string;
  queueLabel: string;
  region: string;
  duration: string;
  team1Score: number;
  team2Score: number;
  team1Wins: boolean;
  team2Wins: boolean;
  team1: MatchPlayerDetail[];
  team2: MatchPlayerDetail[];
  bans?: MatchBan[];
  facts?: MatchFactPlayer[];
  profiles?: Map<string, PlayerProfileData> | null;
  theme?: MatchImageTheme;
};

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;
const SCALE = MATCH_IMAGE_WIDTH / BASE_WIDTH;
const GRID_CENTERS = [46, 102, 161, 303, 444, 505, 589, 702, 796, 886, 994, 1102, 1210];
const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return cached;
  const pending = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
  imageCache.set(src, pending);
  return pending;
}

function mapImagePath(mapName: string) {
  const normalized = mapName.replace(/^(?:(?:Ranked|Live)\s+)+/i, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `/images/maps/Ranked_${normalized}.avif`;
}

function cleanMapName(mapName: string) {
  return mapName.replace(/^(?:(?:Ranked|Live)\s+)+/i, "");
}

function number(value: number | null | undefined) {
  return Math.round(Number(value ?? 0)).toLocaleString("en-US");
}

function compact(value: number) {
  return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : number(value);
}

function playerDamage(player: MatchPlayerDetail) {
  return Number(player.damage_done_physical || player.damage_done_magical || player.damage_done_in_hand || 0);
}

function playerTier(player: MatchPlayerDetail, profile?: PlayerProfileData | null) {
  const profileTier = Number(profile?.kbmTier ?? 0);
  const numeric = profileTier > 0 ? profileTier : Number(player.tier ?? player.league_tier ?? 0);
  if (Number.isFinite(numeric) && numeric >= 0) return Math.min(27, Math.floor(numeric));
  const wanted = String(player.league_tier ?? "").toLowerCase();
  const match = Object.entries(TIER_NAMES).find(([, name]) => name.toLowerCase() === wanted);
  return match ? Number(match[0]) : 0;
}

function partyNumber(player: MatchPlayerDetail) {
  const value = Number(player.party ?? player.party_number ?? player.party_id ?? 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function text(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "center", weight = 700) {
  context.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(value, x, y);
}

function line(context: CanvasRenderingContext2D, x: number, y1: number, y2: number, color: string) {
  const gradient = context.createLinearGradient(0, y1, 0, y2);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(.3, color);
  gradient.addColorStop(.7, color);
  gradient.addColorStop(1, "transparent");
  context.strokeStyle = gradient;
  context.lineWidth = .7;
  context.beginPath();
  context.moveTo(x, y1);
  context.lineTo(x, y2);
  context.stroke();
}

function underline(context: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) {
  const gradient = context.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(.3, color);
  gradient.addColorStop(.7, color);
  gradient.addColorStop(1, "transparent");
  context.save();
  context.shadowColor = color;
  context.shadowBlur = 7;
  context.globalAlpha = .6;
  context.strokeStyle = gradient;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x - width / 2, y);
  context.lineTo(x + width / 2, y);
  context.stroke();
  context.restore();
}

export async function renderMatchScoreboard(input: MatchScoreboardInput): Promise<HTMLCanvasElement> {
  const theme = input.theme ?? DEFAULT_MATCH_IMAGE_THEME;
  const dark = theme === "dark";
  const canvas = document.createElement("canvas");
  canvas.width = MATCH_IMAGE_WIDTH;
  canvas.height = MATCH_IMAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot create a match image.");
  const drawContext = context;
  context.scale(SCALE, SCALE);

  const mapImage = await loadImage(mapImagePath(input.map));
  context.fillStyle = dark ? "#161618" : "#f5f7f9";
  context.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  if (mapImage) {
    context.save();
    context.globalAlpha = dark ? .7 : .6;
    context.filter = dark ? "saturate(1.15)" : "saturate(1.4)";
    drawCover(context, mapImage, 0, 0, BASE_WIDTH, BASE_HEIGHT);
    context.restore();
  }

  const palette = dark ? {
    text: "#f4f7fb", muted: "#8c99ab", header: "rgba(22,22,24,.80)", summary: "rgba(22,22,24,.80)",
    team1: ["rgba(11,61,132,.80)", "rgba(7,41,88,.80)"], team2: ["rgba(149,39,39,.80)", "rgba(99,26,26,.80)"],
    blue: "#0c4493", red: "#a52b2b", separator: "rgba(148,163,184,.20)",
  } : {
    text: "#000000", muted: "#000000", header: "rgba(233,237,241,.80)", summary: "rgba(233,237,241,.80)",
    team1: ["rgba(102,137,187,.80)", "rgba(58,104,168,.80)"], team2: ["rgba(198,122,122,.80)", "rgba(182,83,83,.80)"],
    blue: "#0c4493", red: "#a52b2b", separator: "rgba(45,55,65,.24)",
  };

  const headers = ["PARTY", "", "LEVEL", "PLAYER", "ELO", "TALENT", "CREDITS", "K / D / A", "OB. TIME", "DAMAGE", "TAKEN", "SHIELDING", "HEALING"];
  context.fillStyle = palette.header;
  context.fillRect(0, 0, BASE_WIDTH, 26);
  headers.forEach((label, index) => text(context, label, GRID_CENTERS[index]!, 13, 8.5, dark ? "#758397" : "#000", index === 3 ? "left" : "center", 760));

  const facts = new Map((input.facts ?? []).map((fact) => [String(fact.player_id), fact]));
  const profiles = input.profiles ?? new Map<string, PlayerProfileData>();
  const allPlayers = [...input.team1, ...input.team2];
  const tiers = allPlayers.map((player) => playerTier(player, profiles.get(String(player.player_id)))).filter((tier) => tier >= 0);
  const avgTier = tiers.length ? Math.floor(tiers.reduce((sum, tier) => sum + tier, 0) / tiers.length) : 0;
  const currencyIcon = await loadImage("/images/icons/Currency_Credits.avif");

  async function drawTeam(players: MatchPlayerDetail[], team: 1 | 2, startY: number) {
    const context = drawContext;
    const rows = players.slice(0, 5);
    const metrics = rows.map((player) => ({
      credits: Number(player.gold_earned ?? 0), obj: Number(player.objective_assists ?? 0), damage: playerDamage(player),
      taken: Number(player.damage_taken ?? 0), shield: Number(player.damage_mitigated ?? 0), healing: Number(player.healing ?? 0),
    }));
    const maxima = Object.fromEntries(["credits", "obj", "damage", "taken", "shield", "healing"].map((key) => [key, Math.max(0, ...metrics.map((row) => row[key as keyof typeof row]))]));
    for (let index = 0; index < 5; index++) {
      const player = rows[index];
      const y = startY + index * 55;
      context.fillStyle = (team === 1 ? palette.team1 : palette.team2)[index % 2]!;
      context.fillRect(0, y, BASE_WIDTH, 55);
      context.strokeStyle = palette.separator;
      context.lineWidth = .65;
      context.beginPath(); context.moveTo(0, y + 55); context.lineTo(BASE_WIDTH, y + 55); context.stroke();
      [76,128,194,412,476,534,644,760,832,940,1048,1156].forEach((x) => line(context, x, y + 5, y + 50, palette.separator));
      if (!player) continue;

      const profile = profiles.get(String(player.player_id));
      const tier = playerTier(player, profile);
      const fact = facts.get(String(player.player_id));
      const talent = fact?.talents?.[0];
      const talentSrc = talent?.icon_url || talent?.fallback_icon_url || (talent?.talent_name ? getTalentImageUrl(player.champion_name, talent.talent_name, "avif") : null);
      const [champion, rank, talentImage] = await Promise.all([
        loadImage(getChampionIconSafe(player.champion_name)), loadImage(getRankIconPath(tier, 0)), loadImage(talentSrc),
      ]);
      if (champion) { context.save(); roundedRect(context, 20, y + 1.5, 52, 52, 8); context.clip(); drawCover(context, champion, 20, y + 1.5, 52, 52); context.restore(); }
      if (rank) context.drawImage(rank, 80, y + 6.5, 44, 42);
      if (talentImage) context.drawImage(talentImage, 480, y + 2.5, 50, 50);
      if (currencyIcon) context.drawImage(currencyIcon, 548, y + 20, 15, 15);
      const party = partyNumber(player);
      if (party) {
        context.fillStyle = "rgba(15,118,110,.94)"; roundedRect(context, 57, y - 2, 20, 17, 8); context.fill();
        text(context, String(party), 67, y + 6.5, 9, "#f5fffd", "center", 850);
      }

      const snapshotLevel = Number(player.final_match_level ?? 0);
      const level = snapshotLevel > 0 ? snapshotLevel : Number(profile?.level ?? 0);
      const elo = Number(profile?.queueElo ?? profile?.championElo ?? 0);
      const values = metrics[index]!;
      text(context, number(level), 161, y + 27, 16.5, palette.text);
      text(context, player.player_name || "PRIVATE", 206, y + 20, 18, palette.text, "left", 760);
      text(context, `PID ${player.player_id || 0}`, 206, y + 39, 12.5, palette.muted, "left", 550);
      text(context, elo > 0 ? number(elo) : "—", 444, y + 27, 16.5, palette.text);
      const cells = [
        [values.credits, 589, "#f9c95f", "credits"], [null, 702, "", "kda"], [values.obj, 796, "#f4b974", "obj"],
        [values.damage, 886, "#ff6675", "damage"], [values.taken, 994, "#c94f60", "taken"],
        [values.shield, 1102, "#87a8ff", "shield"], [values.healing, 1210, "#66e3a4", "healing"],
      ] as const;
      text(context, number(values.credits), 589, y + 27, 21, palette.text);
      text(context, `${player.kills} / ${player.deaths} / ${player.assists}`, 702, y + 27, 18, palette.text);
      text(context, number(values.obj), 796, y + 27, 21, palette.text);
      text(context, number(values.damage), 886, y + 27, 21, palette.text);
      text(context, number(values.taken), 994, y + 27, 21, palette.text);
      text(context, number(values.shield), 1102, y + 27, 21, palette.text);
      text(context, number(values.healing), 1210, y + 27, 21, palette.text);
      cells.forEach(([value, x, accent, key]) => { if (value != null && value > 0 && value === maxima[key]) underline(context, x, y + 49, 56, accent); });
    }

    const summaryY = startY + 275;
    context.fillStyle = palette.summary; context.fillRect(0, summaryY, BASE_WIDTH, 29);
    const won = team === 1 ? input.team1Wins : input.team2Wins;
    const accent = team === 1 ? palette.blue : palette.red;
    context.fillStyle = accent; context.beginPath(); context.arc(22, summaryY + 14.5, 3, 0, Math.PI * 2); context.fill();
    text(context, `TEAM ${team}`, 31, summaryY + 14.5, 9, accent, "left", 800);
    text(context, won ? "WIN" : "DEFEAT", team === 1 ? 79 : 78, summaryY + 14.5, 8, accent, "left", 760);
    const divisor = Math.max(1, rows.length);
    const sum = (key: keyof (typeof metrics)[number]) => metrics.reduce((total, row) => total + row[key], 0);
    const totals = [Math.round(rows.reduce((s,p) => { const snapshot = Number(p.final_match_level ?? 0); return s + (snapshot > 0 ? snapshot : Number(profiles.get(String(p.player_id))?.level ?? 0)); }, 0) / divisor),
      Math.round(rows.reduce((s,p) => s + Number(profiles.get(String(p.player_id))?.queueElo ?? 0), 0) / divisor), sum("credits"),
      `${rows.reduce((s,p)=>s+p.kills,0)} / ${rows.reduce((s,p)=>s+p.deaths,0)} / ${rows.reduce((s,p)=>s+p.assists,0)}`,
      sum("obj"), sum("damage"), sum("taken"), sum("shield"), sum("healing")];
    [161,444,589,702,796,886,994,1102,1210].forEach((x, i) => text(context, i === 0 || i === 1 ? `AVG ${number(Number(totals[i]))}` : typeof totals[i] === "number" ? compact(totals[i] as number) : String(totals[i]), x, summaryY + 14.5, 11.5, palette.text));
  }

  await drawTeam(input.team1, 1, 26);

  const heroY = 330;
  context.fillStyle = dark ? "rgba(22,22,24,.30)" : "rgba(232,237,241,.24)";
  context.fillRect(0, heroY, BASE_WIDTH, 86);
  context.strokeStyle = "rgba(55,214,192,.26)"; context.beginPath(); context.moveTo(0, 416); context.lineTo(BASE_WIDTH, 416); context.stroke();
  const [logo, avgRank] = await Promise.all([loadImage("/images/icons/paladinscat.avif"), loadImage(getRankIconPath(avgTier, 0))]);
  if (logo) context.drawImage(logo, 28, heroY + 11, 22, 22);
  text(context, "PaladinsCat", 58, heroY + 22, 13, palette.text, "left", 760);
  text(context, cleanMapName(input.map), 28, heroY + 57, 23, palette.text, "left", 780);
  const queueWords = [input.region || "—", /ranked/i.test(input.queueLabel) ? "RANKED" : "CASUAL", /siege|ranked/i.test(input.queueLabel) ? "SIEGE" : input.queueLabel.toUpperCase()].filter(Boolean);
  queueWords.forEach((word, index) => text(context, word, 250, heroY + 45 + index * 11, 11, dark ? "#c2ccd8" : "#000", "left", 780));

  const sortedBans = [...(input.bans ?? [])].sort((a,b) => Number(a.ban_slot ?? 0) - Number(b.ban_slot ?? 0));
  const split = Math.ceil(sortedBans.length / 2);
  const banTeams = [sortedBans.slice(0, split), sortedBans.slice(split)];
  for (let side = 0; side < 2; side++) {
    const bans = banTeams[side]!.slice(0, 4);
    const startX = side === 0 ? 430 - (bans.length * 28) : 850 - (bans.length * 28);
    text(context, "BANS", side === 0 ? 505 : 775, heroY + 12, 9, palette.text, "center", 550);
    for (let index = 0; index < bans.length; index++) {
      const ban = bans[index]!;
      const icon = await loadImage(getChampionIconSafe(ban.champion_name || ""));
      if (icon) { context.save(); roundedRect(context, startX + index * 58, heroY + 22, 52, 52, 6); context.clip(); drawCover(context, icon, startX + index * 58, heroY + 22, 52, 52); context.restore(); }
    }
  }
  text(context, String(input.team1Score), 602, heroY + 39, 41, palette.blue, "center", 820);
  text(context, "/", 640, heroY + 43, 17, dark ? "#607086" : "#667382", "center", 600);
  text(context, String(input.team2Score), 678, heroY + 49, 41, palette.red, "center", 820);
  if (avgRank) context.drawImage(avgRank, 958, heroY + 27, 32, 32);
  text(context, "AVG TIER", 1010, heroY + 28, 9, palette.muted, "left", 500);
  text(context, TIER_NAMES[avgTier] ?? "Unranked", 1010, heroY + 47, 14, palette.text, "left", 700);
  text(context, "DURATION", 1080, heroY + 28, 9, palette.muted, "left", 500);
  text(context, input.duration, 1080, heroY + 47, 14, palette.text, "left", 700);
  text(context, "MATCH ID", 1252, heroY + 28, 9, palette.muted, "right", 500);
  text(context, String(input.matchId), 1252, heroY + 47, 14, palette.text, "right", 700);

  await drawTeam(input.team2, 2, 416);

  context.strokeStyle = "rgba(111,130,153,.45)"; context.lineWidth = 1;
  roundedRect(context, .5, .5, BASE_WIDTH - 1, BASE_HEIGHT - 1, 18); context.stroke();
  return canvas;
}
