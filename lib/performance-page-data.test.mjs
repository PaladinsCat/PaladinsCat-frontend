import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Execute the production mapper and chart effect without a browser or backend.
const parse = path => ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const client = parse("./api-client.ts");
const names = new Set(["mapPerformancePageData", "mapMetricSummary", "mapChampionPerformanceRows", "mapStatsChampionRows", "numberOrNull", "toDisplayPercent", "isRecord", "unwrapPerformanceRecord", "isPerformanceSummary"]);
const mapperSource = client.statements.filter(node => ts.isFunctionDeclaration(node) && names.has(node.name?.text)
  || ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(client) === "PERFORMANCE_PAGE_METRICS"))
  .map(node => node.getText(client).replace(/^export /, "")).join("\n");
const mapPage = new Function(`${compile(mapperSource)}; return mapPerformancePageData;`)();
const fixture = parse("../test/stats-performance-page-data.spec.ts");
const fixtureSource = fixture.statements.filter(node => ts.isFunctionDeclaration(node)
  || ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(fixture) === "metrics"))
  .map(node => node.getText(fixture)).join("\n");
const pageData = new Function(`${compile(fixtureSource)}; return completePageData;`)();

test("cached bundle preserves class baselines independently of global averages", () => {
  const data = mapPage(pageData(), "ranked", "dpm", 486);
  assert.equal(data.comparison.global.dpm.mean, 12345);
  for (const role of ["Frontline", "Damage", "Flank", "Support"]) {
    assert.equal(data.comparison.classAverages[role].dpm.mean, 10000);
    assert.equal(data.comparison.classAverages[role].kda.sampleSize, 42);
  }
});

test("partial class baselines cannot masquerade as a complete bundle", () => {
  const missingRole = pageData();
  delete missingRole.classMetrics.Support;
  assert.throws(() => mapPage(missingRole, "ranked", "dpm", 486), /Incomplete Support/);
  const missingMetric = pageData();
  delete missingMetric.classMetrics.Damage.kda;
  assert.throws(() => mapPage(missingMetric, "ranked", "dpm", 486), /Incomplete Damage/);
});

test("hydrating the champion chart makes no additional metric requests", async () => {
  const component = parse("../components/champion-performance-comparison.tsx");
  let effect;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(component) === "useEffect") effect = node.arguments[0];
    ts.forEachChild(node, visit);
  }
  visit(component);
  let calls = 0;
  let hydrated;
  let failed = false;
  const fetchUnexpected = async () => { calls++; throw new Error("Unexpected chart request"); };
  const noop = () => {};
  const runEffect = new Function("initialData", "scope", "queueId", "CLASSES", "COLUMNS", "fetchStatsChampions", "fetchChampionPerformanceComparison", "fetchPerformanceMetrics", "setAverages", "setDetails", "setDistributions", "setClassAverages", "setFailed",
    `return ${compile(`(${effect.getText(component)})`)};`)(
    mapPage(pageData(), "ranked", "dpm", 486).comparison, "ranked", 486,
    ["Frontline", "Damage", "Flank", "Support"].map(value => ({ value })),
    ["winRate", "banRate", ...pageData().comparison.map(group => group.metric)],
    fetchUnexpected, fetchUnexpected, fetchUnexpected, noop, noop, noop,
    value => { hydrated = value; }, value => { failed = value; },
  );
  runEffect();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 0);
  assert.equal(failed, false);
  assert.equal(hydrated.Damage.dpm.mean, 10000);
});
