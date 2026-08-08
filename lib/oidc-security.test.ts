import test from "node:test";
import assert from "node:assert/strict";
import { createTransaction, getJwkForTest, requireSameOrigin, resetJwksCacheForTest, safeReturnPath, stateMatches } from "./oidc-security.ts";
import { csrfHeader } from "./csrf.ts";
import { readFileSync } from "node:fs";

test("rejects open redirects", () => {
  for (const path of ["https://evil.example", "//evil.example", "/%5c%5cevil.example", "/admin", "/auth/login"]) assert.equal(safeReturnPath(path), "/");
  assert.equal(safeReturnPath("/players/42?tab=builds"), "/players/42?tab=builds");
});
test("state transaction binds callback and rejects replay after cookie clear", () => {
  const transaction = createTransaction("/account");
  assert.equal(stateMatches(transaction.state, transaction.state), true);
  assert.equal(stateMatches(transaction.state, "replayed-or-wrong-state"), false);
  assert.equal(stateMatches(undefined, transaction.state), false);
});
test("unsafe requests require exact origin", () => {
  assert.equal(requireSameOrigin("https://paladinscat.com", "https://paladinscat.com"), true);
  assert.equal(requireSameOrigin("https://evil.example", "https://paladinscat.com"), false);
  assert.equal(requireSameOrigin(null, "https://paladinscat.com"), false);
});
test("JWKS outage and oversized documents fail closed", async () => {
  resetJwksCacheForTest();
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("offline", { status: 503 });
  assert.equal(await getJwkForTest("https://auth.example", "one"), null);
  globalThis.fetch = async () => new Response("x", { headers: { "content-length": "999999" } });
  assert.equal(await getJwkForTest("https://auth.example", "one"), null);
  globalThis.fetch = original;
});
test("unknown kid forces only one bounded refresh", async () => {
  resetJwksCacheForTest();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ keys: [{ kid: "known", kty: "RSA", use: "sig" }] })); };
  assert.ok(await getJwkForTest("https://auth.example", "known"));
  for (let i = 0; i < 20; i++) assert.equal(await getJwkForTest("https://auth.example", `unknown-${i}`), null);
  assert.equal(calls, 2);
  globalThis.fetch = original;
});
test("cookie-auth CSRF header is required only for unsafe requests", () => {
  assert.equal(csrfHeader("__Host-pc_csrf=csrf-value", "POST"), "csrf-value");
  assert.equal(csrfHeader("other=value", "POST"), null);
  assert.equal(csrfHeader("__Host-pc_csrf=csrf-value", "GET"), null);
});
test("BFF credential is server-only and never a public environment value", () => {
  const source = readFileSync(new URL("./oidc-bff-service.ts", import.meta.url), "utf8");
  assert.match(source, /import "server-only"/);
  assert.match(source, /PALADINSCAT_OIDC_BFF_SERVICE_TOKEN_FILE/);
  assert.doesNotMatch(source, /NEXT_PUBLIC/);
});
