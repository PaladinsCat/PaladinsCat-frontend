/**
 * Verify wallpaper accent extraction across grayscale, colorful, dark, and flat scenes.
 *
 * The tests exercise pure pixel transforms and perform no network, authentication, cache, or persistence work.
 */
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
    tertiary: null,
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
  assert.ok(accents.tertiary);
  assert.notEqual(accents.tertiary, accents.primary);
  assert.notEqual(accents.tertiary, accents.secondary);
});

test("raises dark scene colors into a readable Cat accent", () => {
  assert.equal(pickWallpaperAccent(pixels([[18, 92, 62]], 20)), "hsl(156 67% 58%)");
});

test("derives a contrasting hue for a completely flat monochromatic wallpaper", () => {
  assert.deepEqual(pickWallpaperAccents(pixels([[35, 105, 190]], 20)), {
    primary: "hsl(213 69% 58%)",
    secondary: "hsl(3 59% 68%)",
    tertiary: "hsl(93 59% 68%)",
  });
});

test("uses a source shade when a monochromatic wallpaper has tonal highlights", () => {
  const redScene = pixels([
    ...Array.from({ length: 60 }, () => [118, 24, 31] as [number, number, number]),
    ...Array.from({ length: 24 }, () => [143, 70, 59] as [number, number, number]),
    ...Array.from({ length: 24 }, () => [24, 3, 6] as [number, number, number]),
  ]);
  const accents = pickWallpaperAccents(redScene);
  assert.match(accents.primary ?? "", /^hsl\(35[0-9] /);
  assert.match(accents.secondary ?? "", /^hsl\(35[0-9] /);
  assert.ok(accents.tertiary);
  assert.notEqual(accents.secondary, accents.primary);
  assert.notEqual(accents.tertiary, accents.primary);
  assert.notEqual(accents.tertiary, accents.secondary);
});

test("selects three distinct source color families when available", () => {
  const accents = pickWallpaperAccents(pixels([
    ...Array.from({ length: 50 }, () => [45, 100, 205] as [number, number, number]),
    ...Array.from({ length: 36 }, () => [210, 55, 65] as [number, number, number]),
    ...Array.from({ length: 28 }, () => [45, 170, 95] as [number, number, number]),
  ]));
  assert.ok(accents.primary);
  assert.ok(accents.secondary);
  assert.ok(accents.tertiary);
  assert.equal(new Set([accents.primary, accents.secondary, accents.tertiary]).size, 3);
});
