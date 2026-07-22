import assert from "node:assert/strict";
import test from "node:test";
import { pickWallpaperAccent, pickWallpaperAccents } from "./wallpaper-accent.ts";

function pixels(colors: Array<[number, number, number]>, repetitions = 1): Uint8ClampedArray {
  const values: number[] = [];
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    colors.forEach((color) => values.push(...color, 255));
  }
  return new Uint8ClampedArray(values);
}

test("returns no accent for a grayscale wallpaper", () => {
  assert.equal(pickWallpaperAccent(pixels([[90, 90, 90]], 20)), null);
  assert.deepEqual(pickWallpaperAccents(pixels([[90, 90, 90]], 20)), {
    primary: null,
    secondary: null,
  });
});

test("selects distinct primary and secondary colorful families", () => {
  const blueScene = pixels([
    ...Array.from({ length: 80 }, () => [35, 105, 190] as [number, number, number]),
    ...Array.from({ length: 8 }, () => [220, 45, 40] as [number, number, number]),
  ]);
  const accents = pickWallpaperAccents(blueScene);
  assert.match(accents.primary ?? "", /^hsl\(21\d /);
  assert.match(accents.secondary ?? "", /^hsl\([0-9] /);
});

test("raises dark scene colors into a readable Cat accent", () => {
  assert.equal(pickWallpaperAccent(pixels([[18, 92, 62]], 20)), "hsl(156 67% 58%)");
});

test("does not invent a second hue for a monochromatic wallpaper", () => {
  assert.deepEqual(pickWallpaperAccents(pixels([[35, 105, 190]], 20)), {
    primary: "hsl(213 69% 58%)",
    secondary: null,
  });
});
