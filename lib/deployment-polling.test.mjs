import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Exercise the real component effect with browser timers and network controlled.
function browserFixture() {
  const timers = new Map();
  const session = new Map();
  const document = new EventTarget();
  document.visibilityState = "visible";
  let effect;
  let nextPhase = "idle";
  let requests = 0;
  let reloads = 0;
  let sequence = 0;
  let pending;
  const window = {
    sessionStorage: {
      getItem: (key) => session.get(key) ?? null,
      setItem: (key, value) => session.set(key, value),
      removeItem: (key) => session.delete(key),
    },
    location: { href: "https://paladinscat.com/", origin: "https://paladinscat.com", reload: () => reloads++ },
    fetch: async (url, options) => {
      requests++;
      if (pending) return pending(options.signal);
      return Response.json({ id: "deployment-1", phase: nextPhase });
    },
  };
  const dependencies = {
    react: { useEffect: (callback) => { effect = callback; }, useState: () => [null, () => {}] },
    "react/jsx-runtime": {},
    "lucide-react": {},
    "@/lib/localization-context": { useLocalization: () => ({ t: (key) => key }) },
  };
  const source = readFileSync(new URL("../components/DeploymentUpdateBanner.tsx", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const loaded = { exports: {} };
  const setTimer = (callback, delay) => { const id = ++sequence; timers.set(id, { callback, delay }); return id; };
  new Function("require", "module", "exports", "window", "document", "setTimeout", "clearTimeout", output)(
    (name) => { assert.ok(name in dependencies, name); return dependencies[name]; },
    loaded, loaded.exports, window, document, setTimer, (id) => timers.delete(id),
  );
  loaded.exports.default();
  const flush = () => new Promise(setImmediate);
  return {
    start: () => effect(), flush,
    set phase(value) { nextPhase = value; },
    set pending(value) { pending = value; },
    get requests() { return requests; }, get reloads() { return reloads; },
    get delays() { return [...timers.values()].map((timer) => timer.delay); },
    async tick(delay) {
      const entry = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `No timer for ${delay}: ${JSON.stringify(this.delays)}`);
      timers.delete(entry[0]); entry[1].callback(); await flush();
    },
    async visibility(value) { document.visibilityState = value; document.dispatchEvent(new Event("visibilitychange")); await flush(); },
    window,
  };
}

test("idle polls every 30 seconds; hidden tabs stop and resume on visibility", async () => {
  const browser = browserFixture(); const stop = browser.start(); await browser.flush();
  assert.equal(browser.requests, 1); assert.deepEqual(browser.delays, [30_000]);
  await browser.tick(30_000); assert.equal(browser.requests, 2);
  await browser.visibility("hidden"); assert.deepEqual(browser.delays, []);
  await browser.visibility("visible"); assert.equal(browser.requests, 3);
  stop(); assert.deepEqual(browser.delays, []);
});

test("deployment polling accelerates, drains APIs, and reloads each tab once", async () => {
  for (let tab = 0; tab < 2; tab++) {
    const browser = browserFixture(); browser.phase = "announced";
    const stop = browser.start(); await browser.flush();
    assert.deepEqual(browser.delays, [3_000]);
    browser.phase = "draining"; await browser.tick(3_000);
    assert.equal((await browser.window.fetch("/api/matches/1")).status, 503);
    browser.phase = "complete"; await browser.tick(3_000);
    assert.equal(browser.reloads, 1);
    await browser.tick(30_000); assert.equal(browser.reloads, 1);
    stop();
  }
});

test("visibility events do not overlap requests; unmount aborts pending work", async () => {
  const browser = browserFixture(); let signal;
  browser.pending = (requestSignal) => new Promise((resolve, reject) => {
    signal = requestSignal;
    signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  });
  const stop = browser.start(); await browser.flush();
  await browser.visibility("hidden"); await browser.visibility("visible");
  assert.equal(browser.requests, 1);
  stop(); await browser.flush(); assert.equal(signal.aborted, true);
  assert.deepEqual(browser.delays, []);
});
