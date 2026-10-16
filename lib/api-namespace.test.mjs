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
    if (name.endsWith("server-api")) return { serverApiBase: () => "https://backend.example" };
    if (name.startsWith("./lib/")) return load(`${name.replace("./lib/", "./")}.ts`);
    return require(name);
  }, loaded, loaded.exports);
  return loaded.exports;
}
const { proxy } = load("../proxy.ts");
const { NextRequest } = require("next/server");

test("case and encoded API namespaces cannot reach case-insensitive fallback rewrites", async () => {
  const oldEnv = process.env.NODE_ENV;
  const oldFetch = globalThis.fetch;
  process.env.NODE_ENV = "production";
  // Exercise the public proxy directly with a synthetic admitted account.
  globalThis.fetch = async () => Response.json({ linked_player_id: "42", invitation_active: true, regulation_stage: 0 });
  try {
    for (const namespace of ["API", "Api", "aPi", "_PC", "_Pc", "%61pi", "%41PI", "%5fPC", "api%2f"]) {
      for (const operation of ["cheaters/active", "cheaters/inactive", "auth/me"]) {
        const request = new NextRequest(`https://paladinscat.com/${namespace}/${operation}`, {
          headers: { accept: "application/json", cookie: "__Host-pc_session=fixture-pro-session" },
        });
        const response = await proxy(request);
        assert.equal(response.status, 400, request.url);
        assert.equal((await response.json()).error.code, "NON_CANONICAL_API_PATH");
        assert.equal(response.headers.get("x-middleware-next"), null);
      }
    }
    for (const feed of ["active", "inactive"]) {
      const blocked = await proxy(new NextRequest("https://paladinscat.com/api/cheaters/" + feed, {
        headers: { accept: "application/json", cookie: "__Host-pc_session=fixture-public-session" },
      }));
      assert.equal(blocked.status, 404, "Canonical public moderation feeds remain unavailable");
    }
    // Bootstrap and scoped machine APIs retain their canonical route behavior.
    for (const path of ["/api/auth/oidc/callback", "/api/v1/health"]) {
      const response = await proxy(new NextRequest(`https://paladinscat.com${path}`, {
        headers: { accept: "application/json", cookie: "__Host-pc_session=fixture-pro-session" },
      }));
      assert.equal(response.headers.get("x-middleware-next"), "1", path);
    }
  } finally {
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
    globalThis.fetch = oldFetch;
  }
});
