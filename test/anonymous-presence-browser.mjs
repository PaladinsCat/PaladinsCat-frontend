/** Loopback-only transport acceptance: real Next route + Chrome, fixture backend. */
import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";
import ts from "typescript";

const seen = [];
const backend = createServer(async (request, response) => {
  let bytes = 0;
  for await (const chunk of request) bytes += chunk.length;
  seen.push({ path: request.url, method: request.method, headers: request.headers, bytes });
  response.setHeader("Set-Cookie", "fixture-upstream=must-not-forward");
  response.setHeader("Content-Type", "application/json");
  response.statusCode = request.method === "POST" ? 204 : 200;
  response.end(request.method === "POST" ? undefined : JSON.stringify({ status: "suppressed", estimated_active_pages: null, window_seconds: 60, pulse_seconds: 30 }));
});
await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: new URL("..", import.meta.url), windowsHide: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-anonymous-presence", NEXT_TELEMETRY_DISABLED: "1",
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
  const context = await browser.newContext({ extraHTTPHeaders: { DNT: "0" } });
  const page = await context.newPage();
  // A same-origin fixture document avoids loading pages that fetch unrelated data.
  await page.route(`${origin}/presence-fixture`, (route) => route.fulfill({
    status: 200, contentType: "text/html", body: "<!doctype html><title>Anonymous presence fixture</title>",
  }));
  await page.goto(`${origin}/presence-fixture`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await context.addCookies([{ name: "private-fixture", value: "must-not-send", url: origin }]);
  const bundle = ts.transpileModule(readFileSync(new URL("../lib/anonymous-presence.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  await page.evaluate((source) => {
    // Explicit opt-in synthetic fixture, separate from the user's browser. Unit
    // tests exercise DNT/GPC and cadence; here trigger the timer once for real I/O.
    Object.defineProperty(navigator, "doNotTrack", { value: "0", configurable: true });
    Object.defineProperty(navigator, "globalPrivacyControl", { value: false, configurable: true });
    window.setInterval = (callback) => { window.runPresencePulse = callback; return 999999; };
    const loadedModule = { exports: {} };
    new Function("exports", "module", source)(loadedModule.exports, loadedModule);
    window.presenceFixture = loadedModule.exports;
    window.stopPresenceFixture = loadedModule.exports.startAnonymousPresence();
  }, bundle);
  assert.equal(seen.length, 0, "no startup pulse");
  const pulseResponse = page.waitForResponse((response) => response.url() === `${origin}/api/analytics/presence` && response.request().method() === "POST");
  await page.evaluate(() => window.runPresencePulse());
  const completedPulse = await pulseResponse;
  assert.equal(completedPulse.status(), 204, "real bodyless POST is admitted by Next");
  assert.equal(completedPulse.headers()["x-pc-presence"], "aggregate-v1", "Next must invoke the privacy BFF, not a rewrite or dev interception");
  if (seen.length === 0) {
    console.log("PASS browser/server opt-out signal suppresses presence");
    // A separate, explicitly synthetic HTTP fixture tests admitted transport;
    // never relax the browser's actual opt-out handling to make it send pulses.
    const status = await new Promise((resolve, reject) => {
      const probe = httpRequest(`${origin}/api/analytics/presence`, {
        method: "POST", headers: { "sec-fetch-site": "same-origin", "content-length": "0", dnt: "0", "sec-gpc": "0" },
      }, (response) => { response.resume(); response.on("end", () => resolve(response.statusCode)); });
      probe.on("error", reject); probe.end();
    });
    assert.equal(status, 204);
  }
  assert.equal(seen.length, 1);
  assert.equal(seen[0].path, "/analytics/presence");
  assert.equal(seen[0].bytes, 0);
  for (const header of ["cookie", "authorization", "referer", "cf-connecting-ip", "x-forwarded-for", "x-request-id", "sec-ch-ua"]) {
    assert.equal(seen[0].headers[header], undefined, `not forwarded: ${header}`);
  }
  assert.doesNotMatch(seen[0].headers["user-agent"] || "", /Chrome|Mozilla/);
  assert.equal((await page.evaluate(() => window.presenceFixture.fetchAnonymousPresence())).status, "suppressed");
  assert.equal((await context.cookies()).some((cookie) => cookie.name === "fixture-upstream"), false);
  await page.evaluate(() => window.stopPresenceFixture());
  console.log("PASS browser anonymous request and opt-out; live Next -> backend: empty pulse, stripped metadata, no response cookie, aggregate read");
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await browser?.close();
  if (next.pid && next.exitCode === null) {
    if (process.platform === "win32") {
      const cleanup = spawnSync("taskkill", ["/PID", String(next.pid), "/T", "/F"], { windowsHide: true, encoding: "utf8" });
      if (cleanup.status !== 0) {
        console.error(`Test helper cleanup requires permission for PID ${next.pid}: ${cleanup.error?.message || cleanup.stderr}`);
        process.exitCode = 1;
        next.stdout.destroy(); next.stderr.destroy(); next.unref();
      }
    }
    else next.kill("SIGTERM");
  }
  backend.closeAllConnections();
  await new Promise((resolve) => backend.close(resolve));
}
