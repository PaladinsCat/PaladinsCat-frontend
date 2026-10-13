/** Exercise actual browser acquisition callbacks before state reaches rendering. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(process.env.PLAYER_PROFILE_SOURCE_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const installed = createRequire(path.join(process.env.PLAYER_PROFILE_DEPENDENCY_ROOT || process.cwd(), "package.json"));
const ts = installed("typescript");
const React = installed("react");
const read = file => process.env.PLAYER_PROFILE_SOURCE_REVISION
  ? execFileSync("git", ["-C", root, "show", `${process.env.PLAYER_PROFILE_SOURCE_REVISION}:${file}`], { encoding: "utf8", timeout: 10_000 })
  : readFileSync(path.join(root, file), "utf8");
const harnessPath = "scripts/player-profile-render.test.mjs";
// Reuse the actual render harness loader without registering its tests twice.
const preamble = read(harnessPath).split("const load = createLoader();")[0]
  .replaceAll("import.meta.url", JSON.stringify(pathToFileURL(path.join(root, harnessPath)).href));
assert.ok(preamble.includes("export function createLoader"));
const loaderModule = { exports: {} };
new Function("require", "module", "exports", ts.transpileModule(preamble, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText)(installed, loaderModule, loaderModule.exports);
const { createLoader } = loaderModule.exports;
const stateNames = [...read("app/players/[id]/player-profile-client.tsx")
  .matchAll(/const \[(\w+),\s*\w+\]\s*=\s*useState/g)].map(match => match[1]);
const profile = () => ({ player: { id: "16706730", name: "Normal acquisition player" }, access: { fullAccess: true } });

function client(initialResponse, raw) {
  const values = [], effects = [], callbacks = [], calls = [];
  const hooks = { ...React,
    useState(initial) {
      const index = values.length;
      values.push(typeof initial === "function" ? initial() : initial);
      return [values[index], next => { values[index] = typeof next === "function" ? next(values[index]) : next; }];
    },
    useEffect(fn) { effects.push(fn); },
    useCallback(fn) { callbacks.push(fn); return fn; },
    useRef(value) { return { current: value }; },
  };
  const load = createLoader({ react: hooks });
  const component = load("app/players/[id]/player-profile-client.tsx").default;
  const previous = { fetch: globalThis.fetch, document: globalThis.document };
  globalThis.document = { cookie: "" };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, headers: new Headers(), json: async () => raw, text: async () => JSON.stringify(raw) };
  };
  component({ id: "16706730", initialResponse });
  return {
    get: name => values[stateNames.indexOf(name)],
    calls,
    async browserGet() {
      const effect = effects.find(fn => fn.toString().includes("encodeURIComponent(id)") && fn.toString().includes("fetchKey"));
      assert.ok(effect, "the actual browser profile effect executes");
      effect();
      for (let turn = 0; turn < 8; turn++) await new Promise(resolve => setImmediate(resolve));
    },
    async action(fragment) {
      const callback = callbacks.find(fn => fn.toString().includes(fragment));
      assert.ok(callback, `the actual ${fragment} callback executes`);
      await callback();
    },
    restore() { globalThis.fetch = previous.fetch; globalThis.document = previous.document; },
  };
}
async function withClient(initial, raw, body) {
  const harness = client(initial, raw);
  try { await body(harness); } finally { harness.restore(); }
}

test("profile-acquire browser normal optional data", async () => {
  await withClient(null, { ...profile(), queueRatings: null, championRatings: null }, async state => {
    await state.browserGet();
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0].url, "/api/players/16706730");
    assert.deepEqual(state.get("response").queueRatings, []);
    assert.equal(state.get("error"), null);
  });
});
test("profile-acquire browser malformed successful data", async () => {
  for (const raw of [{ player: null }, { ...profile(), queueRatings: "invalid" }, { ...profile(), presence: { status: 2, status_string: {} } }]) {
    await withClient(null, raw, async state => {
      await state.browserGet(); assert.equal(state.get("response"), null);
      assert.ok(state.get("error")); assert.equal(state.get("profileLoading"), false);
    });
  }
});
test("profile-acquire refresh valid partial data", async () => {
  await withClient(profile(), { presence: { status: 2, status_string: "In match" }, message: "Refreshed" }, async state => {
    await state.action("/refresh");
    assert.equal(state.get("response").presence.status_string, "In match");
    assert.equal(state.get("refreshFeedback").kind, "success");
  });
});
test("profile-acquire refresh malformed partial preserves profile", async () => {
  for (const raw of [null, { message: {} }, { presence: { status: 2, status_string: {} } }, { refreshQuota: "invalid" }, { historyRefresh: { error: {} } }]) {
    await withClient(profile(), raw, async state => {
      const before = state.get("response"); await state.action("/refresh");
      assert.equal(state.get("response"), before);
      assert.equal(state.get("refreshFeedback").kind, "error");
      assert.equal(typeof state.get("refreshFeedback").message, "string");
    });
  }
});
test("profile-acquire live match unavailable and pending", async () => {
  for (const raw of [{ match: null }, { pending: true }, { error: "Unavailable" }]) {
    await withClient(profile(), raw, async state => {
      await state.action("/live/players/");
      assert.equal(state.get("currentMatch").match, null);
      assert.equal(state.get("currentMatch").pending, raw.pending);
      assert.equal(state.get("currentMatch").error, raw.error);
    });
  }
});
test("profile-acquire live match populated roster", async () => {
  await withClient(profile(), { match: { match_id: "1281147898", status: "active", map: "Stone Keep" },
    players: [{ player_id: "16706730", task_force: 1, player_name: "Normal acquisition player" }] }, async state => {
    await state.action("/live/players/");
    assert.equal(state.get("currentMatch").match.match_id, "1281147898");
    assert.equal(state.get("currentMatch").players[0].player_name, "Normal acquisition player");
  });
});
test("profile-acquire live match malformed data controlled", async () => {
  for (const raw of [null, { error: {} }, { pending: {} }, { match: "invalid" },
    { match: { match_id: "1281147898" }, players: "invalid" },
    { match: { match_id: "1281147898" }, players: [null] }]) {
    await withClient(profile(), raw, async state => {
      await state.action("/live/players/");
      assert.equal(typeof state.get("currentMatch").error, "string");
      assert.ok(state.get("currentMatch").error);
      assert.equal(state.get("currentMatch").match, undefined);
    });
  }
});
