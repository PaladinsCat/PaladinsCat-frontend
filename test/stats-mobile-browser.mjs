/** Exercise populated statistics routes in Next against an isolated loopback fixture API. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";
import { STATIC_CHAMPIONS } from "../lib/static-champions.ts";

const catalog = JSON.parse(readFileSync(new URL("../public/data/champion-data.json", import.meta.url)));
const champion = STATIC_CHAMPIONS.find(row => row.name === "Androxus");
const talents = catalog.androxus.talents.map(row => ({ talentId: row.id, talentName: row.name, totalPlays: 123456, wins: 65432, losses: 58024, winRate: 53 }));
const levels = Array.from({ length: 5 }, (_, index) => ({ level: index + 1, plays: 12345, winRate: 53 }));
const cards = catalog.androxus.loadouts.map(row => ({ cardId: row.id, cardName: row.name, totalPlays: 123456, wins: 65432, losses: 58024, winRate: 53, levels }));
const summary = { min: 10, max: 9999, mean: 1234, median: 1123, mode: 1000, p10: 400, p25: 750, p75: 1500, p90: 2500, sample_size: 1234567 };
const roles = ["Frontline", "Damage", "Flank", "Support"];
const metrics = Object.fromEntries(["dpm", "wpm", "apm", "hpm", "shpm", "gpm", "cpm", "egpm", "spm", "kda", "kpm", "deaths_per_minute"].map(key => [key, summary]));
const baselines = ["Global", ...roles].map(role => ({ role, queue_id: 486, avg_gpm: 280, avg_dpm: 1200, avg_hpm: 700, avg_shpm: 200, avg_spm: 20, avg_kda: 2, avg_egpm: 320, p10_egpm: 100, p25_egpm: 200, p75_egpm: 400, p90_egpm: 500, max_egpm: 600, sample_size: 1234567 }));
const items = ["Haven", "Chronos", "Deft Hands", "Veteran"].map((item_name, i) => ({ item_id: 13224 + i, item_name, total_uses: 123456, wins: 65432, losses: 58024, win_rate: 53, pick_rate: 25, slots: [1, 2, 3, 4].map(slot => ({ slot, total_uses: 12345, win_rate: 53 })), levels: [1, 2, 3].map(item_level => ({ item_level, total_uses: 12345, win_rate: 53 })), breakdown: [1, 2, 3, 4].map(slot => ({ slot, item_level: 3, total_uses: 12345, win_rate: 53, pick_rate: 25 })) }));
const maps = ["Frog Isle", "Warder's Gate", "Shattered Desert"].map(map => ({ map, total_matches: 123456, distribution_rate: 33.33, avg_duration_seconds: 1024 }));
const compositions = [{ comp_id: "1-1-1-2", frontline: 1, damage: 1, flank: 1, support: 2, count: 123456, wins: 65432, losses: 58024, winrate: 53 }];
const skins = STATIC_CHAMPIONS.slice(0, 12).map(row => ({ skin_id: row.id, skin_name: `Default ${row.name}`, champion_id: row.id, champion_name: row.name, total_plays: 123456, wins: 65432, losses: 58024, win_rate: 53, usage_share: 25 }));
const regionCounts = { NA: 1234, EU: 2345, Asia: 345, BR: 456, OCE: 123, LATAM: 234 };
const regions = Object.keys(regionCounts).map(region => ({ region, players: regionCounts[region], matchesPerHour: 123, totalToday: 1234, total24h: 1234 }));
const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, date: "2026-09-12", ...regionCounts, total: 4737, regions: regionCounts, platforms: { PC: 3000, PlayStation: 1000 } }));
const matchHourly = { totalToday: 123456, rankedToday: 23456, regions, hourly, currentHour: 12, allQueuesTotal24h: 123456, queues: [{ queueId: 486, queueName: "Ranked", ranked: true, total24h: 123456, regions, hourly }], weekly: Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${String(i + 5).padStart(2, "0")}`, total: 123456, ranked: 23456, queues: { 486: 23456 }, players: 23456, playerQueues: { 486: 12345 } })) };
const presence = { window_hours: 24, observed_at: "2026-09-12T12:00:00Z", public_players: 123456, unresolved_player_slots_lower: 0, unresolved_player_slots_upper: 1234, unresolved_matches: 123, public_players_lower_bound: 123456, public_players_upper_bound: 124690, private_players: 123, unresolved_private_observations: 12, public_by_scope: [{ stats_scope: "ranked", players: 12345 }], private_by_scope: [], unresolved_by_scope: [], public_by_queue: [{ queue_id: 486, queue_name: "Ranked", stats_scope: "ranked", players: 12345 }], public_by_platform: [{ platform: "PC", players: 100000 }, { platform: "PlayStation", players: 23456 }], public_by_region: regions, profile_coverage: { total: 123456, fresh: 123456, platform_known: 123456, platform_unknown: 0, last_enrichment_at: "2026-09-12T12:00:00Z" } };
const matchups = { champions: STATIC_CHAMPIONS.map(row => ({ champion_id: row.id, strong: STATIC_CHAMPIONS.filter(other => other.id !== row.id).slice(0, 5).map(other => ({ opponentChampionId: other.id, opponentChampionName: other.name, wins: 654, losses: 580, encounters: 1234, winRate: 53 })), weak: [] })) };
const tiers = Array.from({ length: 27 }, (_, i) => ({ tier: String(i + 1), tier_sort: i + 1, total_plays: 123456, avg_win_rate: 53, percentage: 3.7 }));
const pageData = { overview: { metrics, items, maps, profile_tiers: tiers, active_tiers: tiers }, skins, skin_sort: "plays", baselines, compositions };
const championStats = STATIC_CHAMPIONS.map(row => ({ champion_id: row.id, champion_name: row.name, total_plays: 123456, wins: 65432, win_rate: 53, pick_rate: 5, ban_rate: 3, avg_damage: 1234, kda: 2.3 }));
const unknown = new Set();
const api = createServer((request, response) => {
  const url = new URL(request.url, "http://fixture");
  const path = url.pathname;
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  const reply = (data, status = 200) => { response.statusCode = status; response.end(JSON.stringify(data)); };
  if (path === "/auth/me") return reply({ error: "Not authenticated" }, 401);
  if (path === "/deployment/status") return reply({ status: "idle", maintenance: false });
  if (path === "/analytics/presence") return reply({ status: "suppressed" });
  if (path === "/analytics/visit") return reply({ accepted: true });
  if (path === "/system/hirez-status") return reply({ status: "operational" });
  if (path === "/stats/activity-banner") return reply({ active: false });
  if (path === "/meta/version") return reply({ version: "mobile-fixture" });
  if (path === "/notifications") return reply([]);
  if (path === "/reference/items") return reply(items.map(row => ({ item_id: row.item_id, name: row.item_name })));
  if (path === "/stats/page-data") return reply(pageData);
  if (path === "/stats/portal-preview") return reply({ page: pageData, skins, loadoutChampions: STATIC_CHAMPIONS.slice(0, 5).map(row => ({ championId: row.id, championName: row.name, totalPlays: 123456 })), matchups, presence, presenceHourly: { hourly_by_region: hourly } });
  if (path === "/stats/champions") return reply(championStats);
  if (path === "/stats/performance-metrics/by-champion") return reply(STATIC_CHAMPIONS.map(row => ({ champion_id: row.id, champion_name: row.name, class: row.roles[0], ...summary, avg_value: 1234, total_matches: 123456 })));
  if (path === "/champions/overview") return reply({ champions: STATIC_CHAMPIONS.map(row => ({ ...row, roles: row.roles.join(", ") })), stats: STATIC_CHAMPIONS.map(row => ({ champion_id: row.id, champion_name: row.name, total_plays: 123456, wins: 65432, win_rate: 53, pick_rate: 5, ban_rate: 3, avg_dpm: 1234, avg_kda: 2.3 })) });
  if (path === "/stats/performance-metrics") return reply({ scope: url.searchParams.get("scope") || "ranked", queue_ids: [Number(url.searchParams.get("queueId") || 486)], ...metrics, roles: Object.fromEntries(roles.map(role => [role, summary])) });
  if (path === "/stats/baselines") return reply(baselines);
  if (path === "/stats/tiers") return reply(tiers);
  if (path === "/stats/tiers/summary") return reply({ profile_players: 1234567, avg_profile_tier: 12, match_player_rows: 12345678, active_players: 1234567, ranked_matches: 1234567, avg_participation_tier: 12, avg_match_tier: 12, median_match_tier: 12 });
  if (path === "/stats/items") return reply(items);
  if (path.startsWith("/stats/items/")) return reply(items[0]);
  if (path === "/stats/maps") return reply(maps);
  if (path.endsWith("/comparison")) return reply([]);
  if (path.startsWith("/stats/maps/")) return reply({ map: maps[0], champions: STATIC_CHAMPIONS.slice(0, 8).map(row => ({ champion_id: row.id, champion_name: row.name, total_plays: 123456, wins: 65432, losses: 58024, total_bans: 1234, win_rate: 53, pick_rate: 5, ban_rate: 3 })), talents: talents.map(row => ({ talent_id: row.talentId, talent_name: row.talentName, champion_id: champion.id, champion_name: champion.name, total_plays: row.totalPlays, wins: row.wins, losses: row.losses, win_rate: row.winRate, pick_rate: 33 })), items, compositions });
  if (path === "/matches/compositions") return reply(compositions);
  if (path === "/stats/skins") return reply(skins);
  if (path === "/stats/broken-skins") return reply([]);
  if (path.startsWith("/stats/talents/")) return reply({ totalMatches: 123456, talentCoveredMatches: 123456, disconnectedPlayers: 123, disconnectedWins: 23, disconnectedLosses: 100, disconnectedWinRate: 18.7, talentCoverageRate: 100, talents });
  if (/^\/stats\/cards\/\d+\/\d+$/.test(path)) return reply({ championId: champion.id, ...cards[0], talentId: null, talents });
  if (path.startsWith("/stats/cards/")) return reply({ totalMatches: 123456, cards });
  if (path === "/stats/champions/matchup-previews") return reply(matchups);
  if (path.endsWith("/matchups")) return reply({ talents: talents.map(row => ({ talent_id: row.talentId, talent_name: row.talentName })), rows: STATIC_CHAMPIONS.filter(row => row.id !== champion.id).slice(0, 8).flatMap(row => catalog[row.name.toLowerCase().replaceAll(/[^a-z0-9]/g, "")].talents.map(talent => ({ opponent_champion_id: row.id, opponent_champion_name: row.name, opponent_talent_id: talent.id, opponent_talent_name: talent.name, wins: 654, losses: 580, samples: 1234, coverage_from: "2026-01-01", coverage_to: "2026-09-12" }))) });
  if (path === "/matches/overview") return reply({ hourly: matchHourly, droppedIdsByHour: {} });
  if (path === "/matches/hourly-stats") return reply(matchHourly);
  if (path === "/stats/presence") return reply(presence);
  if (path === "/stats/presence/hourly") return reply({ ...presence, selected_queue_id: null, hourly_by_region: hourly, hourly_by_platform: hourly });
  if (path === "/stats/presence/match-ids") return reply({ ...presence, total_matches: 123456, selected_queue_id: null, queues: [{ queue_id: 486, queue_name: "Ranked", matches: 123456 }], match_ids: Array.from({ length: 15 }, (_, i) => ({ match_id: String(1234567890 + i), queue_id: 486 })), page: { current: 1, size: 250, total_pages: 494 } });
  if (/\/players\/.*\/charts/.test(path)) return reply(hourly.map((row, i) => ({ entry_datetime: `2026-09-12T${String(i).padStart(2, "0")}:00:00Z`, kills: 10 + i, deaths: 5, assists: 10, damage_per_minute: 1000 + i * 10, rating: 1500 + i })));
  unknown.add(path);
  return reply({ error: `Missing fixture: ${path}` }, 404);
});
await new Promise(resolve => api.listen(0, "127.0.0.1", resolve));
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: new URL("..", import.meta.url), windowsHide: true, env: { ...process.env, NEXT_DIST_DIR: ".next-stats-mobile", NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: "--max-old-space-size=2048", NEXT_SERVER_API_URL: `http://127.0.0.1:${api.address().port}`, NEXT_PUBLIC_API_URL: "/api", NEXT_PUBLIC_LOCAL_AUTH_BYPASS: "1", PALADINSCAT_PUBLIC_ORIGIN: origin }, stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
next.stdout.on("data", data => { log = (log + data).slice(-10000); });
next.stderr.on("data", data => { log = (log + data).slice(-10000); });
const reports = new URL("../../local/reports/stats-mobile/", import.meta.url);
mkdirSync(reports, { recursive: true });
const results = [];
try {
  const deadline = Date.now() + 90000;
  while (!log.includes("Ready")) {
    if (next.exitCode !== null || Date.now() > deadline) throw new Error(`Next startup failed: ${log}`);
    await delay(250);
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  console.log(`Fixture browser ready: ${origin}; Next PID ${next.pid}`);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  let errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const routes = ["/stats", "/stats/performance", "/stats/champions", "/stats/champions/Androxus", "/stats/loadouts", "/stats/loadouts/Androxus", `/stats/loadouts/Androxus/cards/${cards[0].cardId}`, "/stats/tiers", "/stats/skins", "/stats/ecpm", "/stats/activity", "/stats/activity/details", "/stats/player/123456/charts", "/stats/items", `/stats/items/${items[0].item_id}`, "/stats/maps", "/stats/maps/Frog%20Isle", "/stats/compositions"];
  for (const path of routes) {
    if (process.env.STATS_MOBILE_ROUTE && !path.includes(process.env.STATS_MOBILE_ROUTE)) continue;
    errors = [];
    console.log(`Checking ${path}`);
    await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("h1").first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(2500);
    const title = await page.locator("h1").allTextContents();
    const text = await page.locator("main").innerText();
    assert.doesNotMatch(text, /could not be loaded|failed to load|application error|live preview unavailable/i, `${path} must contain populated fixture data`);
    for (const width of [320, 390, 517, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
      const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll("main *")].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && !el.closest(".overflow-x-auto"); }).slice(0, 8).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 80), class: el.className })) }));
      results.push({ path, final: new URL(page.url()).pathname, title, width, ...layout, errors: [...errors], text: text.slice(0, 700) });
      if (width === 320 || width === 1440) await page.screenshot({ path: new URL(`${path.replaceAll(/[^a-z0-9]/gi, "_")}-${width}.png`, reports).pathname.replace(/^\/(\w:)/, "$1"), fullPage: true });
      if (width === 320) await page.screenshot({ path: new URL(`${path.replaceAll(/[^a-z0-9]/gi, "_")}-viewport.png`, reports).pathname.replace(/^\/(\w:)/, "$1") });
      if (path === "/stats/performance" && (width === 320 || width === 1440)) {
        const chart = page.locator("main .pc-card").filter({ has: page.getByText("Average by role", { exact: true }) });
        await chart.evaluate(el => el.scrollIntoView({ block: "center" }));
        await chart.screenshot({ path: new URL(`performance-chart-${width}.png`, reports).pathname.replace(/^\/(\w:)/, "$1") });
      }
    }
    if (path === "/stats/loadouts") {
      await page.setViewportSize({ width: 320, height: 900 });
      const filters = page.getByRole("group", { name: "Class", exact: true });
      for (const button of await filters.getByRole("button").all()) {
        const box = await button.boundingBox();
        assert.ok(box.height >= 44 && box.width >= 44 && box.x >= 0 && box.x + box.width <= 320);
      }
      await filters.getByRole("button", { name: "Support", exact: true }).click();
      await expect(page.locator('main a[href="/stats/loadouts/androxus"]')).toHaveCount(0);
      await expect(page.locator('main a[href="/stats/loadouts/ying"]')).toBeVisible();
      await filters.getByRole("button", { name: "All", exact: true }).click();
      await expect(page.locator('main a[href="/stats/loadouts/androxus"]')).toBeVisible();
    }
    if (path === "/stats/performance") {
      await page.setViewportSize({ width: 320, height: 900 });
      const scroller = page.locator('div[role="region"][aria-label="Performance distribution"]');
      await scroller.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => scroller.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    }
    console.log(JSON.stringify({ path, title, errors, overflow: results.filter(row => row.path === path && row.scroll > row.width).map(row => row.width) }));
  }
  const reportName = process.env.STATS_MOBILE_ROUTE ? `results-${process.env.STATS_MOBILE_ROUTE.replaceAll(/[^a-z0-9]/gi, "_")}.json` : "results.json";
  writeFileSync(new URL(reportName, reports), JSON.stringify({ results, unknown: [...unknown] }, null, 2));
  console.log("Unhandled fixture endpoints:", [...unknown]);
  assert.ok(results.every(row => row.scroll <= row.width), "Page-level mobile overflow; see local/reports/stats-mobile/results.json");
  assert.ok(results.every(row => row.errors.length === 0), "Browser runtime errors; see results.json");
  assert.equal(unknown.size, 0, "Every requested API endpoint must have an explicit fixture");
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await browser?.close();
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
  else next.kill("SIGTERM");
  api.closeAllConnections();
  await new Promise(resolve => api.close(resolve));
}
