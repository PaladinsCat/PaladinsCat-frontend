/** Verify champion matchup requests use the ranked rolling-window contract.
 * refs: see: lib/champion-matchups-api.ts · GET /stats/champions/{champion_id}/matchups
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = ts.createSourceFile(
  "champion-matchups-api.ts",
  readFileSync(new URL("./champion-matchups-api.ts", import.meta.url), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const declaration = source.statements.find(
  node => ts.isFunctionDeclaration(node) && node.name?.text === "fetchChampionTalentMatchups",
);
assert.ok(declaration);
const windowConstant = source.statements.find(
  node => ts.isVariableStatement(node)
    && node.declarationList.declarations.some(
      item => ts.isIdentifier(item.name) && item.name.text === "RANKED_MATCHUP_WINDOW_DAYS",
    ),
);
assert.ok(windowConstant);
const compiled = ts.transpileModule(`${windowConstant.getText(source)}\n${declaration.getText(source)}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

test("champion matchup page requests 30 ranked days and preserves encounter totals", async () => {
  let requestPath = "";
  const api: {
    fetchChampionTalentMatchups?: (championId: number, talentId: number, signal: AbortSignal) => Promise<{
      talents: Array<{ talentId: number; talentName: string }>;
      rows: Array<{ wins: number; losses: number; encounters: number }>;
    }>;
  } = {};
  new Function("exports", "fetchJson", compiled)(api, async (path: string) => {
    requestPath = path;
    return {
      talents: [{ talent_id: 22813, talent_name: "Shock and Awe" }],
      rows: [{
        champion_talent_id: 22813,
        opponent_champion_id: 2205,
        opponent_champion_name: "Ash",
        opponent_talent_id: 22053,
        opponent_talent_name: "Tempered",
        wins: "7",
        losses: "3",
        samples: "10",
        coverage_from: "2026-08-31",
        coverage_to: "2026-09-29",
      }],
    };
  });

  const result = await api.fetchChampionTalentMatchups!(2281, 0, new AbortController().signal);
  const request = new URL(requestPath, "https://paladinscat.com");
  assert.equal(request.pathname, "/stats/champions/2281/matchups");
  assert.equal(request.searchParams.get("queueId"), "486");
  assert.equal(request.searchParams.get("days"), "30");
  assert.equal(result.rows[0].wins, 7);
  assert.equal(result.rows[0].losses, 3);
  assert.equal(result.rows[0].encounters, 10);
});
