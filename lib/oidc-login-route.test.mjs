import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { NextRequest } = require("next/server");

test("service-token deadline covers a stalled response body", async () => {
  const source = ts.createSourceFile("service.ts", readFileSync(new URL("./oidc-bff-service.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
  const functions = source.statements.filter(node => ts.isFunctionDeclaration(node) && ["fetchToken", "boundedJson"].includes(node.name?.text));
  assert.equal(functions.length, 2);
  const code = ts.transpileModule(functions.map(node => node.getText(source)).join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const fetchToken = new Function("required", "validateEndpoints", "clientAssertion", "fetch", "AbortSignal", `let cached; ${code}; return fetchToken;`)(
    () => "test", () => {}, () => "test-assertion",
    async (_url, init) => new Response(new ReadableStream({ start(controller) {
      init.signal.addEventListener("abort", () => controller.error(init.signal.reason), { once: true });
    } })),
    { timeout: milliseconds => { assert.equal(milliseconds, 10_000); return AbortSignal.timeout(15); } },
  );
  const keepAlive = setTimeout(() => {}, 1000);
  try { await assert.rejects(fetchToken(), { name: "TimeoutError" }); }
  finally { clearTimeout(keepAlive); }
});

function load(path, dependencies = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", code)(name => dependencies[name] ?? require(name), loaded, loaded.exports);
  return loaded.exports;
}

test("login start handles upstream failures and permits a later successful retry", async () => {
  const originalFetch = globalThis.fetch;
  const envKeys = ["OIDC_ISSUER", "OIDC_CLIENT_ID", "OIDC_INTERNAL_ISSUER", "PALADINSCAT_PUBLIC_ORIGIN"];
  const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  try {
    process.env.OIDC_ISSUER = "https://auth.example/realms/test";
    process.env.OIDC_CLIENT_ID = "test-web";
    delete process.env.OIDC_INTERNAL_ISSUER;
    process.env.PALADINSCAT_PUBLIC_ORIGIN = "https://site.example";
    let failToken = true;
    const route = load("../app/api/auth/oidc/login/route.ts", {
      "@/lib/oidc-security": load("./oidc-security.ts"),
      "@/lib/oidc-client-secret": { oidcClientSecret: () => "test-secret" },
      "@/lib/oidc-bff-service": { oidcBffServiceHeaders: async () => {
        if (failToken) throw new DOMException("private upstream detail", "AbortError");
        return { authorization: "Bearer test-service" };
      } },
    });
    const request = () => new NextRequest("https://site.example/api/auth/oidc/login?return=%2Faccount");
    async function unavailable(response) {
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("retry-after"), "5");
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("location"), null);
      assert.doesNotMatch(await response.text(), /private upstream|test-secret/);
    }
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error("unexpected fetch"); };
    await unavailable(await route.GET(request()));
    assert.equal(calls, 0, "no transaction or PAR before service authentication");
    failToken = false;
    globalThis.fetch = async (_url, init) => {
      calls++;
      assert.ok(init.signal, "transaction request has a deadline");
      throw new DOMException("private upstream detail", "TimeoutError");
    };
    await unavailable(await route.GET(request()));
    assert.equal(calls, 1, "failed transaction must not submit PAR or retry mutations");
    globalThis.fetch = async () => new Response(null, { status: 503 });
    await unavailable(await route.GET(request()));
    globalThis.fetch = async (url) => String(url).endsWith("/transactions")
      ? new Response(null, { status: 201 }) : new Response(null, { status: 503 });
    await unavailable(await route.GET(request()));
    globalThis.fetch = async (url) => String(url).endsWith("/transactions")
      ? new Response(null, { status: 201 })
      : Response.json({ request_uri: "urn:ietf:params:oauth:request_uri:test", expires_in: 60 }, { status: 201 });
    const success = await route.GET(request());
    assert.equal(success.status, 303);
    for (const attribute of [/__Host-pc_oidc_txn=/, /; HttpOnly/i, /; Secure/i, /; SameSite=lax/i]) {
      assert.match(success.headers.get("set-cookie"), attribute);
    }
    assert.equal(new URL(success.headers.get("location")).hostname, "auth.example");
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
