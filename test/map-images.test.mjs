import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { mapImagePath, matchMapImagePath, matchMapImageSources } from "../lib/map-images.ts";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDir, "../../..");

test("LIVE map names resolve to published overhead artwork", () => {
  assert.equal(mapImagePath("LIVE Frog Isle"), "/images/maps/Frog_Isle_Overhead_Layout.png");
  assert.equal(mapImagePath("Frog Isle"), "/images/maps/Frog_Isle_Overhead_Layout.png");
  assert.equal(mapImagePath("LIVE Warder's Gate"), "/images/maps/Warders_Gate_Overhead_Layout.png");
  assert.equal(mapImagePath("LIVE Splitstone Quarry"), "/images/maps/Splotstone_Quarry_Overhead_Layout.png");
});

test("site wallpaper selection is independent of ranked queue labels", () => {
  assert.equal(mapImagePath("Ranked Frog Isle"), "/images/maps/Frog_Isle_Overhead_Layout.png");
  assert.equal(mapImagePath("Ranked Stone Keep (Classic)"), "/images/maps/Stone_Keep_Overhead_Layout.png");
});

test("maps with published loading art never fall back to a missing filename", () => {
  assert.equal(mapImagePath("LIVE Timber Mill"), "/images/maps/Timber_Mill_Loading.png");
  assert.equal(mapImagePath("Ranked Timber Mill"), "/images/maps/Timber_Mill_Loading.png");
  assert.equal(mapImagePath("Frozen Guard"), "/images/maps/Frozen_Guard_Loading.png");
  assert.equal(mapImagePath("Trade District"), "/images/maps/Trade_District_Loading.png");
  assert.equal(mapImagePath("Magistrate's Archives"), "/images/maps/Magistrates_Archives_Loading.png");
  assert.equal(mapImagePath("LIVE Magistrate's Archives (Onslaught)"), "/images/maps/Magistrates_Archives_Loading.png");
});

test("scoreboard artwork is independent of queue labels and site wallpapers", () => {
  assert.equal(matchMapImagePath("Frog Isle"), "/images/maps/Match_Frog_Isle.png");
  assert.equal(matchMapImagePath("Ranked Frog Isle"), "/images/maps/Match_Frog_Isle.png");
  assert.equal(matchMapImagePath("LIVE Magistrate's Archives (Onslaught)"), "/images/maps/Match_Magistrates_Archives.png");
  assert.equal(matchMapImagePath("Ranked Stone Keep (Classic)"), "/images/maps/Match_Stone_Keep_Classic.png");
});

test("AVIF remains the preferred scoreboard source with genuine PNG fallback", () => {
  assert.deepEqual(matchMapImageSources("Timber Mill"), {
    avif: "/images/maps/Match_Timber_Mill.avif",
    png: "/images/maps/Match_Timber_Mill.png",
  });
});

test("every approved review entry resolves to a published match-art pair", async () => {
  const review = JSON.parse(await readFile(path.join(repositoryRoot, "dev", "prototypes", "scoreboard-map-image-review.json"), "utf8"));
  assert.equal(review.maps.length, 32);
  assert.ok(review.maps.every((map) => map.status === "approved"));

  for (const map of review.maps) {
    assert.equal(matchMapImagePath(map.name), `/images/maps/${map.matchAsset}.png`);
    await Promise.all([
      access(path.join(repositoryRoot, "src", "frontend", "public", "images", "maps", `${map.matchAsset}.png`)),
      access(path.join(repositoryRoot, "src", "frontend", "public", "images", "maps", `${map.matchAsset}.avif`)),
    ]);
  }
});
