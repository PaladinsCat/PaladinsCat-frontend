import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

function load(path, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(name => dependencies[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports;
}

// Drive the full callback GET so the token exchange reaches the backend and record
// exactly which headers the BFF placed on the exchange request.
async function runCallback({ cfHeaders = {} } = {}) {
  const envKeys = ["OIDC_ISSUER", "OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET", "OIDC_INTERNAL_ISSUER", "PALADINSCAT_PUBLIC_ORIGIN", "NEXT_SERVER_API_URL"];
  const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const bffCalls = [];
  let exchangeInit;
  const route = load("../app/api/auth/oidc/callback/route.ts", {
    "@/lib/oidc-security": {
      newCsrfToken: () => "csrf-value",
      normalizedHttpsIssuer: value => value,
      safeReturnPath: value => value || "/",
      parseTransaction: () => ({ state: "s", nonce: "n", verifier: "v", returnPath: "/", issuedAt: 0 }),
      resolveInternalIssuer: issuer => issuer,
      stateMatches: () => true,
      validateIdToken: async () => ({ iss: "https://auth.example/realms/test", aud: "test-web", exp: 9_999_999_999, iat: 1, nonce: "n", pc_keep_signed_in: false }),
    },
    "@/lib/oidc-bff-service": {
      oidcBffServiceHeaders: async (cf) => {
        bffCalls.push(cf);
        // Faithful to the real BFF: merge only the two CF headers when present.
        const headers = { authorization: "Bearer test-service" };
        if (cf?.["cf-connecting-ip"]) headers["cf-connecting-ip"] = cf["cf-connecting-ip"];
        if (cf?.["cf-ray"]) headers["cf-ray"] = cf["cf-ray"];
        return headers;
      },
    },
    "@/lib/oidc-client-secret": { oidcClientSecret: () => "test-secret" },
  });
  process.env.OIDC_ISSUER = "https://auth.example/realms/test";
  process.env.OIDC_CLIENT_ID = "test-web";
  process.env.OIDC_CLIENT_SECRET = "test-secret";
  delete process.env.OIDC_INTERNAL_ISSUER;
  process.env.PALADINSCAT_PUBLIC_ORIGIN = "https://site.example";
  process.env.NEXT_SERVER_API_URL = "http://localhost:3005";
  const request = new NextRequest("https://site.example/api/auth/oidc/callback?state=abc&code=xyz", { headers: cfHeaders });
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("/auth/oidc/transactions/consume")) return Response.json({ state: "s", nonce: "n", verifier: "v", return_path: "/" });
    if (u.includes("/protocol/openid-connect/token")) return Response.json({ access_token: "a", id_token: "i", refresh_token: "r" });
    if (u.includes("/auth/oidc/exchange")) {
      exchangeInit = init;
      return Response.json({ token: "session-token", expires_at: new Date(Date.now() + 3_600_000).toISOString() });
    }
    throw new Error(`unexpected fetch ${u}`);
  };
  const response = await route.GET(request);
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  return { response, bffCalls, exchangeInit };
}

test("callback forwards cf-connecting-ip and cf-ray to the backend exchange when present", async () => {
  const { response, bffCalls, exchangeInit } = await runCallback({ cfHeaders: { "cf-connecting-ip": "203.0.113.7", "cf-ray": "abc123" } });
  assert.equal(response.status, 307);
  // The exchange is the second BFF call (consume first, exchange second).
  assert.equal(bffCalls.length, 2);
  assert.deepEqual(bffCalls[1], { "cf-connecting-ip": "203.0.113.7", "cf-ray": "abc123" });
  assert.equal(exchangeInit.headers["cf-connecting-ip"], "203.0.113.7");
  assert.equal(exchangeInit.headers["cf-ray"], "abc123");
  assert.equal(exchangeInit.headers.authorization, "Bearer test-service");
});

test("callback omits the CF headers (no error) when they are absent", async () => {
  const { response, bffCalls, exchangeInit } = await runCallback({});
  assert.equal(response.status, 307);
  assert.equal(bffCalls.length, 2);
  assert.deepEqual(bffCalls[1], {});
  assert.equal(exchangeInit.headers["cf-connecting-ip"], undefined);
  assert.equal(exchangeInit.headers["cf-ray"], undefined);
  assert.equal(exchangeInit.headers.authorization, "Bearer test-service");
});

test("BFF service passes the CF headers through to the returned headers", async () => {
  const source = ts.createSourceFile("bff.ts", readFileSync(new URL("./oidc-bff-service.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
  const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "oidcBffServiceHeaders");
  assert.ok(fn, "oidcBffServiceHeaders is declared in the BFF service");
  const code = ts.transpileModule(fn.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const oidcBffServiceHeaders = new Function("serviceToken", "exports", `${code}; return oidcBffServiceHeaders;`)(async () => "test-service-token", {});

  const withBoth = await oidcBffServiceHeaders({ "cf-connecting-ip": "203.0.113.7", "cf-ray": "ray-1" });
  assert.equal(withBoth.authorization, "Bearer test-service-token");
  assert.equal(withBoth["cf-connecting-ip"], "203.0.113.7");
  assert.equal(withBoth["cf-ray"], "ray-1");

  const noHeaders = await oidcBffServiceHeaders();
  assert.equal(noHeaders.authorization, "Bearer test-service-token");
  assert.equal(noHeaders["cf-connecting-ip"], undefined);
  assert.equal(noHeaders["cf-ray"], undefined);

  const partial = await oidcBffServiceHeaders({ "cf-connecting-ip": "203.0.113.7" });
  assert.equal(partial["cf-connecting-ip"], "203.0.113.7");
  assert.equal(partial["cf-ray"], undefined);
});
