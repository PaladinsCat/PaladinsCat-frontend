/** Exercise the actual browser-session profile loader and its JSON boundary. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(process.env.PLAYER_PROFILE_SOURCE_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const installed = createRequire(path.join(process.env.PLAYER_PROFILE_DEPENDENCY_ROOT || process.cwd(), "package.json"));
const ts = installed("typescript");
const read = file => process.env.PLAYER_PROFILE_SOURCE_REVISION
  ? execFileSync("git", ["-C", root, "show", `${process.env.PLAYER_PROFILE_SOURCE_REVISION}:${file}`], { encoding: "utf8", timeout: 10_000 })
  : readFileSync(path.join(root, file), "utf8");

function loadProfile(raw, requests = []) {
  const modules = new Map();
  const stubs = {
    "server-only": {},
    react: { cache: fn => fn },
    "@/lib/server-api": {
      fetchAccountServerJson: async (...args) => { requests.push(args); return raw; },
      fetchServerJson: () => { throw new Error("Browser profiles require the account-authenticated API helper"); },
    },
  };
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const loadedModule = { exports: {} };
    modules.set(file, loadedModule);
    const code = ts.transpileModule(read(file), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "module", "exports", code)(name => {
      if (name in stubs) return stubs[name];
      const resolved = name.startsWith("@/") ? name.slice(2)
        : name.startsWith(".") ? path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) : null;
      if (!resolved) throw new Error(`Unexpected profile loader dependency: ${name}`);
      return load(/\.tsx?$/.test(resolved) ? resolved : `${resolved}.ts`);
    }, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load("lib/player-profile-server.ts").getServerPlayerProfile;
}

test("profile SSR uses the browser account route and bounded timeout", async () => {
  const calls = [];
  const profile = await loadProfile({ player: { id: "16706730", name: "Normal profile" } }, calls)("16706730");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "/players/16706730");
  assert.equal(calls[0][1].timeoutMs, 65_000);
  assert.equal(profile.player.name, "Normal profile");
});

test("profile SSR normalizes omitted and null tier collections", async () => {
  for (const optional of [{}, { queueRatings: null, championRatings: null }]) {
    const profile = await loadProfile({ player: { id: "16706730", name: "Normal profile" }, ...optional })("16706730");
    assert.deepEqual(profile.queueRatings, []);
    assert.deepEqual(profile.championRatings, []);
  }
});

test("profile SSR rejects malformed successful API envelopes", async () => {
  for (const raw of [null, {}, { player: null }, { player: { id: "16706730", name: {} } },
    { player: { id: "16706730", name: "Normal profile" }, queueRatings: "missing" }]) {
    await assert.rejects(loadProfile(raw)("16706730"), /Invalid player profile response/);
  }
});

test("profile SSR rejects invalid IDs before any API request", async () => {
  const calls = [];
  await assert.rejects(loadProfile({}, calls)("1/refresh"), /Invalid public player ID/);
  assert.equal(calls.length, 0);
});
