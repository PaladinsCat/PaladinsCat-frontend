import assert from "node:assert/strict";
import { test } from "node:test";
import { routeUsesLobbyTierSelector } from "./lobby-tier-route.ts";

test("non-lobby statistics pages do not show the ranked lobby selector", () => {
  for (const pathname of [
    "/stats/ecpm",
    "/stats/egpm",
    "/stats/activity",
    "/stats/activity/details",
    "/stats/tiers",
  ]) {
    assert.equal(routeUsesLobbyTierSelector(pathname), false, pathname);
  }
});

test("ranked aggregate pages retain the ranked lobby selector", () => {
  for (const pathname of [
    "/stats",
    "/stats/performance",
    "/stats/maps",
    "/champions",
    "/champions/androxus",
    "/matches",
    "/game/items",
  ]) {
    assert.equal(routeUsesLobbyTierSelector(pathname), true, pathname);
  }
});

test("unrelated pages never show the ranked lobby selector", () => {
  assert.equal(routeUsesLobbyTierSelector("/"), false);
  assert.equal(routeUsesLobbyTierSelector("/players"), false);
  assert.equal(routeUsesLobbyTierSelector("/operations/paladinscat-bot"), false);
});
