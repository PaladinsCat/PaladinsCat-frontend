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
