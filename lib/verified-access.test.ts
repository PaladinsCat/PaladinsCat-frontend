import test from "node:test";
import assert from "node:assert/strict";
import { accountDestination, isAccountOnlyPath, isVerifiedOnlyPath, verifiedDestination } from "./verified-access.ts";

test("protects every Community menu route with account access", () => {
  for (const path of ["/community", "/community/42", "/community/diminishing-returns", "/builds", "/builds/create", "/tierlists", "/tierlists/7/edit"]) {
    assert.equal(isAccountOnlyPath(path), true, path);
  }
  assert.equal(isAccountOnlyPath("/community-guidelines"), false);
  assert.equal(accountDestination("/community?sort=new", null, false), "/auth/login?redirect=%2Fcommunity%3Fsort%3Dnew");
  assert.equal(accountDestination("/community", { linkedPlayerId: null }, false), "/community");
});

test("protects stats and player details while leaving both portals public", () => {
  assert.equal(isVerifiedOnlyPath("/stats"), false);
  assert.equal(isVerifiedOnlyPath("/players"), false);
  for (const path of [
    "/stats/performance", "/stats/champions", "/stats/items", "/stats/items/1",
    "/stats/maps", "/stats/compositions", "/stats/skins", "/stats/ecpm",
    "/stats/tiers", "/stats/activity", "/players/713736801", "/players/cheaters",
    "/game/items", "/game/maps/Bazaar",
    "/game/compositions",
  ]) {
    assert.equal(isVerifiedOnlyPath(path), true, path);
  }
});

test("routes gated access from the canonical linked-player state", () => {
  const path = "/stats/performance?scope=casual&metric=dpm";

  assert.equal(verifiedDestination(path, null, true), null);
  assert.equal(
    verifiedDestination(path, null, false),
    `/auth/login?redirect=${encodeURIComponent(path)}`,
  );
  assert.equal(verifiedDestination(path, { linkedPlayerId: null }, false), "/link-account");
  assert.equal(verifiedDestination(path, { linkedPlayerId: 713736801 }, false), path);
});
