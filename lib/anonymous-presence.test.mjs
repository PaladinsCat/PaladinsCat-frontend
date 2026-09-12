import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";

function load(relative, dependencies = {}) {
  const output = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", output)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  }, loaded, loaded.exports);
  return loaded.exports;
}

const client = load("./anonymous-presence.ts");
const gate = load("./anonymous-presence-gate.ts");
const route = load("../app/api/analytics/presence/route.ts", {
  "@/lib/server-api": { serverApiBase: () => "http://backend.fixture" },
  "@/lib/anonymous-presence-gate": gate,
});

const request = (method = "GET", headers = {}, path = "/api/analytics/presence", body) => new Request(`https://paladinscat.com${path}`, {
  method, headers: { "sec-fetch-site": "same-origin", ...headers }, body,
});

test("rendered card distinguishes suppressed, warming, failure and coarse estimates", () => {
  const messages = JSON.parse(readFileSync(new URL("./localization/catalog/ui/navigation.json", import.meta.url), "utf8"));
  for (const [state, expected] of [
    [null, "Unavailable"],
    [{ status: "unavailable", estimated_active_pages: null }, "Unavailable"],
    [{ status: "warming_up", estimated_active_pages: null }, "Measuring first minute"],
    [{ status: "suppressed", estimated_active_pages: null }, "Small count hidden"],
    [{ status: "available", estimated_active_pages: 15 }, "About 15"],
  ]) {
    const { AnonymousPresenceCard } = load("../components/anonymous-presence-card.tsx", {
      "react": { useEffect: () => {}, useState: () => [state, () => {}] },
      "react/jsx-runtime": jsxRuntime,
      "@/lib/anonymous-presence": client,
      "@/lib/localization-context": { useLocalization: () => ({
        formatNumber: String, t: (key, values = {}) => messages[key].replace(/\{(\w+)\}/g, (_, name) => values[name]),
      }) },
    });
    const html = renderToStaticMarkup(AnonymousPresenceCard());
    assert.ok(html.includes(expected));
    assert.ok(html.includes("Consenting active pages"));
    assert.ok(html.includes("Not unique people"));
    assert.ok(!html.includes("undefined"));
  }
});

test("anonymous admission is exact and refuses identity, referrers, cross-site, query, and bodies", () => {
  assert.equal(gate.anonymousPresenceRequestAllowed(request(), "https://paladinscat.com"), true);
  for (const fixture of [
    request("POST", { cookie: "__Host-pc_session=fixture" }),
    request("POST", { authorization: "Bearer fixture" }),
    request("POST", { referer: "https://paladinscat.com/players/private" }),
    request("POST", { "sec-fetch-site": "cross-site" }),
    request("POST", { origin: "https://other.example" }),
    request("POST", { "content-length": "2" }),
    request("POST", { "transfer-encoding": "chunked" }),
    request("PUT"), request("GET", {}, "/api/analytics/presence?visitor=x"),
    request("POST", {}, "/api/analytics/heartbeat"),
  ]) assert.equal(gate.anonymousPresenceRequestAllowed(fixture, "https://paladinscat.com"), false);
});

test("aggregate read BFF forwards no caller metadata and exposes no public write", async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (init.method === "POST") return new Response(null, { status: 204, headers: { "set-cookie": "must-not-forward=1" } });
    return Response.json({ status: "suppressed", estimated_active_pages: null }, { headers: { "set-cookie": "must-not-forward=1" } });
  };
  try {
    const response = await route.GET(request("GET", {
      "user-agent": "private-browser", "cf-connecting-ip": "192.0.2.1",
      "x-forwarded-for": "192.0.2.1", "x-request-id": "private-request", "accept-language": "private-language",
    }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(calls[0].url, "http://backend.fixture/analytics/presence");
    assert.equal(calls[0].init.headers, undefined);
    assert.equal(calls[0].init.body, undefined);
    assert.equal(calls[0].init.credentials, "omit");
    assert.equal(calls[0].init.redirect, "error");
    assert.equal(calls[0].init.cache, "no-store");
    assert.equal(route.POST, undefined);
    assert.equal(calls.length, 1);
    assert.equal((await route.GET(request("POST", {}, undefined, "{}"))).status, 400);
    assert.equal(calls.length, 1);
    const read = await route.GET(request("GET"));
    assert.equal(read.headers.get("set-cookie"), null);
    assert.equal(read.headers.get("cache-control"), "no-store");
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await route.GET(request("GET"))).status, 503);
  } finally { globalThis.fetch = previousFetch; }
});

test("pulses have no payload, navigation identifiers, startup burst, hidden-tab sends, or retry", async () => {
  const descriptors = new Map(["navigator", "window", "document", "location", "fetch"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const calls = [], timers = new Map(), listeners = new Map();
  let nextTimer = 0;
  const doc = { visibilityState: "visible", addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const privacy = { doNotTrack: "0", globalPrivacyControl: false };
  const location = { pathname: "/players/private-player" };
  const install = (key, value) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  install("window", {
    setInterval: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    clearInterval: (id) => timers.delete(id), setTimeout: () => ++nextTimer, clearTimeout: () => {},
  });
  install("document", doc); install("navigator", privacy); install("location", location);
  install("fetch", async (url, init) => { calls.push({ url, init }); return new Response(null, { status: 204 }); });
  const tick = async () => { for (const timer of timers.values()) timer.fn(); await new Promise(setImmediate); };
  try {
    let consent = false;
    const stop = client.startAnonymousPresence((signal) => fetch("/api/auth/account/maintenance-presence", {
      method: "POST", signal,
    }), () => consent);
    assert.equal(calls.length, 0);
    assert.equal([...timers.values()][0].ms, 30_000);
    await tick();
    assert.equal(calls.length, 0, "no collection before consent");
    consent = true;
    await tick();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/auth/account/maintenance-presence");
    for (const key of ["headers", "body", "keepalive"]) assert.equal(calls[0].init[key], undefined);
    doc.visibilityState = "hidden"; await tick();
    doc.visibilityState = "visible";
    privacy.doNotTrack = "1"; await tick(); privacy.doNotTrack = "0";
    privacy.globalPrivacyControl = true; await tick(); privacy.globalPrivacyControl = false;
    for (const path of ["/auth/login", "/admin", "/%61dmin/users", "/settings", "/link-account"]) { location.pathname = path; await tick(); }
    assert.equal(calls.length, 1);
    location.pathname = "/champions"; await tick(); assert.equal(calls.length, 2);
    consent = false; await tick(); assert.equal(calls.length, 2, "withdrawal stops collection");
    stop(); assert.equal(timers.size, 0); assert.equal(listeners.size, 0);
    // Guard against future reintroduction of durable or temporary identifiers.
    const source = readFileSync(new URL("./anonymous-presence.ts", import.meta.url), "utf8");
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|randomUUID|document\.cookie|sendBeacon/);
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});

test("account consent contract requires current explicit acceptance and authenticated transport", async () => {
  const calls = [];
  const api = load("./maintenance-consent.ts", { "@/lib/api-client": {
    accountAuthHeaders: () => ({ Authorization: "Bearer fixture" }),
    fetchJson: async (path, options) => { calls.push({ path, options }); return {}; },
  } });
  for (const choice of [null, { decision: "unset" }, { decision: "declined" }, { decision: "accepted", policy_version: "old" }]) {
    assert.equal(api.consentAllowsPresence(choice), false);
  }
  assert.equal(api.consentAllowsPresence({ decision: "accepted", policy_version: api.MAINTENANCE_POLICY_VERSION }), true);
  await api.saveMaintenanceConsent(false, "account_settings");
  assert.deepEqual(JSON.parse(calls[0].options.body), { enabled: false, source: "account_settings", policy_version: api.MAINTENANCE_POLICY_VERSION });
  await api.sendMaintenancePresence(new AbortController().signal);
  assert.equal(calls[1].path, "/auth/account/maintenance-presence");
  assert.equal(calls[1].options.body, undefined);
  assert.equal(calls[1].options.referrerPolicy, "no-referrer");
  assert.equal(calls[1].options.headers.Authorization, "Bearer fixture");
  assert.equal(calls[1].options.retries, 0);
});

test("banner is only shown for undecided accounts and gives equal choices and privacy scope", () => {
  const messages = JSON.parse(readFileSync(new URL("./localization/catalog/ui/navigation.json", import.meta.url), "utf8"));
  let state = { ready: false, choice: null, saving: false, error: false, choose() {}, reload() {} };
  const ui = load("../components/maintenance-consent.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: (props) => jsxRuntime.jsx("a", props) },
    "lucide-react": { Clock3: () => null },
    "@/lib/maintenance-consent-context": { useMaintenanceConsent: () => state },
    "@/lib/localization-context": { useLocalization: () => ({ t: (key) => messages[key] }) },
  });
  assert.equal(renderToStaticMarkup(ui.MaintenanceConsentBanner()), "");
  for (const decision of ["accepted", "declined"]) {
    state = { ...state, ready: true, choice: { decision } };
    assert.equal(renderToStaticMarkup(ui.MaintenanceConsentBanner()), "");
  }
  state = { ...state, ready: true, choice: { decision: "unset" } };
  const html = renderToStaticMarkup(ui.MaintenanceConsentBanner());
  assert.ok(html.includes("Allow maintenance measurement"));
  assert.ok(html.includes("Decline maintenance measurement"));
  assert.ok(html.includes("/privacy#maintenance-presence"));
  assert.ok(html.includes("IP-based rate limiting"));
  const classes = [...html.matchAll(/<button[^>]*class="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(classes.length, 2); assert.equal(classes[0], classes[1]);
  state = { ...state, saving: true };
  assert.equal((renderToStaticMarkup(ui.MaintenanceConsentBanner()).match(/disabled=""/g) || []).length, 2);
});
