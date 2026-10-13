/**
 * Regression tests for server-api session forwarding.
 *
 * Verifies that fetchServerJson forwards the session on both surfaces
 * (production bug: public surface dropped the session, causing 429 for
 * verified users) and that fetchServerJsonStatic is safe for
 * unstable_cache scopes (no dynamic data sources).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

/** Transpile a TS module and execute with injected dependencies. */
function load(file, dependencies = {}) {
  const output = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)(
    (name) => dependencies[name] ?? require(name),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

// ── fetchServerJsonStatic: no dynamic APIs, correct headers ──────────────

test("fetchServerJsonStatic sets public surface and does not forward a session", async () => {
  let capturedHeaders;
  const deps = {
    "server-only": {},
    "next/headers": { headers: () => { throw new Error("headers() must not be called in static scope"); }, cookies: () => { throw new Error("cookies() must not be called in static scope"); } },
  };
  const { fetchServerJsonStatic, serverApiBase } = load("./server-api.ts", deps);
  assert.equal(serverApiBase(), "http://localhost:3304");

  globalThis.fetch = async (url, opts) => {
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({ hello: "world" }) };
  };

  const result = await fetchServerJsonStatic("/champions/overview");
  assert.deepEqual(result, { hello: "world" });
  assert.equal(capturedHeaders.get("x-paladinscat-surface"), "public");
  assert.equal(capturedHeaders.get("accept"), "application/json");
  assert.equal(capturedHeaders.get("authorization"), null);
});

test("fetchServerJsonStatic propagates custom headers and timeout", async () => {
  let capturedOpts;
  const deps = { "server-only": {}, "next/headers": {} };
  const { fetchServerJsonStatic } = load("./server-api.ts", deps);

  globalThis.fetch = async (_url, opts) => {
    capturedOpts = opts;
    return { ok: true, json: async () => ({}) };
  };

  await fetchServerJsonStatic("/test", { timeoutMs: 500, headers: { "x-custom": "val" } });
  assert.equal(capturedOpts.headers.get("x-custom"), "val");
  assert.ok(capturedOpts.signal instanceof AbortSignal);
});

test("fetchServerJsonStatic throws on non-OK response", async () => {
  const deps = { "server-only": {}, "next/headers": {} };
  const { fetchServerJsonStatic } = load("./server-api.ts", deps);

  globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });

  await assert.rejects(
    () => fetchServerJsonStatic("/rate-limited"),
    /Server API 429 for \/rate-limited/,
  );
});

// ── fetchServerJson: session forwarded on both surfaces ──────────────────

test("fetchServerJson forwards session on public surface (regression: 429 for verified users)", async () => {
  let capturedHeaders;
  const deps = {
    "server-only": {},
    "next/headers": {
      headers: async () => new Headers({ "user-agent": "test-agent" }),
      cookies: async () => ({ get: (name) => name === "__Host-pc_session" ? { value: "token-abc" } : undefined }),
    },
  };
  const { fetchServerJson } = load("./server-api.ts", deps);

  globalThis.fetch = async (_url, opts) => {
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({}) };
  };

  await fetchServerJson("/matches/123");
  // The session MUST be forwarded regardless of surface.
  assert.equal(capturedHeaders.get("authorization"), "Bearer token-abc");
  assert.equal(capturedHeaders.get("x-paladinscat-surface"), "public");
  assert.equal(capturedHeaders.get("x-client-ua"), "test-agent");
});

test("fetchServerJson forwards session on pro surface", async () => {
  let capturedHeaders;
  const deps = {
    "server-only": {},
    "next/headers": {
      headers: async () => new Headers({ "x-paladinscat-surface": "pro" }),
      cookies: async () => ({ get: (name) => name === "__Host-pc_session" ? { value: "token-xyz" } : undefined }),
    },
  };
  const { fetchServerJson } = load("./server-api.ts", deps);

  globalThis.fetch = async (_url, opts) => {
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({}) };
  };

  await fetchServerJson("/stats/ranked-leaderboard");
  assert.equal(capturedHeaders.get("authorization"), "Bearer token-xyz");
  assert.equal(capturedHeaders.get("x-paladinscat-surface"), "pro");
});

test("fetchServerJson omits authorization when no session cookie exists", async () => {
  let capturedHeaders;
  const deps = {
    "server-only": {},
    "next/headers": {
      headers: async () => new Headers(),
      cookies: async () => ({ get: () => undefined }),
    },
  };
  const { fetchServerJson } = load("./server-api.ts", deps);

  globalThis.fetch = async (_url, opts) => {
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({}) };
  };

  await fetchServerJson("/champions/overview");
  assert.equal(capturedHeaders.get("authorization"), null);
  assert.equal(capturedHeaders.get("x-paladinscat-surface"), "public");
});

test("fetchServerJson does not overwrite an explicit Authorization header", async () => {
  let capturedHeaders;
  const deps = {
    "server-only": {},
    "next/headers": {
      headers: async () => new Headers(),
      cookies: async () => ({ get: (name) => name === "__Host-pc_session" ? { value: "cookie-token" } : undefined }),
    },
  };
  const { fetchServerJson } = load("./server-api.ts", deps);

  globalThis.fetch = async (_url, opts) => {
    capturedHeaders = opts.headers;
    return { ok: true, json: async () => ({}) };
  };

  // Simulates fetchAccountServerJson passing an explicit Authorization header.
  await fetchServerJson("/players/123", {
    headers: { Authorization: "Bearer explicit-token" },
  });
  // The explicit header must win over the cookie-derived one.
  assert.equal(capturedHeaders.get("authorization"), "Bearer explicit-token");
});

// ── fetchAccountServerJson: still requires a session ─────────────────────

test("fetchAccountServerJson throws when no session", async () => {
  const deps = {
    "server-only": {},
    "next/headers": {
      headers: async () => new Headers(),
      cookies: async () => ({ get: () => undefined }),
    },
  };
  const { fetchAccountServerJson } = load("./server-api.ts", deps);

  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });

  await assert.rejects(() => fetchAccountServerJson("/players/123"), /Login required/);
});
