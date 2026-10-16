import test from "node:test";
import assert from "node:assert/strict";
import { accountSessionCookie, assertOperatorConfiguration, freshOperatorClaims, isOperatorBff, oidcTransactionCookie, operatorApiSuffix, operatorPathAllowed } from "./operator-plane.ts";
import { operatorBackendFetch } from "./operator-transport.mjs";

const materialKeys = ["PALADINSCAT_OPERATOR_API_CA_FILE", "PALADINSCAT_OPERATOR_API_CERT_FILE", "PALADINSCAT_OPERATOR_API_KEY_FILE"];
const keys = ["PALADINSCAT_OPERATOR_BFF", "PALADINSCAT_OPERATOR_ORIGIN", "PALADINSCAT_PUBLIC_ORIGIN", "OIDC_CLIENT_ID", "PALADINSCAT_SERVICE_OIDC_CLIENT_ID", "NEXT_SERVER_API_URL", "PALADINSCAT_OPERATOR_REQUIRED_ACR", ...materialKeys];
function fixture(run) {
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  for (const key of materialKeys) delete process.env[key];
  Object.assign(process.env, {
    PALADINSCAT_OPERATOR_BFF: "1", PALADINSCAT_OPERATOR_ORIGIN: "https://operator.example:8444",
    PALADINSCAT_PUBLIC_ORIGIN: "https://operator.example:8444", OIDC_CLIENT_ID: "paladinscat-operator",
    PALADINSCAT_SERVICE_OIDC_CLIENT_ID: "paladinscat-operator-bff", NEXT_SERVER_API_URL: "https://backend-rust-operator:3006/v1",
    PALADINSCAT_OPERATOR_REQUIRED_ACR: "2",
  });
  return Promise.resolve().then(run).finally(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
}

test("operator mode isolates host cookies and requires explicit valid configuration", () => fixture(() => {
  assert.doesNotThrow(assertOperatorConfiguration);
  assert.equal(accountSessionCookie(), "__Host-pc_admin_session");
  assert.equal(oidcTransactionCookie(), "__Host-pc_admin_oidc_txn");
  delete process.env.PALADINSCAT_OPERATOR_BFF;
  assert.equal(isOperatorBff(), false);
  assert.equal(accountSessionCookie(), "__Host-pc_session");
  assert.equal(oidcTransactionCookie(), "__Host-pc_oidc_txn");
  process.env.PALADINSCAT_OPERATOR_BFF = "yes";
  assert.throws(isOperatorBff);
}));

test("operator mode refuses public clients, plaintext, foreign origins and the public API port", () => fixture(() => {
  for (const [key, value] of [
    ["OIDC_CLIENT_ID", "paladinscat-web"], ["PALADINSCAT_SERVICE_OIDC_CLIENT_ID", "paladinscat-frontend-service"],
    ["PALADINSCAT_PUBLIC_ORIGIN", "https://public.example"], ["PALADINSCAT_OPERATOR_ORIGIN", "http://operator.example"],
    ["NEXT_SERVER_API_URL", "https://backend-rust-operator:3005/v1"], ["NEXT_SERVER_API_URL", "http://backend-rust-operator:3006/v1"],
    ["NEXT_SERVER_API_URL", "https://foreign.example:3006/v1"], ["NEXT_SERVER_API_URL", "https://user:secret@backend-rust-operator:3006/v1"],
  ]) {
    const previous = process.env[key]; process.env[key] = value;
    assert.throws(assertOperatorConfiguration, undefined, key);
    process.env[key] = previous;
  }
}));

test("private route inventory excludes normal public data, encoded aliases and dot segments", () => {
  for (const path of ["/admin", "/admin/invitations", "/api/admin/accounts", "/_pc/admin/email", "/api/auth/me", "/api/auth/oidc/callback"]) assert.equal(operatorPathAllowed(path), true, path);
  for (const path of ["/api/v1/admin", "/api/operator/audit/export", "/api/operator/audit/ack", "/api/players/42", "/community", "/admin/../players", "/admin//accounts", "/api/%61dmin", "/admin\\accounts"]) assert.equal(operatorPathAllowed(path), false, path);
});

test("signed operator claims require exact assurance and recent numeric authentication time", () => fixture(() => {
  const now = 2_000_000_000_000, seconds = now / 1000;
  assert.equal(freshOperatorClaims({ acr: "2", auth_time: seconds }, now), true);
  for (const claims of [{}, { acr: "1", auth_time: seconds }, { acr: "2", auth_time: String(seconds) }, { acr: "2", auth_time: seconds - 301 }, { acr: "2", auth_time: seconds + 31 }, { acr: "2", auth_time: NaN }]) assert.equal(freshOperatorClaims(claims, now), false);
}));

test("moderation aliases admit only reviewed numeric paths and methods", () => {
  for (const [method, suffix] of [["POST", "/players/42/clear-tag"], ["POST", "/players/42/report"], ["GET", "/cheaters/evidence/review"], ["HEAD", "/cheaters/evidence/21/media/0"], ["POST", "/cheaters/evidence/21/review"], ["GET", "/cheaters/evidence/21/file"], ["PUT", "/community/posts/42"], ["DELETE", "/community/comments/42"], ["DELETE", "/community/chat/42"], ["PUT", "/tierlists/42"]]) {
    for (const prefix of ["/api", "/_pc"]) {
      assert.equal(operatorApiSuffix(prefix + suffix, method), suffix);
      assert.equal(operatorPathAllowed(prefix + suffix, method), true);
    }
  }
  for (const [method, path] of [["GET", "/api/players/42/report"], ["POST", "/api/players/42/custom-tag"], ["GET", "/api/cheaters/evidence/21"], ["POST", "/api/cheaters/evidence/21/file"], ["DELETE", "/api/tierlists/42"], ["PUT", "/api/community/posts/not-a-number"], ["GET", "/api/community/posts/42"], ["POST", "/api/operator/audit/ack"]]) assert.equal(operatorApiSuffix(path, method), null);
});

test("operator client material is never sent to foreign, plaintext or redirect-selected destinations", () => fixture(async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(); };
  try {
    for (const url of ["https://foreign.example/v1/admin", "http://backend-rust-operator:3006/v1/admin", "https://backend-rust-operator:3005/v1/admin", "https://user:secret@backend-rust-operator:3006/v1/admin"]) await assert.rejects(operatorBackendFetch(url));
    assert.equal(calls, 0);
    // Missing private material fails closed before the same-origin network request.
    await assert.rejects(operatorBackendFetch("https://backend-rust-operator:3006/v1/admin"));
    assert.equal(calls, 0);
    delete process.env.PALADINSCAT_OPERATOR_BFF;
    await operatorBackendFetch("https://public.example/read");
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
}));
