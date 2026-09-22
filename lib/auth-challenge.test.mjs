import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const output = ts.transpileModule(readFileSync(new URL("./api-client.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", output)((name) => {
  if (name === "./lobby-tier") return { withStoredLobbyTier: (path) => path };
  return {};
}, loaded, loaded.exports);
const { getMe, isAuthenticationRejection } = loaded.exports;

test("edge verification preserves auth while real session rejections still clear it", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [response, rejected] of [
      [new Response("<html>Verify</html>", { status: 403, headers: { "cf-mitigated": "challenge" } }), false],
      [new Response("<html>Verify</html>", { status: 200, headers: { "cf-mitigated": "challenge" } }), false],
      [Response.json({ error: { code: "WEBSITE_SESSION_REQUIRED" } }, { status: 403 }), false],
      [Response.json({ error: "Session expired" }, { status: 401 }), true],
      [Response.json({ error: "Access denied" }, { status: 403 }), true],
    ]) {
      let calls = 0;
      globalThis.fetch = async () => { calls++; return response; };
      await assert.rejects(getMe(), (error) => {
        assert.equal(isAuthenticationRejection(error), rejected);
        return true;
      });
      assert.equal(calls, 1, "interactive challenges must not be retried");
    }
    globalThis.fetch = async () => Response.json({ id: 42, username: "PersistentUser" });
    assert.equal((await getMe()).username, "PersistentUser", "normal refresh recovers after verification");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
