/** Verify shared fetch cancellation and deadlines without network requests.
 * refs: see: lib/api-client.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Compile the actual transport function in isolation; unrelated app imports need a Next runtime.
const source = ts.createSourceFile("api-client.ts",readFileSync(new URL("./api-client.ts",import.meta.url),"utf8"),ts.ScriptTarget.Latest,true);
const declaration = source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==="fetchJson");
assert.ok(declaration);
const compiled=ts.transpileModule(declaration.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported: { fetchJson?: (path:string,options?:RequestInit & {timeoutMs?:number;retries?:number})=>Promise<unknown> }={};
new Function("exports","API_BASE","FETCH_TIMEOUT_MS","csrfHeader","withStoredLobbyTier","API_ERROR_KEYS","ApiRequestError",compiled)(exported,"/api",10000,()=>null,(path:string)=>path,{genericFailure:"failed"},Error);
const fetchJson=exported.fetchJson!;

test("player chart series reuse a minute-bounded backend cache key", () => {
  const node = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "playerChartPath");
  assert.ok(node);
  const code = ts.transpileModule(node.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  let now = Date.parse("2026-09-12T18:30:01.123Z");
  class Clock extends Date {
    constructor(value: number = now) { super(value); }
  }
  const path = new Function("Date", `${code}; return playerChartPath;`)(Clock) as (id: string, days: number, limit: number) => string;
  const first = path("123", 30, 50);
  now += 20_000;
  assert.equal(path("123", 30, 50), first);
  assert.notEqual(path("456", 30, 50), first);
  assert.notEqual(path("123", 7, 50), first);
  now += 60_000;
  assert.notEqual(path("123", 30, 50), first);
  const query = new URL(first, "https://example.test").searchParams;
  assert.equal(Date.parse(query.get("to")!) - Date.parse(query.get("from")!), 30 * 86_400_000);
});

test("talent statistics preserve request failures instead of inventing zeros", async () => {
  const talent = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "fetchChampionTalentStats");
  assert.ok(talent);
  const code = ts.transpileModule(talent.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const api: { fetchChampionTalentStats?: (id: number) => Promise<unknown> } = {};
  const failure = new Error("upstream unavailable");
  new Function("exports", "fetchJson", "normalizeChampionTalentStatsResponse", code)(
    api, async () => { throw failure; }, () => { throw new Error("must not normalize failure"); },
  );
  await assert.rejects(api.fetchChampionTalentStats!(1), failure);
});

test("shared fetch propagates cancellation and bounds stalled response bodies", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (_url, options) => {
      calls++;
      return new Promise<Response>((_resolve,reject) => options?.signal?.addEventListener("abort",()=>reject(options.signal?.reason),{once:true}));
    };
    const caller = new AbortController();
    const pending = fetchJson("/players/1/friends", { signal:caller.signal, timeoutMs:5000 });
    caller.abort(new DOMException("Canceled", "AbortError"));
    await assert.rejects(pending,{name:"AbortError"});
    assert.equal(calls,1,"caller cancellation must not retry");
    await assert.rejects(fetchJson("/players/1/friends",{signal:caller.signal}),{name:"AbortError"});
    assert.equal(calls,1,"already canceled request must not fetch");
    await assert.rejects(fetchJson("/players/1/friends",{timeoutMs:10,retries:0}),{name:"AbortError"});
    globalThis.fetch = async (_url,options) => new Response(new ReadableStream({start(controller) {
      options?.signal?.addEventListener("abort",()=>controller.error(options.signal?.reason),{once:true});
    }}));
    await assert.rejects(fetchJson("/players/1/friends",{timeoutMs:10,retries:0}),{name:"AbortError"});
  } finally { globalThis.fetch=original; }
});
