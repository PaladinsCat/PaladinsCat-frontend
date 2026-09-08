/** Prevent ranked selections and saved tier filters from leaking into casual metrics. */
import assert from "node:assert/strict";
import test from "node:test";
import { performanceSelection } from "./performance-selection.ts";
import { withStoredLobbyTier } from "./lobby-tier.ts";
import { routeUsesLobbyTierSelector } from "./lobby-tier-route.ts";

test("casual deep links keep supported measures and replace ranked-only KDA", () => {
  assert.deepEqual(performanceSelection("casual", "hpm"), { scope: "casual", metric: "hpm" });
  assert.deepEqual(performanceSelection("casual", "kda"), { scope: "casual", metric: "dpm" });
  assert.deepEqual(performanceSelection("ranked", "kda"), { scope: "ranked", metric: "kda" });
  assert.deepEqual(performanceSelection("unknown", "unknown"), { scope: "ranked", metric: "dpm" });
});

test("a saved Diamond+ filter scopes ranked but leaves casual requests unchanged", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: () => "diamond-plus" } } });
  try {
    const casual = "/stats/performance-metrics?scope=casual&metric=hpm&includeRoles=1";
    assert.equal(withStoredLobbyTier(casual), casual);
    assert.equal(withStoredLobbyTier("/stats/performance-metrics?scope=ranked"), "/stats/performance-metrics?scope=ranked&tierMin=21&tierMax=26");
    assert.equal(withStoredLobbyTier("/stats/performance-metrics?tierMin=1&tierMax=15"), "/stats/performance-metrics?tierMin=1&tierMax=15");
    assert.equal(routeUsesLobbyTierSelector("/stats/performance", "casual"), false);
    assert.equal(routeUsesLobbyTierSelector("/stats/performance", "ranked"), true);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
