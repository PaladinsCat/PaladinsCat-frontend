import assert from "node:assert/strict";
import test from "node:test";
import { mapImagePath } from "../lib/map-images.ts";

test("LIVE map names resolve to published overhead artwork", () => {
  assert.equal(mapImagePath("LIVE Frog Isle"), "/images/maps/Frog_Isle_Overhead_Layout.png");
  assert.equal(mapImagePath("Frog Isle"), "/images/maps/Frog_Isle_Overhead_Layout.png");
  assert.equal(mapImagePath("LIVE Warder's Gate"), "/images/maps/Warders_Gate_Overhead_Layout.png");
  assert.equal(mapImagePath("LIVE Splitstone Quarry"), "/images/maps/Splotstone_Quarry_Overhead_Layout.png");
});

test("ranked map names keep their loading-card asset convention", () => {
  assert.equal(mapImagePath("Ranked Frog Isle"), "/images/maps/Ranked_Frog_Isle.png");
  assert.equal(mapImagePath("Ranked Stone Keep (Classic)"), "/images/maps/Ranked_Stone_Keep_Classic.png");
});
