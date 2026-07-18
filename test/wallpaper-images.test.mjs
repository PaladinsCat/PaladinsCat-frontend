import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { DEFAULT_WALLPAPERS } from "../lib/wallpaper-images.ts";

const publicRoot = path.resolve(import.meta.dirname, "../public");

test("default wallpaper rotation uses only full-scene wallpaper assets", async () => {
  assert.equal(DEFAULT_WALLPAPERS.length, 19);

  for (const wallpaper of DEFAULT_WALLPAPERS) {
    assert.match(wallpaper.avif, /^\/images\/wallpapers\/\d+\.avif$/);
    assert.match(wallpaper.png, /^\/images\/wallpapers\/\d+\.png$/);
    assert.doesNotMatch(wallpaper.avif, /overhead/i);
    await Promise.all([
      access(path.join(publicRoot, wallpaper.avif)),
      access(path.join(publicRoot, wallpaper.png)),
    ]);
  }
});
