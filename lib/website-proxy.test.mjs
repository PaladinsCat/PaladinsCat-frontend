import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(relative, dependencies = {}) {
  const file = new URL(relative, import.meta.url);
  const output = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)((name) => dependencies[name] || require(name), loaded, loaded.exports);
  return loaded.exports;
}
const gate = load("./website-gate.ts");
const verifiedAccess = load("./verified-access.ts");
const presenceGate = load("./anonymous-presence-gate.ts");
const { proxy } = load("../proxy.ts", {
  "./lib/website-gate": gate,
  "./lib/verified-access": verifiedAccess,
  "./lib/anonymous-presence-gate": presenceGate,
  "./lib/server-api": { serverApiBase: () => "https://backend.example" },
});
const { NextRequest } = require("next/server");

test("production proxy admits a page-issued guest, rejects direct API access, and gates verified sections through backend auth", async () => {
  const directory = mkdtempSync(join(tmpdir(), "pc-gate-test-"));
  const old = { ...process.env };
  const oldFetch = globalThis.fetch;
  try {
    const file = join(directory, "fixture-secret");
    writeFileSync(file, "ab".repeat(32)); // Disposable fixture, never a runtime credential.
    process.env.NODE_ENV = "production";
    process.env.PALADINSCAT_WEBSITE_GATE_SECRET_FILE = file;
    process.env.PALADINSCAT_PUBLIC_ORIGIN = "https://paladinscat.com";
    globalThis.fetch = async (_url, init) => {
      const authorization = new Headers(init?.headers).get("authorization");
      if (authorization === "Bearer verified") return Response.json({ linked_player_id: 42 });
      if (authorization === "Bearer unverified") return Response.json({ linked_player_id: null });
      if (authorization === "Bearer expired") return Response.json({}, { status: 401 });
      return Response.json({}, { status: 503 });
    };
    const request = (path, headers = {}) => new NextRequest(`https://paladinscat.com${path}`, { headers });
    const anonymousPresence = await proxy(request("/api/analytics/presence", { "sec-fetch-site": "same-origin" }));
    assert.equal(anonymousPresence.headers.get("x-middleware-next"), "1");
    assert.equal(anonymousPresence.headers.get("set-cookie"), null);
    assert.equal(anonymousPresence.headers.get("cache-control"), "no-store");
    for (const headers of [{}, { "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "same-origin", cookie: "visitor=fixture" }]) {
      assert.equal((await proxy(request("/api/analytics/presence", headers))).status, 400);
    }
    const page = await proxy(request("/players", { accept: "text/html" }));
    const cookie = page.cookies.get(gate.GUEST_COOKIE);
    assert.ok(cookie?.value);
    assert.match(page.headers.get("set-cookie"), /HttpOnly/);
    assert.match(page.headers.get("set-cookie"), /Secure/);
    assert.equal(page.headers.get("cache-control"), "private, no-store");
    for (const path of ["/api/notifications?limit=8", "/api/matches/1", "/_pc/matches/1"]) {
      assert.equal((await proxy(request(path))).status, 403);
      assert.equal((await proxy(request(path, { cookie: `${gate.GUEST_COOKIE}=forged` }))).status, 403);
      const headers = { cookie: `${gate.GUEST_COOKIE}=${cookie.value}`, "sec-fetch-site": "same-origin" };
      const admitted = await proxy(request(path, headers));
      assert.equal(admitted.headers.get("x-middleware-next"), "1");
      assert.equal(admitted.headers.get("cache-control"), "private, no-store");
      assert.equal((await proxy(request(path, { ...headers, origin: "http://127.0.0.1:3100" }))).status, 403);
    }
    assert.equal((await proxy(request("/api/v1/stats/champions"))).headers.get("x-middleware-next"), "1");
    assert.equal((await proxy(request("/api/auth/oidc/callback"))).headers.get("x-middleware-next"), "1");
    assert.equal((await proxy(request("/api/auth/oidc/transactions"))).status, 403);
    assert.equal((await proxy(request("/%61pi/notifications"))).status, 400);

    const guestStats = await proxy(request("/stats/performance?scope=casual"));
    assert.equal(guestStats.status, 307);
    assert.equal(new URL(guestStats.headers.get("location")).pathname, "/auth/login");
    assert.equal(new URL(guestStats.headers.get("location")).searchParams.get("redirect"), "/stats/performance?scope=casual");
    assert.equal(new URL((await proxy(request("/game/items/1"))).headers.get("location")).pathname, "/auth/login");
    assert.equal(new URL((await proxy(request("/%73tats/maps"))).headers.get("location")).pathname, "/auth/login");
    assert.equal(new URL((await proxy(request("/stats/maps", { cookie: "__Host-pc_session=expired" }))).headers.get("location")).pathname, "/auth/login");
    assert.equal(new URL((await proxy(request("/stats/maps", { cookie: "__Host-pc_session=unverified" }))).headers.get("location")).pathname, "/link-account");
    assert.equal((await proxy(request("/stats/maps", { cookie: "__Host-pc_session=verified" }))).headers.get("x-middleware-next"), "1");
    assert.equal((await proxy(request("/stats/maps", { cookie: "__Host-pc_session=backend-down" }))).status, 503);
    const guestPlayer = await proxy(request("/players/713736801?tab=matches"));
    assert.equal(new URL(guestPlayer.headers.get("location")).pathname, "/auth/login");
    assert.equal(new URL(guestPlayer.headers.get("location")).searchParams.get("redirect"), "/players/713736801?tab=matches");
    assert.equal((await proxy(request("/players/16706730", { cookie: "__Host-pc_session=unverified" }))).headers.get("x-middleware-next"), "1");
    assert.equal(new URL((await proxy(request("/players/16706730/loadouts", { cookie: "__Host-pc_session=unverified" }))).headers.get("location")).pathname, "/link-account");
    assert.equal(new URL((await proxy(request("/players/leaderboard", { cookie: "__Host-pc_session=unverified" }))).headers.get("location")).pathname, "/link-account");
    assert.equal((await proxy(request("/players/leaderboard", { cookie: "__Host-pc_session=verified" }))).headers.get("x-middleware-next"), "1");
    for (const path of ["/community", "/community/diminishing-returns", "/builds/1", "/tierlists/create"]) {
      const guest = await proxy(request(path));
      assert.equal(new URL(guest.headers.get("location")).pathname, "/auth/login", path);
      assert.equal(new URL(guest.headers.get("location")).searchParams.get("redirect"), path, path);
      assert.equal((await proxy(request(path, { cookie: "__Host-pc_session=unverified" }))).headers.get("x-middleware-next"), "1", path);
      assert.equal((await proxy(request(path, { cookie: "__Host-pc_session=verified" }))).headers.get("x-middleware-next"), "1", path);
      assert.equal((await proxy(request(path, { cookie: "__Host-pc_session=backend-down" }))).status, 503, path);
    }
    assert.equal(new URL((await proxy(request("/%63ommunity"))).headers.get("location")).pathname, "/auth/login");

    process.env.PALADINSCAT_WEBSITE_GATE_SECRET_FILE = "";
    assert.equal((await proxy(request("/api/notifications"))).status, 503);
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of ["NODE_ENV", "PALADINSCAT_WEBSITE_GATE_SECRET_FILE", "PALADINSCAT_PUBLIC_ORIGIN"]) {
      if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key];
    }
    rmSync(directory, { recursive: true });
  }
});
