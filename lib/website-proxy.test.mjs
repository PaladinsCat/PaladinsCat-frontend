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
const { proxy } = load("../proxy.ts", { "./lib/website-gate": gate });
const { NextRequest } = require("next/server");

test("production proxy admits a page-issued guest, rejects direct API access, and leaves v1 authentication to Rust", () => {
  const directory = mkdtempSync(join(tmpdir(), "pc-gate-test-"));
  const old = { ...process.env };
  try {
    const file = join(directory, "fixture-secret");
    writeFileSync(file, "ab".repeat(32)); // Disposable fixture, never a runtime credential.
    process.env.NODE_ENV = "production";
    process.env.PALADINSCAT_WEBSITE_GATE_SECRET_FILE = file;
    process.env.PALADINSCAT_PUBLIC_ORIGIN = "https://paladinscat.com";
    const request = (path, headers = {}) => new NextRequest(`https://paladinscat.com${path}`, { headers });
    const page = proxy(request("/players/1", { accept: "text/html" }));
    const cookie = page.cookies.get(gate.GUEST_COOKIE);
    assert.ok(cookie?.value);
    assert.match(page.headers.get("set-cookie"), /HttpOnly/);
    assert.match(page.headers.get("set-cookie"), /Secure/);
    assert.equal(page.headers.get("cache-control"), "private, no-store");
    for (const path of ["/api/notifications?limit=8", "/api/matches/1", "/_pc/matches/1"]) {
      assert.equal(proxy(request(path)).status, 403);
      assert.equal(proxy(request(path, { cookie: `${gate.GUEST_COOKIE}=forged` })).status, 403);
      const headers = { cookie: `${gate.GUEST_COOKIE}=${cookie.value}`, "sec-fetch-site": "same-origin" };
      const admitted = proxy(request(path, headers));
      assert.equal(admitted.headers.get("x-middleware-next"), "1");
      assert.equal(admitted.headers.get("cache-control"), "private, no-store");
      assert.equal(proxy(request(path, { ...headers, origin: "http://127.0.0.1:3100" })).status, 403);
    }
    assert.equal(proxy(request("/api/v1/stats/champions")).headers.get("x-middleware-next"), "1");
    assert.equal(proxy(request("/api/auth/oidc/callback")).headers.get("x-middleware-next"), "1");
    assert.equal(proxy(request("/api/auth/oidc/transactions")).status, 403);
    assert.equal(proxy(request("/%61pi/notifications")).status, 400);
    process.env.PALADINSCAT_WEBSITE_GATE_SECRET_FILE = "";
    assert.equal(proxy(request("/api/notifications")).status, 503);
  } finally {
    for (const key of ["NODE_ENV", "PALADINSCAT_WEBSITE_GATE_SECRET_FILE", "PALADINSCAT_PUBLIC_ORIGIN"]) {
      if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key];
    }
    rmSync(directory, { recursive: true });
  }
});
