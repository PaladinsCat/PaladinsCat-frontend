import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const requireNative = createRequire(import.meta.url);
const BACKEND = "http://backend-rust-api:3005";
function output(path) {
  return ts.transpileModule(readFileSync(new URL(path.replaceAll("%", "%25"), import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function loadReadModule({ sharedGlobal = {}, fetcher = async () => Response.json({ id: 42 }), base = () => BACKEND } = {}) {
  const loaded = { exports: {} }, maps = [], timeoutBounds = [];
  class ObservedMap extends Map {
    constructor(...args) { super(...args); maps.push(this); }
  }
  const signal = {
    timeout: (ms) => { timeoutBounds.push(ms); return AbortSignal.timeout(ms); },
    any: (signals) => AbortSignal.any(signals),
  };
  new Function("require", "module", "exports", "globalThis", "fetch", "Map", "AbortSignal", output("./auth-session-read.ts"))(
    (name) => name === "./server-api" ? { serverApiBase: base } : name === "./operator-plane" ? { accountSessionCookie: () => "__Host-pc_session" } : name === "./operator-transport.mjs" ? { operatorBackendFetch: (...args) => fetcher(...args) } : requireNative(name),
    loaded, loaded.exports, sharedGlobal, fetcher, ObservedMap, signal,
  );
  return { ...loaded.exports, maps, timeoutBounds };
}

function request(session = "session-a", alias = "/api", extra = {}) {
  return new Request(`https://paladinscat.com${alias}/auth/me`, {
    headers: { ...(session === null ? {} : { cookie: `other=untouched; __Host-pc_session=${session}` }), ...extra },
  });
}

function guardFixture(fetcher = async () => Response.json({ id: 42, username: "StableUser" })) {
  let time = 1_000, calls = 0;
  const sessionModule = loadReadModule();
  const handler = sessionModule.createSessionReadHandler({ apiBase: () => BACKEND, now: () => time,
    fetcher: async (...args) => { calls++; return fetcher(...args); } });
  return { module: sessionModule, handler, get calls() { return calls; }, get time() { return time; },
    advance: (ms) => { time += ms; } };
}

test("session bursts share the two aliases, stop before upstream, and recover in the bounded window", async () => {
  const fixture = guardFixture();
  assert.equal(fixture.module.AUTH_SESSION_READ_LIMIT, 30);
  assert.equal(fixture.module.AUTH_SESSION_READ_WINDOW_MS, 10_000);
  for (let i = 0; i < 30; i++) {
    assert.equal((await fixture.handler(request("session-a", i % 2 ? "/_pc" : "/api"))).status, 200);
  }
  fixture.advance(500);
  const limited = await fixture.handler(request());
  assert.equal(limited.status, 429); assert.equal(fixture.calls, 30);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.ok(Number(limited.headers.get("retry-after")) <= 10);
  assert.equal(limited.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(limited.headers.getSetCookie(), []);
  fixture.advance(10_000);
  assert.equal((await fixture.handler(request())).status, 200); assert.equal(fixture.calls, 31);
});

test("different sessions stay isolated behind the same client IP", async () => {
  const fixture = guardFixture();
  for (let i = 0; i < 30; i++) await fixture.handler(request("first", "/api", { "cf-connecting-ip": "192.0.2.5" }));
  assert.equal((await fixture.handler(request("first"))).status, 429);
  for (let i = 0; i < 30; i++) {
    assert.equal((await fixture.handler(request("second", "/api", { "cf-connecting-ip": "192.0.2.5" }))).status, 200);
  }
  assert.equal(fixture.calls, 60);
});

test("concurrent bursts reserve the budget before asynchronous upstream forwarding", async () => {
  const fixture = guardFixture();
  const responses = await Promise.all(Array.from({ length: 61 }, () => fixture.handler(request())));
  assert.equal(responses.filter((response) => response.status === 200).length, 30);
  assert.equal(responses.filter((response) => response.status === 429).length, 31);
  assert.equal(fixture.calls, 30);
});

test("default backend resolution stays current at request time", async () => {
  let base = "http://first-backend:3005", urls = [];
  const sessionModule = loadReadModule({ base: () => base });
  const handler = sessionModule.createSessionReadHandler({ fetcher: async (url) => { urls.push(String(url)); return Response.json({ id: 42 }); } });
  await handler(request()); base = "http://replacement-backend:3005/";
  await handler(request());
  assert.deepEqual(urls, ["http://first-backend:3005/auth/me", "http://replacement-backend:3005/auth/me"]);
});

test("identity matches Rust bearer precedence and falls back to the first nonempty session cookie", async () => {
  const fixture = guardFixture();
  for (let i = 0; i < 30; i++) await fixture.handler(request(`different-cookie-${i}`, "/api", { authorization: "Bearer shared-bearer" }));
  assert.equal((await fixture.handler(request("yet-another-cookie", "/_pc", { authorization: "Bearer shared-bearer" }))).status, 429);
  assert.equal((await fixture.handler(request("yet-another-cookie", "/api", { authorization: "Bearer different-bearer" }))).status, 200);
  for (let i = 0; i < 30; i++) await fixture.handler(request("cookie-authority", "/api", { authorization: "bearer ignored-case" }));
  assert.equal((await fixture.handler(request("cookie-authority"))).status, 429);
  for (let i = 0; i < 30; i++) await fixture.handler(request(null, "/api", { cookie: "__Host-pc_session=; __Host-pc_session=first-valid; __Host-pc_session=later" }));
  assert.equal((await fixture.handler(request("first-valid"))).status, 429);
});

test("guests reach the existing 401 owner without sharing an anonymous quota", async () => {
  const fixture = guardFixture(async () => Response.json({ error: "No token" }, { status: 401 }));
  for (let i = 0; i < 35; i++) {
    const response = await fixture.handler(request(null));
    assert.equal(response.status, 401); assert.deepEqual(await response.json(), { error: "No token" });
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  assert.equal(fixture.calls, 35);
});

test("forwarding preserves session/client headers, upstream body and cookies while removing hop headers", async () => {
  const cookies = ["first=one; Path=/; HttpOnly", "second=two; Path=/; Secure"];
  let forwarded;
  const fixture = guardFixture(async (url, options) => {
    forwarded = { url, options };
    const headers = new Headers({ "content-type": "text/plain", "cache-control": "public, max-age=3600",
      connection: "keep-alive, x-upstream-hop", "keep-alive": "timeout=5", "x-upstream-hop": "drop",
      "transfer-encoding": "chunked", "content-encoding": "gzip", "content-length": "1234",
      "x-request-id": "response-request" });
    for (const cookie of cookies) headers.append("set-cookie", cookie);
    return new Response("forwarded response", { status: 200, headers });
  });
  const incoming = request("cookie-secret", "/_pc", { authorization: "Bearer bearer-secret",
    "cf-connecting-ip": "192.0.2.10", "cf-ray": "sample-ray", "user-agent": "fixture-agent",
    "x-paladinscat-fp-screen": "1920x1080", connection: "keep-alive, x-request-hop",
    "keep-alive": "timeout=5", "x-request-hop": "drop", "proxy-authorization": "drop",
    host: "external.invalid", "content-length": "0" });
  const response = await fixture.handler(incoming);
  assert.equal(String(forwarded.url), `${BACKEND}/auth/me`);
  const headers = new Headers(forwarded.options.headers);
  for (const name of ["authorization", "cookie", "cf-connecting-ip", "cf-ray", "user-agent", "x-paladinscat-fp-screen"]) {
    assert.equal(headers.get(name), incoming.headers.get(name), name);
  }
  for (const name of ["connection", "keep-alive", "x-request-hop", "proxy-authorization", "host", "content-length"]) {
    assert.equal(headers.has(name), false, name);
  }
  assert.equal(forwarded.options.cache, "no-store"); assert.ok(forwarded.options.signal instanceof AbortSignal);
  assert.equal(response.status, 200); assert.equal(await response.text(), "forwarded response");
  assert.equal(response.headers.get("x-request-id"), "response-request");
  assert.deepEqual(response.headers.getSetCookie(), cookies);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  for (const name of ["connection", "keep-alive", "x-upstream-hop", "transfer-encoding", "content-encoding", "content-length"]) {
    assert.equal(response.headers.has(name), false, name);
  }
  assert.deepEqual(fixture.module.timeoutBounds, [5_000]);
});

test("transport failures return bounded private 503 responses without clearing a session", async () => {
  const fixture = guardFixture(async () => { throw new Error("fixture upstream failure"); });
  const response = await fixture.handler(request());
  assert.equal(response.status, 503); assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(response.headers.getSetCookie(), []); assert.equal(fixture.calls, 1);
  assert.deepEqual(fixture.module.timeoutBounds, [5_000]);
});

test("quota keys retain hashes instead of credentials and bounded capacity evicts/prunes safely", async () => {
  const fixture = guardFixture();
  assert.equal(fixture.module.AUTH_SESSION_READ_MAX_KEYS, 4096);
  const firstSecret = "raw-credential-must-not-be-retained";
  for (let i = 0; i < 30; i++) await fixture.handler(request(firstSecret));
  assert.equal((await fixture.handler(request(firstSecret))).status, 429);
  for (let i = 0; i < 4096; i++) await fixture.handler(request(`capacity-session-${i}`));
  const populated = fixture.module.maps.filter((map) => map.size > 0);
  assert.ok(populated.length > 0, "observe the actual handler quota map");
  assert.ok(populated.every((map) => map.size <= 4096));
  const retained = JSON.stringify(populated.flatMap((map) => [...map]));
  assert.equal(retained.includes(firstSecret), false); assert.equal(retained.includes("capacity-session-"), false);
  assert.equal((await fixture.handler(request(firstSecret))).status, 200, "oldest key was evicted without denying a new legitimate session");
  fixture.advance(10_001);
  assert.equal((await fixture.handler(request("after-expiry"))).status, 200);
  assert.ok(populated.every((map) => map.size < 4096), "expired full map is pruned on a later request");
});

test("both separately loaded route modules share the process-local handler singleton", async () => {
  const sharedGlobal = {}; let calls = 0;
  const fetcher = async () => { calls++; return Response.json({ id: 42 }); };
  const first = loadReadModule({ sharedGlobal, fetcher }), second = loadReadModule({ sharedGlobal, fetcher });
  const route = (path, module) => {
    const loaded = { exports: {} };
    new Function("require", "module", "exports", output(path))((name) => {
      assert.ok(name.endsWith("/auth-session-read"), name); return module;
    }, loaded, loaded.exports);
    return loaded.exports.GET;
  };
  const api = route("../app/api/auth/me/route.ts", first), compatibility = route("../app/%5Fpc/auth/me/route.ts", second);
  assert.equal(typeof api, "function"); assert.equal(api, compatibility);
  for (let i = 0; i < 30; i++) assert.equal((await (i % 2 ? api : compatibility)(request())) .status, 200);
  assert.equal((await compatibility(request("session-a", "/_pc"))).status, 429); assert.equal(calls, 30);
});

test("legacy mixed-shape actors stop on terminal 429, keep credentials, and later focus can confirm auth", async () => {
  const raw = { user_id: 42, username: "StableUser", email: null, avatar_url: null, bio: null,
    invitation_active: false, invitation_required: false, invitation_expires_at: null };
  const fixture = guardFixture(async () => Response.json(raw));
  const errors = { exports: {} };
  new Function("module", "exports", output("./api-errors.ts"))(errors, errors.exports);
  const cache = new Map([["pc_auth_token", "persistent-session"]]), actors = [], queue = [];
  let browserRequests = 0, rejections = 0, deletions = 0, lastStatus;
  for (let index = 0; index < 2; index++) {
    const storage = {
      getItem: (key) => cache.get(key) ?? null,
      setItem: (key, value) => {
        const previous = cache.get(key); cache.set(key, value);
        if (previous !== value) queue.push(1 - index);
      },
      removeItem: (key) => { deletions++; cache.delete(key); },
    };
    const dependencies = { "./api-errors": errors.exports, "./fingerprint": { fingerprintHeaders: () => ({}) },
      "./lobby-tier": { withStoredLobbyTier: (path) => path }, "./csrf": { csrfHeader: () => null } };
    const loaded = { exports: {} };
    new Function("require", "module", "exports", "window", "document", "localStorage", "fetch", output("./api-client.ts"))(
      (name) => dependencies[name] ?? {}, loaded, loaded.exports, {}, { cookie: "" }, storage,
      async (url, options) => { browserRequests++; const response = await fixture.handler(new Request(`https://paladinscat.com${url}`, options)); lastStatus = response.status; return response; },
    );
    actors.push(async () => {
      try {
        const user = await loaded.exports.getMe();
        if (index === 0) { delete user.invitationActive; delete user.invitationRequired; delete user.invitationExpiresAt; }
        loaded.exports.cacheAuthUser(user);
      } catch (error) {
        assert.equal(error.status, 429); assert.equal(loaded.exports.isAuthenticationRejection(error), false);
        rejections++;
      }
    });
  }
  await actors[0](); await actors[1]();
  for (let event = 0; queue.length && event < 100; event++) await actors[queue.shift()]();
  assert.equal(queue.length, 0, "terminal 429 emits no next cache write");
  assert.equal(lastStatus, 429); assert.ok(rejections > 0);
  assert.equal(fixture.calls, 30); assert.ok(browserRequests <= 33);
  assert.equal(deletions, 0); assert.equal(cache.get("pc_auth_token"), "persistent-session");
  fixture.advance(10_001); await actors[1]();
  assert.equal(lastStatus, 200); assert.equal(fixture.calls, 31);
  assert.equal(JSON.parse(cache.get("pc_auth_user")).id, 42);
  assert.equal(cache.get("pc_auth_token"), "persistent-session");
});
