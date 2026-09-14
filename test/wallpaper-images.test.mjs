import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { DEFAULT_WALLPAPERS, randomizeWallpaperOrder } from "../lib/wallpaper-images.ts";

const publicRoot = path.resolve(import.meta.dirname, "../public");

test("default wallpaper rotation uses only full-scene wallpaper assets", async () => {
  assert.equal(DEFAULT_WALLPAPERS.length, 3);

  for (const wallpaper of DEFAULT_WALLPAPERS) {
    assert.match(wallpaper.avif, /^\/images\/wallpapers\/[a-z0-9-]+\.avif$/);
    assert.match(wallpaper.png, /^\/images\/wallpapers\/[a-z0-9-]+\.png$/);
    assert.doesNotMatch(wallpaper.avif, /overhead/i);
    await Promise.all([
      access(path.join(publicRoot, wallpaper.avif)),
      access(path.join(publicRoot, wallpaper.png)),
    ]);
  }
});

test("built-in wallpaper order starts on a randomized wallpaper after hydration", () => {
  const order = randomizeWallpaperOrder(DEFAULT_WALLPAPERS, () => 0);

  assert.notEqual(order[0], DEFAULT_WALLPAPERS[0]);
  assert.deepEqual(
    order.map((wallpaper) => wallpaper.avif).sort(),
    DEFAULT_WALLPAPERS.map((wallpaper) => wallpaper.avif).sort(),
  );
});
