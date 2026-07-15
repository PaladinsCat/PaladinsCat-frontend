import assert from "node:assert/strict";
import test from "node:test";
import { mapImagePath, mapImageSources } from "../lib/map-images.ts";

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

test("maps with published loading art never fall back to a missing filename", () => {
  assert.equal(mapImagePath("LIVE Timber Mill"), "/images/maps/Timber_Mill_Loading.png");
  assert.equal(mapImagePath("Ranked Timber Mill"), "/images/maps/Timber_Mill_Loading.png");
  assert.equal(mapImagePath("Frozen Guard"), "/images/maps/Frozen_Guard_Loading.png");
  assert.equal(mapImagePath("Trade District"), "/images/maps/Trade_District_Loading.png");
  assert.equal(mapImagePath("Magistrate's Archives"), "/images/maps/Magistrates_Archives_Loading.png");
  assert.equal(mapImagePath("LIVE Magistrate's Archives (Onslaught)"), "/images/maps/Magistrates_Archives_Loading.png");
});

test("AVIF remains the preferred scoreboard source with PNG fallback", () => {
  assert.deepEqual(mapImageSources("Timber Mill"), {
    avif: "/images/maps/Timber_Mill_Loading.avif",
    png: "/images/maps/Timber_Mill_Loading.png",
  });
});
