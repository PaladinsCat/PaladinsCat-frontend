import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(relative) {
  const file = new URL(relative, import.meta.url);
  const output = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)((name) => {
    if (name.endsWith("/match-image")) return load("./match-image.ts");
    if (name === "./server-api") return { serverApiBase: () => "https://backend.example" };
    if (name === "./bounded-response-body") return load("./bounded-response-body.ts");
    return require(name);
  }, loaded, loaded.exports);
  return loaded.exports;
}

const { GET } = load("../app/match-images/[id]/route.ts");
const id = "1281129406";
const proof = (access = { tier: "guest", limit: 5, remaining: 0, resetAtMs: 1800000000000 }) => ({
  count: 1, matches: [{ match: { match_id: id }, players: [] }], access,
});
async function run(backend, requestHeaders = {}, image = () => new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "content-type": "image/png" } })) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return String(url).startsWith("https://backend.example/") ? backend() : image();
  };
  try {
    const response = await GET(new Request(`https://paladinscat.com/match-images/${id}`, { headers: requestHeaders }), { params: Promise.resolve({ id }) });
    return { response, calls };
  } finally { globalThis.fetch = original; }
}

test("every denied match grant prevents renderer access and preserves the denial", async () => {
  for (const [status, code] of [[401, "LOGIN_REQUIRED"], [403, "ACCESS_DENIED"], [429, "MATCH_DAILY_LIMIT_REACHED"], [503, "MATCH_ACCESS_UNAVAILABLE"]]) {
    const { response, calls } = await run(() => Response.json({ error: { code } }, { status, headers: { "Retry-After": "17" } }));
    assert.equal(response.status, status);
    assert.equal((await response.json()).error.code, code);
    assert.equal(response.headers.get("retry-after"), "17");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.startsWith("https://backend.example/matches/"));
  }
});

test("empty, malformed, missing and wrong-match proof never reaches the renderer", async () => {
  const invalid = [
    {}, { count: 0, matches: [] }, { count: 1, matches: [{ match: { match_id: id } }] },
    { ...proof(), matches: [{ match: { match_id: "999999999" } }] },
    proof({ tier: "guest", limit: 5, remaining: -1, resetAtMs: 1800000000000 }),
    proof({ tier: "verified", limit: 5, remaining: 0, resetAtMs: null }),
  ];
  for (const body of invalid) {
    const { response, calls } = await run(() => Response.json(body));
    assert.ok(response.status >= 400);
    assert.equal(calls.length, 1);
  }
  const { response, calls } = await run(() => new Response("invalid json"));
  assert.equal(response.status, 503);
  assert.equal(calls.length, 1);
});

test("guest, account and verified grants render only after a fresh caller-bound check", async () => {
  for (const access of [proof().access, { tier: "account", limit: 50, remaining: 49, resetAtMs: 1800000000000 }, { tier: "verified", limit: null, remaining: null, resetAtMs: null }]) {
    const { response, calls } = await run(() => Response.json(proof(access)), {
      cookie: "unrelated=secret; __Host-pc_session=caller-session; __Host-pc_guest=guest",
      authorization: "Bearer explicit-caller", "cf-connecting-ip": "192.0.2.10", "cf-ray": "edge-ray", "x-forwarded-proto": "https",
      "x-paladinscat-client-ip": "198.51.100.20", "x-paladinscat-cf-ray": "fixture-ray",
      "x-paladinscat-surface": "public", "x-pc-service-token": "untrusted", host: "untrusted.example",
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(calls.length, 2);
    const { init } = calls[0];
    const headers = new Headers(init.headers);
    assert.equal(headers.get("cookie"), "__Host-pc_session=caller-session");
    assert.equal(headers.get("authorization"), "Bearer explicit-caller");
    assert.equal(headers.get("cf-connecting-ip"), "192.0.2.10");
    assert.equal(headers.get("x-forwarded-proto"), "https");
    assert.equal(headers.get("x-paladinscat-client-ip"), "192.0.2.10");
    assert.equal(headers.get("x-paladinscat-cf-ray"), "edge-ray");
    assert.equal(headers.get("x-paladinscat-surface"), "public");
    assert.equal(headers.get("x-pc-service-token"), null);
    assert.equal(headers.get("host"), null);
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(new URL(calls[0].url).searchParams.get("skipRecovery"), "true");
    assert.equal(calls[1].init.headers, undefined);
  }
});

test("a previous render never substitutes for current admission", async () => {
  assert.equal((await run(() => Response.json(proof()))).response.status, 200);
  const denied = await run(() => Response.json({ error: { code: "MATCH_DAILY_LIMIT_REACHED" } }, { status: 429 }));
  assert.equal(denied.response.status, 429);
  assert.equal(denied.calls.length, 1);
});

test("backend failures and invalid renderer content fail closed", async () => {
  const backend = await run(() => { throw new Error("fixture timeout"); });
  assert.equal(backend.response.status, 503);
  assert.equal(backend.calls.length, 1);
  const image = await run(() => Response.json(proof()), {}, () => new Response("not an image", { headers: { "content-type": "text/html" } }));
  assert.equal(image.response.status, 503);
});
