import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function transpile(path, jsx = false) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      ...(jsx ? { jsx: ts.JsxEmit.ReactJSX } : {}) },
  }).outputText;
}

const syncModule = { exports: {} };
new Function("module", "exports", transpile("./auth-session-sync.ts"))(syncModule, syncModule.exports);
const { shouldRevalidateStoredSession } = syncModule.exports;
const accessModule = { exports: {} };
new Function("module", "exports", transpile("./verified-access.ts"))(accessModule, accessModule.exports);
const { verifiedDestination } = accessModule.exports;
const providerSource = transpile("./auth-context.tsx", true);
const stableUser = {
  id: 42, username: "StableUser", email: null, avatarUrl: null, bio: null,
  isAdmin: false, isApproved: false, isProjectDeveloper: false, createdAt: "",
  lastLogin: null, timeZone: null, linkedPlayerId: null, linkedPlayerName: null,
  invitationActive: false, invitationRequired: false, invitationExpiresAt: null,
  accessRestriction: null,
};

class Events {
  listeners = new Map();
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  emit(name, event = {}) { for (const callback of this.listeners.get(name) ?? []) callback(event); }
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

// Execute real provider hooks with dependency-sensitive effects, isolated browser
// timers, and storage events delivered only to OTHER tabs when a value changes.
function fixture(t) {
  const world = {
    now: Date.parse("2026-10-11T12:00:00Z"), user: structuredClone(stableUser),
    storage: new Map(), events: [], tabs: [], timers: new Map(), timerSequence: 0,
    async flush() {
      for (let turn = 0; turn < 100; turn++) {
        await new Promise(setImmediate);
        const pending = this.events.splice(0);
        for (const [tab, event] of pending) tab.window.emit("storage", event);
        if (!pending.length && !this.events.length) {
          await new Promise(setImmediate);
          if (!this.events.length) return;
        }
      }
      assert.fail("Storage feedback did not settle after 100 turns");
    },
    broadcast(source, key, oldValue, newValue) {
      if (oldValue === newValue && key !== null) return;
      for (const tab of this.tabs) if (tab !== source) {
        this.events.push([tab, { key, oldValue, newValue, storageArea: tab.window.localStorage }]);
      }
    },
    external(key, newValue) {
      const oldValue = this.storage.get(key) ?? null;
      if (key === null) this.storage.clear();
      else if (newValue === null) this.storage.delete(key);
      else this.storage.set(key, newValue);
      this.broadcast(null, key, oldValue, newValue);
    },
    async advance(ms) {
      const target = this.now + ms;
      for (let fired = 0; fired < 100; fired++) {
        const next = [...this.timers].filter(([, timer]) => timer.due <= target)
          .sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) { this.now = target; await this.flush(); return; }
        this.now = next[1].due; this.timers.delete(next[0]); next[1].callback();
        await this.flush();
      }
      assert.fail("Timer feedback did not settle after 100 callbacks");
    },
  };
  const storageFor = (tab) => ({
    getItem: (key) => world.storage.get(key) ?? null,
    setItem: (key, value) => {
      const oldValue = world.storage.get(key) ?? null;
      world.storage.set(key, value); world.broadcast(tab, key, oldValue, value);
    },
    removeItem: (key) => {
      const oldValue = world.storage.get(key) ?? null;
      world.storage.delete(key); world.broadcast(tab, key, oldValue, null);
    },
  });
  world.tab = ({ legacy = false } = {}) => {
    const tab = { calls: 0, value: null, renders: 0, window: new Events(), document: new Events(), stopped: false };
    world.tabs.push(tab);
    tab.window.localStorage = storageFor(tab);
    tab.document.visibilityState = "visible";
    tab.window.setTimeout = (callback, delay) => {
      const id = ++world.timerSequence;
      world.timers.set(id, { callback, delay, due: world.now + delay, owner: tab });
      return id;
    };
    tab.window.clearTimeout = (id) => world.timers.delete(id);
    tab.transport = () => {
      if (world.user === null) return Promise.reject(Object.assign(new Error("Invalid session"), { authRejected: true }));
      return Promise.resolve(structuredClone(world.user));
    };
    const api = {
      getMe: async () => {
        tab.calls++; const user = await tab.transport();
        if (legacy) {
          // The pre-invitations bundle omitted precisely these getMe fields.
          delete user.invitationActive; delete user.invitationRequired; delete user.invitationExpiresAt;
        }
        return user;
      },
      getAuthUser: () => JSON.parse(world.storage.get("pc_auth_user") ?? "null"),
      cacheAuthUser: (user) => tab.window.localStorage.setItem("pc_auth_user", JSON.stringify(user)),
      clearAuth: () => {
        tab.window.localStorage.removeItem("pc_auth_token");
        tab.window.localStorage.removeItem("pc_auth_user");
      },
      isAuthenticationRejection: (error) => error?.authRejected === true,
      login: async () => ({ user: structuredClone(world.user) }),
      logout: async () => { api.clearAuth(); },
    };
    tab.api = api;
    if (legacy) {
      const refresh = async () => { api.cacheAuthUser(await api.getMe()); };
      // Preserve the old bundle's unfiltered storage -> getMe -> cache write.
      tab.window.addEventListener("storage", () => void refresh());
      tab.start = () => { void refresh(); };
      tab.stop = () => { tab.stopped = true; };
      return tab;
    }
    const slots = [];
    let cursor = 0, queued = false, effectQueue = [];
    const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
    const scheduleRender = () => {
      if (queued || tab.stopped) return;
      queued = true;
      queueMicrotask(() => { queued = false; if (!tab.stopped) tab.render(); });
    };
    const react = {
      createContext: () => ({ Provider: "AuthProvider" }), useContext: () => null,
      useState: (initial) => {
        const index = cursor++;
        slots[index] ??= { value: initial };
        return [slots[index].value, (update) => {
          const previous = slots[index].value;
          const next = typeof update === "function" ? update(previous) : update;
          if (!Object.is(previous, next)) { slots[index].value = next; scheduleRender(); }
        }];
      },
      useRef: (initial) => { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
      useCallback: (callback, deps) => {
        const index = cursor++;
        if (!slots[index] || !sameDeps(slots[index].deps, deps)) slots[index] = { value: callback, deps };
        return slots[index].value;
      },
      useEffect: (callback, deps) => {
        const index = cursor++;
        if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
          const previous = slots[index]; slots[index] = { deps, cleanup: previous?.cleanup };
          effectQueue.push(() => { previous?.cleanup?.(); slots[index].cleanup = callback(); });
        }
      },
    };
    const dependencies = { react, "react/jsx-runtime": { jsx: (_type, props) => { tab.value = props.value; return null; } },
      "./api-client": api, "./auth-session-sync": syncModule.exports };
    const loaded = { exports: {} };
    class BrowserDate extends Date { static now() { return world.now; } }
    new Function("require", "module", "exports", "window", "document", "Date", providerSource)(
      (name) => { assert.ok(name in dependencies, name); return dependencies[name]; },
      loaded, loaded.exports, tab.window, tab.document, BrowserDate,
    );
    tab.render = () => {
      cursor = 0; effectQueue = []; tab.renders++;
      loaded.exports.AuthProvider({ children: null });
      for (const run of effectQueue) run();
    };
    tab.start = () => tab.render();
    tab.stop = () => { tab.stopped = true; for (const slot of slots) slot?.cleanup?.(); };
    tab.focus = () => tab.window.emit("focus");
    tab.visible = (state) => { tab.document.visibilityState = state; tab.document.emit("visibilitychange"); };
    return tab;
  };
  t.after(() => { for (const tab of world.tabs) tab.stop(); });
  return world;
}

test("storage classification ignores display/preference changes and preserves session transitions", () => {
  const event = (key, oldValue, newValue) => ({ key, oldValue, newValue });
  for (const change of [
    event("pc_auth_user", '{"id":42}', '{"id":42,"invitationActive":true}'),
    event("paladinscat:locale", "en", "ko"), event("pc_auth_token", "same", "same"),
    event("pc_auth_user", null, "broken"), event("pc_auth_user", null, '{"id":"42"}'),
  ]) assert.equal(shouldRevalidateStoredSession(change, 42), false);
  for (const change of [event(null, null, null), event("pc_auth_token", null, "new-token"),
    event("pc_auth_token", "token", null), event("pc_auth_user", '{"id":42}', null),
    event("pc_auth_user", '{"id":42}', '{"id":43}'), event("pc_auth_user", null, '{"id":42}')]) {
    assert.equal(shouldRevalidateStoredSession(change, change.oldValue === null && change.key === "pc_auth_user" ? null : 42), true);
  }
});

test("mixed release tabs settle after differing auth-cache serialization instead of echoing forever", async (t) => {
  const world = fixture(t), oldTab = world.tab({ legacy: true }), current = world.tab();
  oldTab.start(); await world.flush(); current.start(); await world.flush();
  assert.equal(current.calls, 1); assert.equal(oldTab.calls, 2); assert.equal(world.events.length, 0);
  assert.equal(current.value.user.id, 42);
  current.focus(); await world.flush();
  assert.equal(current.calls, 2); assert.equal(oldTab.calls, 3); assert.equal(world.events.length, 0);
  assert.equal(JSON.parse(world.storage.get("pc_auth_user")).invitationActive, undefined);
  assert.equal(current.value.user.invitationActive, false, "old display cache cannot replace server-confirmed entitlement");
});

test("same-release cache writes and unrelated storage do not cause auth polling", async (t) => {
  const world = fixture(t), first = world.tab(), second = world.tab();
  first.start(); await world.flush(); second.start(); await world.flush();
  for (const key of ["paladinscat:locale", "paladinscat:site-banner:dismissed", "wallpaper"]) world.external(key, "changed");
  first.window.emit("storage", { key: "pc_auth_token", oldValue: null, newValue: "foreign", storageArea: {} });
  await world.flush();
  assert.equal(first.calls, 1); assert.equal(second.calls, 1);
});

test("focus and visible events share an in-flight refresh; identical user preserves reference", async (t) => {
  const world = fixture(t), tab = world.tab(); tab.start(); await world.flush();
  const previousUser = tab.value.user, previousRenders = tab.renders, pending = deferred();
  tab.transport = () => pending.promise;
  tab.focus(); tab.visible("visible"); tab.focus();
  assert.equal(tab.calls, 2);
  pending.resolve(structuredClone(stableUser)); await world.flush();
  assert.equal(tab.value.user, previousUser); assert.equal(tab.renders, previousRenders);
  tab.visible("hidden"); await world.flush(); assert.equal(tab.calls, 2);
});

test("transient session checks preserve the confirmed normal viewer and protected destinations", async (t) => {
  const world = fixture(t), tab = world.tab();
  world.user = { ...stableUser, linkedPlayerId: 16706730 };
  tab.start(); await world.flush();
  const confirmed = tab.value.user;
  for (const failure of [
    { kind: "network" }, { kind: "timeout" }, { kind: "edge-challenge", status: 403 },
    { kind: "session-required", status: 403 }, { kind: "http", status: 429 },
    { kind: "http", status: 503 }, { kind: "invalid-response", status: 200 },
  ]) {
    tab.transport = () => Promise.reject(Object.assign(new Error("Transient verification failure"), failure));
    tab.focus(); await world.flush();
    assert.equal(tab.value.user, confirmed, JSON.stringify(failure));
    assert.equal(tab.value.isLoading, false);
    for (const path of ["/players/16706730", "/stats", "/community", "/builds", "/tierlists", "/operations/tickets"]) {
      assert.equal(verifiedDestination(path, tab.value.user, false), path, `${failure.kind}: ${path}`);
    }
  }
  tab.transport = () => Promise.resolve({ ...world.user, linkedPlayerId: null });
  tab.focus(); await world.flush();
  assert.equal(verifiedDestination("/stats", tab.value.user, false), "/link-account", "successful revalidation applies changed account authority");
});

test("auth-control 401 clears an expired non-Pro cookie session instead of preserving an admission-error ghost", async (t) => {
  const world = fixture(t), tab = world.tab();
  const errors = { exports: {} }, client = { exports: {} };
  new Function("module", "exports", transpile("./api-errors.ts"))(errors, errors.exports);
  let responseState = "authenticated";
  const requests = [];
  tab.document.cookie = "__Host-pc_csrf=fixture-csrf";
  tab.window.location = { href: "https://paladinscat.com/stats", origin: "https://paladinscat.com" };
  const dependencies = { "./api-errors": errors.exports, "./fingerprint": { fingerprintHeaders: () => ({}) },
    "./lobby-tier": { withStoredLobbyTier: path => path }, "./csrf": { csrfHeader: () => null } };
  new Function("require", "module", "exports", "window", "document", "localStorage", "fetch", "process", transpile("./api-client.ts"))(
    name => dependencies[name] ?? {}, client, client.exports, tab.window, tab.document, tab.window.localStorage,
    async (url, options) => {
      requests.push({ url, headers: new Headers(options.headers), credentials: options.credentials });
      if (responseState === "admission-denied") {
        return Response.json({ error: { code: "WEBSITE_SESSION_REQUIRED" } }, { status: 403 });
      }
      if (responseState === "session-rejected") return Response.json({ error: "Invalid session" }, { status: 401 });
      return Response.json({ id: 42, username: "ConfirmedNonPro", linked_player_id: 16706730,
        invitation_required: false, invitation_active: false,
        expires_at: new Date(world.now + 1_000).toISOString() });
    }, { env: {} },
  );
  tab.transport = client.exports.getMe;
  tab.api.isAuthenticationRejection = client.exports.isAuthenticationRejection;
  tab.start(); await world.flush();
  const confirmed = tab.value.user;
  assert.equal(verifiedDestination("/stats", confirmed, false), "/stats");
  assert.equal(world.timers.size, 0, "normal auth/me session expiry is not mapped into an invitation timer");

  // Reproduce the old admission boundary after all browser cookies expire.
  // A 403 admission failure intentionally cannot revoke confirmed identity.
  tab.document.cookie = "";
  responseState = "admission-denied";
  await world.advance(1_001);
  tab.focus(); await world.flush();
  tab.focus(); await world.flush();
  assert.equal(tab.value.user, confirmed);
  assert.equal(verifiedDestination("/stats", tab.value.user, false), "/stats");
  assert.ok(world.storage.has("pc_auth_user"));

  // Auth-control must reach its owner and report the expired session as 401.
  // The existing provider then clears the ghost without weakening challenges.
  responseState = "session-rejected";
  tab.focus(); await world.flush();
  assert.equal(tab.value.user, null);
  assert.equal(tab.value.isLoggedIn, false);
  assert.equal(world.storage.has("pc_auth_user"), false);
  assert.equal(verifiedDestination("/stats", tab.value.user, false), "/auth/login?redirect=%2Fstats");
  assert.ok(requests.every(({ headers, credentials }) => !headers.has("authorization") && credentials === "same-origin"));
});

test("failed initial proof never trusts cached invitation privileges", async (t) => {
  const world = fixture(t), tab = world.tab();
  world.storage.set("pc_auth_user", JSON.stringify({ ...stableUser, linkedPlayerId: 16706730, invitationActive: true }));
  tab.transport = () => Promise.reject(new Error("Network unavailable"));
  tab.start(); await world.flush();
  assert.equal(tab.value.user.invitationActive, false);
  assert.equal(tab.value.user.invitationRequired, true);
  assert.equal(verifiedDestination("/stats", tab.value.user, false), "/account#invitation");
});

test("failed replacement-session proof cannot retain the previous session's invitation authority", async (t) => {
  const world = fixture(t), tab = world.tab();
  world.user = { ...stableUser, linkedPlayerId: 16706730, invitationActive: true };
  tab.start(); await world.flush();
  tab.transport = () => Promise.reject(new Error("Network unavailable"));
  world.external("pc_auth_token", "replacement-session"); await world.flush();
  assert.equal(tab.value.user.invitationActive, false);
  assert.equal(tab.value.user.invitationRequired, true);
  assert.equal(verifiedDestination("/stats", tab.value.user, false), "/account#invitation");
});

test("expiry and actual session rejection revoke previously confirmed privileges during outages", async (t) => {
  const world = fixture(t), tab = world.tab(), expires = world.now + 1_000;
  world.user = { ...stableUser, linkedPlayerId: 16706730, invitationRequired: true,
    invitationActive: true, invitationExpiresAt: new Date(expires).toISOString() };
  tab.start(); await world.flush();
  tab.transport = () => Promise.reject(new Error("Network unavailable"));
  await world.advance(1_000);
  assert.equal(tab.value.user.invitationActive, false);
  assert.equal(verifiedDestination("/stats", tab.value.user, false), "/account#invitation");
  tab.transport = () => Promise.reject(Object.assign(new Error("Session expired"), { authRejected: true, status: 401 }));
  tab.focus(); await world.flush();
  assert.equal(tab.value.user, null);
  assert.equal(world.storage.has("pc_auth_user"), false);
});

test("cache login and account switches are confirmed by server, never trusted for privileges", async (t) => {
  const world = fixture(t), tab = world.tab(); world.user = null; tab.start(); await world.flush();
  assert.equal(tab.value.user, null);
  world.user = { ...stableUser, id: 43, username: "Other" };
  const pending = deferred(); tab.transport = () => pending.promise;
  world.external("pc_auth_user", JSON.stringify({ id: 43, isAdmin: true })); await world.flush();
  assert.equal(tab.calls, 2); assert.equal(tab.value.user, null);
  pending.resolve(structuredClone(world.user)); await world.flush();
  assert.equal(tab.value.user.id, 43); assert.equal(tab.value.isAdmin, false);
  tab.transport = () => Promise.resolve(structuredClone(world.user));
  world.external("pc_auth_user", JSON.stringify({ id: 99, isAdmin: true })); await world.flush();
  assert.equal(tab.calls, 3); assert.equal(tab.value.user.id, 43);
});

test("token changes, logout cache deletion, and storage clear still revalidate auth", async (t) => {
  const world = fixture(t), tab = world.tab(); tab.start(); await world.flush();
  world.user = { ...stableUser, id: 43 };
  world.external("pc_auth_token", "new-session"); await world.flush();
  assert.equal(tab.calls, 2); assert.equal(tab.value.user.id, 43);
  world.user = null;
  world.external("pc_auth_user", null); await world.flush();
  assert.equal(tab.calls, 3); assert.equal(tab.value.user, null);
  world.user = structuredClone(stableUser); tab.focus(); await world.flush();
  const before = tab.calls; world.user = null;
  world.external(null, null); await world.flush();
  assert.equal(tab.calls, before + 1); assert.equal(tab.value.user, null);
});

test("explicit login is server-confirmed and an old pending refresh cannot undo logout", async (t) => {
  const world = fixture(t), tab = world.tab(); tab.start(); await world.flush();
  world.user = { ...stableUser, id: 43 };
  tab.api.login = async () => ({ user: { ...world.user, isAdmin: true } });
  await tab.value.login("Other", "unused"); await world.flush();
  assert.equal(tab.value.user.id, 43); assert.equal(tab.value.isAdmin, false);
  const pending = deferred(); tab.transport = () => pending.promise; tab.focus();
  await tab.value.logout(); await world.flush();
  assert.equal(tab.value.user, null);
  pending.resolve({ ...stableUser, id: 43 }); await world.flush();
  assert.equal(tab.value.user, null); assert.equal(world.storage.has("pc_auth_user"), false);
});

test("a superseded in-flight request cannot restore the previous account after token transition", async (t) => {
  const world = fixture(t), tab = world.tab(); tab.start(); await world.flush();
  const oldRequest = deferred(), currentRequest = deferred(); let request = 0;
  tab.transport = () => (++request === 1 ? oldRequest : currentRequest).promise;
  tab.focus(); world.external("pc_auth_token", "replacement"); await world.flush();
  currentRequest.resolve({ ...stableUser, id: 43 }); await world.flush();
  oldRequest.resolve(structuredClone(stableUser)); await world.flush();
  assert.equal(tab.value.user.id, 43); assert.equal(JSON.parse(world.storage.get("pc_auth_user")).id, 43);
});

test("a focus refresh started during pending logout cannot restore state after logout finishes", async (t) => {
  const world = fixture(t), tab = world.tab(); tab.start(); await world.flush();
  const logoutPending = deferred(), refreshPending = deferred();
  tab.api.logout = async () => { tab.api.clearAuth(); await logoutPending.promise; };
  tab.transport = () => refreshPending.promise;
  const completion = tab.value.logout(); await world.flush();
  tab.focus(); assert.equal(tab.calls, 2);
  logoutPending.resolve(); await completion; await world.flush();
  assert.equal(tab.value.user, null);
  refreshPending.resolve(structuredClone(stableUser)); await world.flush();
  assert.equal(tab.value.user, null); assert.equal(world.storage.has("pc_auth_user"), false);
});

test("invitation expiry still revalidates and removes an expired grant", async (t) => {
  const world = fixture(t), tab = world.tab(), expires = world.now + 1_000;
  world.user = { ...stableUser, invitationActive: true, invitationExpiresAt: new Date(expires).toISOString() };
  tab.transport = () => Promise.resolve({ ...world.user, invitationActive: world.now < expires });
  tab.start(); await world.flush();
  assert.equal(tab.value.user.invitationActive, true); assert.equal(tab.calls, 1);
  await world.advance(1_000);
  assert.equal(tab.value.user.invitationActive, false); assert.equal(tab.calls, 2);
  assert.equal(world.timers.size, 0);
});

test("long invitation timers remain within browser bounds and refresh at the existing checkpoint", async (t) => {
  const world = fixture(t), tab = world.tab(), expires = world.now + 30 * 86_400_000;
  world.user = { ...stableUser, invitationActive: true, invitationExpiresAt: new Date(expires).toISOString() };
  tab.transport = () => Promise.resolve({ ...world.user, invitationActive: world.now < expires });
  tab.start(); await world.flush();
  const confirmedUser = tab.value.user;
  assert.deepEqual([...world.timers.values()].map((timer) => timer.delay), [2_147_483_647]);
  await world.advance(2_147_483_647);
  assert.equal(tab.calls, 2); assert.equal(tab.value.user.invitationActive, true);
  assert.equal(tab.value.user, confirmedUser, "stable checkpoint response retains the confirmed snapshot");
  assert.equal(world.timers.size, 1, "checkpoint must keep the final expiry timer armed");
  assert.ok([...world.timers.values()].every((timer) => timer.delay > 0 && timer.delay <= 2_147_483_647));
  await world.advance(expires - world.now);
  assert.equal(tab.calls, 3); assert.equal(tab.value.user.invitationActive, false);
  assert.equal(world.timers.size, 0, "expired grant leaves no timer armed");
});
