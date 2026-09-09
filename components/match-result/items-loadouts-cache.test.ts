/** Verify tier isolation in both in-memory and persisted item caches without network I/O.
 * refs: see: components/match-result/items-loadouts-section.tsx
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = ts.createSourceFile("items-loadouts-section.tsx", readFileSync(new URL("./items-loadouts-section.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

for (const detail of [false, true]) {
  test(`${detail ? "item detail" : "item summary"} isolates each tier bound across memory and browser caches`, async () => {
    const name = detail ? "getScopedItemDetail" : "getScopedItemMetrics";
    const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
    assert.ok(declaration);
    const code = ts.transpileModule(declaration.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
    const memory = new Map();
    const browser = new Map();
    let calls = 0;
    const fetch = (...args: unknown[]) => {
      calls++;
      return Promise.resolve([{ tier: args.at(-1) }]);
    };
    const load = new Function(
      detail ? "itemDetailByChampionScope" : "itemMetricsByChampionScope",
      detail ? "fetchItemDetail" : "fetchItems",
      "readBrowserResult", "writeBrowserResult", "RESULT_CACHE_PREFIX", "METRIC_CACHE_TTL_MS",
      `${code}; return ${name};`,
    )(memory, fetch, (key: string) => browser.get(key) ?? null, (key: string, value: unknown) => { browser.set(key, value); return value; }, "test", 1000);
    const prefix = detail ? [7, 1, "ranked"] : [1, "ranked"];
    const tiers = [[undefined, undefined], [1, 10], [2, 10], [1, 11]];
    const results = [];
    for (const tier of tiers) {
      const result = await load(...prefix, ...tier);
      results.push(result);
      assert.strictEqual(await load(...prefix, ...tier), result);
    }
    assert.equal(calls, tiers.length, "different bounds must fetch independently");
    assert.equal(browser.size, tiers.length, "persisted keys must include both bounds");
    memory.clear();
    for (const [index, tier] of tiers.entries()) {
      assert.strictEqual(await load(...prefix, ...tier), results[index]);
    }
    assert.equal(calls, tiers.length, "reload should reuse only the matching persisted result");
  });
}
