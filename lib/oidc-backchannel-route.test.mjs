import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function fixture() {
  const calls = [];
  let valid = true, available = true;
  const dependencies = {
    "next/server": { NextResponse: Response },
    "@/lib/operator-plane": { assertOperatorConfiguration() {} },
    "@/lib/oidc-security": {
      normalizedHttpsIssuer: () => "https://auth.example/realms/test",
      resolveInternalIssuer: issuer => issuer,
      validateLogoutToken: async token => { calls.push(["validate", token]); return valid ? { sid: "signed-session" } : null; },
    },
    "@/lib/oidc-bff-service": { oidcBffServiceHeaders: async () => ({ authorization: "Bearer scoped-fixture" }) },
    "@/lib/operator-transport.mjs": {
      operatorBackendFetch: async (url, init) => { calls.push(["revoke", url, init]); return new Response(null, { status: available ? 204 : 503 }); },
    },
  };
  const code = ts.transpileModule(readFileSync(new URL("../app/api/auth/oidc/backchannel-logout/route.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `unexpected dependency ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  return { ...loaded.exports, calls, invalid: () => { valid = false; }, unavailable: () => { available = false; } };
}

const request = (body, headers = {}) => new Request("https://operator.example/api/auth/oidc/backchannel-logout", {
  method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...headers }, body,
  ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
});

test("backchannel bounds encoded bytes before parsing and rejects ambiguous tokens before verification", async () => {
  const saved = process.env.OIDC_CLIENT_ID;
  process.env.OIDC_CLIENT_ID = "paladinscat-operator";
  try {
    const route = fixture();
    for (const [body, headers, status] of [
      ["logout_token=x", { "content-type": "multipart/form-data; boundary=x" }, 415],
      ["logout_token=x", { "content-length": "65537" }, 413],
      ["logout_token=x", { "content-length": "-1" }, 400],
      ["logout_token=x&logout_token=y", {}, 400],
      ["logout_token=", {}, 400],
      [`logout_token=${"a".repeat(16_385)}`, {}, 400],
      ["logout_token=" + "%61".repeat(22_000), {}, 413],
      [new Uint8Array([255]), {}, 400],
    ]) assert.equal((await route.POST(request(body, headers))).status, status);
    let cancelled = false;
    const stream = new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(40_000)); },
      cancel() { cancelled = true; },
    });
    assert.equal((await route.POST(request(stream))).status, 413);
    assert.equal(cancelled, true);
    assert.deepEqual(route.calls, []);
  } finally { if (saved === undefined) delete process.env.OIDC_CLIENT_ID; else process.env.OIDC_CLIENT_ID = saved; }
});

test("backchannel only forwards verified revocation, with a bounded backend deadline and opaque failures", async () => {
  const keys = ["OIDC_CLIENT_ID", "NEXT_SERVER_API_URL"];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { OIDC_CLIENT_ID: "paladinscat-operator", NEXT_SERVER_API_URL: "https://backend-rust-operator:3006/v1" });
  try {
    const route = fixture();
    assert.equal((await route.POST(request("logout_token=fixture.signed.token", { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" }))).status, 204);
    const [, url, init] = route.calls.find(call => call[0] === "revoke");
    assert.equal(url, "https://backend-rust-operator:3006/v1/auth/oidc/backchannel-logout");
    assert.equal(init.body.toString(), "logout_token=fixture.signed.token");
    assert.ok(init.signal instanceof AbortSignal);
    route.calls.length = 0; route.invalid();
    assert.equal((await route.POST(request("logout_token=untrusted"))).status, 401);
    assert.equal(route.calls.filter(call => call[0] === "revoke").length, 0);
    const unavailable = fixture(); unavailable.unavailable();
    assert.equal((await unavailable.POST(request("logout_token=fixture.signed.token"))).status, 502);
  } finally { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
