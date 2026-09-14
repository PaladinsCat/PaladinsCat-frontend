/** Real Next/React UI, loopback fixture API only. No production account or data. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";

const version = "maintenance-presence-2026-09-14-v2";
const user = { id: 1, username: "Consent fixture", email: "fixture@example.invalid", avatar_url: null, bio: null,
  is_admin: false, is_approved: true, linked_player_id: null, created_at: "2026-09-12T00:00:00Z", last_login: null, time_zone: "UTC" };
let loggedIn = false, decision = "unset", failSave = false, pulses = 0;
const choices = [];
const backend = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  const path = new URL(request.url, "http://fixture").pathname;
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  const reply = (value, status = 200) => { response.statusCode = status; response.end(JSON.stringify(value)); };
  if (path.startsWith("/auth/") && !loggedIn) return reply({ error: "Not authenticated" }, 401);
  if (path === "/auth/me") return reply(user);
  if (path === "/auth/account") return reply({ user, linkedPlayer: null });
  if (path === "/auth/account/maintenance-consent") {
    if (request.method === "PUT") {
      if (failSave) return reply({ error: "Fixture unavailable" }, 503);
      const choice = JSON.parse(body); assert.equal(choice.policy_version, version);
      assert.equal(request.headers["x-csrf-token"], "fixture-csrf");
      choices.push(choice); decision = choice.enabled ? "accepted" : "declined";
    }
    return reply({ decision, policy_version: version, updated_at: decision === "unset" ? null : new Date().toISOString() });
  }
  if (path === "/auth/account/maintenance-presence") {
    assert.equal(body, ""); assert.equal(request.headers["x-csrf-token"], "fixture-csrf");
    if (decision !== "accepted") return reply({ error: "Consent required" }, 403);
    pulses++; return reply({ accepted: true });
  }
  if (path === "/auth/account/player-link/verification") return reply({ verification: null });
  if (path === "/deployment/status") return reply({ status: "idle", maintenance: false });
  if (path === "/analytics/presence") return reply({ status: "suppressed", estimated_active_pages: null });
  return reply({ data: [], notifications: [], banners: [], items: [], status: "idle" });
});
await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: new URL("..", import.meta.url), windowsHide: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-maintenance-consent", NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: "--max-old-space-size=2048",
    NEXT_SERVER_API_URL: `http://127.0.0.1:${backend.address().port}`, NEXT_PUBLIC_API_URL: "/api", PALADINSCAT_PUBLIC_ORIGIN: origin },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "", browser;
next.stdout.on("data", (data) => { log = (log + data).slice(-6000); });
next.stderr.on("data", (data) => { log = (log + data).slice(-6000); });
try {
  const deadline = Date.now() + 60_000;
  while (!log.includes("Ready")) {
    if (next.exitCode !== null || Date.now() > deadline) throw new Error(`Next startup failed: ${log}`);
    await delay(250);
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
    document.cookie = "__Host-pc_csrf=fixture-csrf; Secure; Path=/";
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto(`${origin}/privacy`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Optional maintenance presence", exact: true })).toBeVisible({ timeout: 60_000 });
  assert.equal(await page.locator("[data-maintenance-consent-banner]").count(), 0);
  assert.equal(pulses, 0, "guests send no maintenance signals");

  loggedIn = true;
  await page.goto(`${origin}/account`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const banner = page.locator("[data-maintenance-consent-banner]");
  await expect(banner).toBeVisible({ timeout: 60_000 });
  await page.clock.runFor(31_000); assert.equal(pulses, 0, "undecided account sends nothing");
  await banner.screenshot({ path: "../local/reports/maintenance-consent-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(banner.getByRole("button", { name: "Decline maintenance measurement" })).toBeVisible();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await banner.screenshot({ path: "../local/reports/maintenance-consent-mobile.png" });
  await banner.getByRole("button", { name: "Decline maintenance measurement" }).click();
  await expect(banner).toHaveCount(0); assert.equal(decision, "declined");
  await page.reload(); await expect(page.locator("#maintenance-privacy")).toBeVisible();
  assert.equal(await banner.count(), 0, "saved decline is not asked again at login");
  const settings = page.locator("#maintenance-privacy");
  await settings.getByRole("button", { name: "Allow maintenance measurement" }).click();
  await expect(settings).toContainText("Enabled for this account");
  // Account/auth pages never generate presence. Use a public page with the same provider.
  await settings.getByRole("link", { name: "Purpose, data and retention" }).click();
  await expect(page.getByRole("heading", { name: "Optional maintenance presence", exact: true })).toBeVisible();
  await page.clock.runFor(31_000);
  await expect.poll(() => pulses).toBeGreaterThan(0);
  const afterOptIn = pulses;
  const otherTab = await context.newPage();
  await otherTab.goto(`${origin}/account`, { waitUntil: "domcontentloaded" });
  await expect(otherTab.locator("#maintenance-privacy")).toContainText("Enabled for this account");
  await page.goto(`${origin}/account`, { waitUntil: "domcontentloaded" });
  failSave = true;
  await settings.getByRole("button", { name: "Decline maintenance measurement" }).click();
  await expect(settings.getByRole("alert")).toBeVisible(); assert.equal(decision, "accepted");
  failSave = false;
  await settings.getByRole("button", { name: "Decline maintenance measurement" }).click();
  await expect(settings).toContainText("Disabled for this account");
  await expect(otherTab.locator("#maintenance-privacy")).toContainText("Disabled for this account");
  await otherTab.close();
  await settings.getByRole("link", { name: "Purpose, data and retention" }).click();
  await expect(page.getByRole("heading", { name: "Optional maintenance presence", exact: true })).toBeVisible();
  await page.clock.runFor(61_000); assert.equal(pulses, afterOptIn, "withdrawal stops subsequent signals");
  assert.deepEqual(choices.map((choice) => [choice.enabled, choice.source]), [[false,"login_banner"],[true,"account_settings"],[false,"account_settings"]]);
  console.log("PASS real login banner, responsive layout, decline persistence, settings opt-in, authenticated empty pulse, failed-save feedback, withdrawal and privacy disclosure");
} catch (error) {
  console.error(log); throw error;
} finally {
  await browser?.close();
  if (next.pid && next.exitCode === null) {
    const cleanup = spawnSync("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true, encoding: "utf8" });
    if (cleanup.status !== 0) { console.error(`Fixture cleanup failed for PID ${next.pid}: ${cleanup.stderr}`); process.exitCode = 1; next.stdout.destroy(); next.stderr.destroy(); next.unref(); }
  }
  backend.closeAllConnections(); await new Promise((resolve) => backend.close(resolve));
}
