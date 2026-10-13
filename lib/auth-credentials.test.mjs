import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function compile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
function standalone(path) {
  const loaded = { exports: {} };
  new Function("module", "exports", compile(path))(loaded, loaded.exports);
  return loaded.exports;
}
const errors = standalone("./api-errors.ts"), csrf = standalone("./csrf.ts");
const { verifiedDestination } = standalone("./verified-access.ts");
const source = compile("./api-client.ts");

function fixture({ cookie = "", token = "old-browser-token", browser = true, apiBase } = {}) {
  const calls = [], storage = new Map(token ? [["pc_auth_token", token]] : []);
  const localStorage = { getItem: key => storage.get(key) ?? null };
  const document = browser ? { cookie } : undefined;
  const dependencies = {
    "./api-errors": errors, "./csrf": csrf,
    "./fingerprint": { fingerprintHeaders: () => ({}) },
    "./lobby-tier": { withStoredLobbyTier: path => path },
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", "window", "document", "localStorage", "fetch", "process", source)(
    name => dependencies[name] ?? {}, loaded, loaded.exports,
    browser ? { localStorage, location: { href: "https://paladinscat.com/search", origin: "https://paladinscat.com" } } : undefined,
    document, localStorage,
    async (url, options) => {
      const headers = new Headers(options.headers);
      calls.push({ url, options, headers });
      // Reproduce the auth owner's bearer-first resolution: a stale browser
      // token masks the otherwise valid OIDC session sent by same-origin fetch.
      const oidcCookie = cookie.split(";").some(part => part.trim().startsWith("__Host-pc_csrf="));
      if (oidcCookie && headers.get("authorization") === "Bearer old-browser-token") {
        return Response.json({ error: "Session expired" }, { status: 401 });
      }
      const path = new URL(url, "https://paladinscat.invalid").pathname;
      if (!path.endsWith("/auth/me") && !oidcCookie && !headers.has("authorization") && !headers.has("x-api-key")) {
        return Response.json({ error: { code: "LOGIN_REQUIRED", message: "Login required" } }, { status: 401 });
      }
      if (path.endsWith("/players/search")) return Response.json([{ id: "16706730", name: "VerifiedNormal",
        platform: "PC", region: "Europe", kbm_tier: "Gold" }]);
      if (path.endsWith("/search/universal")) return Response.json({ query: "VerifiedNormal", total: 1,
        data: [{ type: "player", id: "16706730", title: "VerifiedNormal", href: "/players/16706730" }] });
      return Response.json({ id: 42, username: "VerifiedNormal", linked_player_id: 16706730,
        invitation_required: false, invitation_active: false });
    }, { env: { NEXT_PUBLIC_API_URL: apiBase } },
  );
  return { ...loaded.exports, calls, storage, document };
}

test("fresh OIDC browser sessions take precedence over stored legacy tokens", async () => {
  const client = fixture({ cookie: "__Host-pc_csrf=current-csrf" });
  assert.deepEqual(client.accountAuthHeaders(), {});
  const user = await client.getMe();
  assert.equal(user.linkedPlayerId, 16706730);
  assert.equal(user.invitationRequired, false);
  assert.equal(client.calls[0].headers.has("authorization"), false);
  assert.equal(client.calls[0].options.credentials, "same-origin");
  await client.fetchJson("/players/16706730", { headers: { Authorization: "Bearer old-browser-token" } });
  assert.equal(client.calls[1].headers.has("authorization"), false, "manual legacy app headers also prefer the cookie");
  await client.fetchJson("/players/16706730/report", { method: "POST", headers: client.accountAuthHeaders() });
  assert.equal(client.calls[2].headers.get("x-csrf-token"), "current-csrf");
  assert.equal(client.storage.get("pc_auth_token"), "old-browser-token", "credential selection does not rewrite storage");
});

test("cookie-free legacy and server/native explicit bearer callers retain their credentials", async () => {
  const legacy = fixture();
  assert.deepEqual(legacy.accountAuthHeaders(), { Authorization: "Bearer old-browser-token" });
  await legacy.getMe();
  assert.equal(legacy.calls[0].headers.get("authorization"), "Bearer old-browser-token");
  const server = fixture({ browser: false });
  assert.deepEqual(server.accountAuthHeaders("native-token"), { Authorization: "Bearer native-token" });
  await server.fetchJson("/auth/me", { headers: server.accountAuthHeaders("native-token") });
  assert.equal(server.calls[0].headers.get("authorization"), "Bearer native-token");
});

test("player and universal search use the accepted cookie session and retain verified destinations", async () => {
  const client = fixture({ cookie: "__Host-pc_csrf=current-csrf" });
  const user = await client.getMe();
  const players = await client.fetchPlayerSearch("VerifiedNormal");
  assert.deepEqual(players, [{ id: "16706730", name: "VerifiedNormal", platform: "PC", region: "Europe", kbmTier: "Gold" }]);
  const universal = await client.fetchUniversalSearch("VerifiedNormal", 30);
  assert.equal(universal.total, 1);
  assert.equal(universal.data[0].type, "player");
  assert.equal(verifiedDestination(universal.data[0].href, user, false), "/players/16706730");
  for (const { headers, options } of client.calls) {
    assert.equal(headers.has("authorization"), false);
    assert.equal(options.credentials, "same-origin");
  }
  assert.equal(new URL(client.calls[1].url, "https://paladinscat.invalid").searchParams.get("q"), "VerifiedNormal");
  assert.equal(new URL(client.calls[2].url, "https://paladinscat.invalid").searchParams.get("limit"), "30");
});

test("non-Pro legacy identity continues from session proof through every shared search and data read", async () => {
  const client = fixture({ cookie: "__Host-pc_guest=fixture-guest-admission" });
  const user = await client.getMe();
  assert.equal(user.linkedPlayerId, 16706730);
  assert.equal(user.invitationActive, false);
  assert.equal(user.invitationRequired, false);
  assert.equal((await client.fetchPlayerSearch("VerifiedNormal"))[0].id, "16706730");
  const universal = await client.fetchUniversalSearch("VerifiedNormal");
  assert.equal(universal.data[0].type, "player");
  assert.equal(verifiedDestination(universal.data[0].href, user, false), "/players/16706730");
  for (const path of ["/search/players?q=VerifiedNormal", "/search/matches?q=1281147898",
    "/champions/Androxus", "/items/1", "/cards/1", "/talents/1", "/matches/1281147898"]) {
    await client.fetchJson(path);
  }
  for (const { headers, options } of client.calls) {
    assert.equal(headers.get("authorization"), "Bearer old-browser-token");
    assert.equal(options.credentials, "same-origin");
  }
});

test("default browser credentials never replace an explicit bearer or API key", async () => {
  const client = fixture({ cookie: "__Host-pc_guest=fixture-guest-admission" });
  await client.fetchJson("/search/universal?q=VerifiedNormal", { headers: { Authorization: "Bearer explicitly-selected" } });
  await client.fetchJson("/search/universal?q=VerifiedNormal", { headers: { "X-Api-Key": "fixture-api-key" } });
  assert.equal(client.calls[0].headers.get("authorization"), "Bearer explicitly-selected");
  assert.equal(client.calls[1].headers.get("x-api-key"), "fixture-api-key");
  assert.equal(client.calls[1].headers.has("authorization"), false);
});

test("default legacy tokens are limited to the browser's actual origin", async () => {
  for (const apiBase of ["https://external.invalid/api", "//external.invalid/api"]) {
    const external = fixture({ apiBase });
    await assert.rejects(external.fetchJson("/search/universal?q=VerifiedNormal"), error => error.status === 401);
    assert.equal(external.calls[0].headers.has("authorization"), false, apiBase);
  }
  const local = fixture({ apiBase: "https://paladinscat.com/api" });
  await local.fetchJson("/search/universal?q=VerifiedNormal");
  assert.equal(local.calls[0].headers.get("authorization"), "Bearer old-browser-token");
});

test("explicit separate credentials and unrelated cookie names do not silently select OIDC", async () => {
  const browser = fixture({ cookie: "__Host-pc_csrf=current-csrf" });
  assert.deepEqual(browser.accountAuthHeaders("separate-explicit-token"), { Authorization: "Bearer separate-explicit-token" });
  await browser.fetchJson("/auth/me", { headers: { Authorization: "Bearer separate-explicit-token" } });
  assert.equal(browser.calls[0].headers.get("authorization"), "Bearer separate-explicit-token");
  const unrelated = fixture({ cookie: "other=__Host-pc_csrf=current-csrf; __Host-pc_csrf_extra=fake" });
  assert.deepEqual(unrelated.accountAuthHeaders(), { Authorization: "Bearer old-browser-token" });
});
