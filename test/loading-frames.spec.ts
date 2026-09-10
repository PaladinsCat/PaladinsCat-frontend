import { expect, test } from "@playwright/test";
import { appendFileSync, readFileSync } from "node:fs";
import { resolveLoadingFrameAsset } from "../lib/loading-frame-assets";
import manifest from "../public/images/loading-frames/manifest.json";

const fixturePath = process.env.LOADING_FRAME_PLAYER_FIXTURES;
const players: { id: string; loading_frame: string }[] = fixturePath ? JSON.parse(readFileSync(fixturePath, "utf8").replace(/^\uFEFF/, "")) : [];

test("all player-frame assets load as WebP and fall back to transparent static PNG", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/dev/loading-frames");
  for (const frame of manifest.frames) {
    const image = page.locator(`[data-frame-slug="${frame.slug}"] picture img`);
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 380 && img.naturalHeight === 512 && new URL(img.currentSrc).pathname.endsWith(".webp"))).toBe(true);
  }
  // Observe one indicator-only frame and one frame with continuous authored motion.
  for (const slug of ["ascension", "equalizer"]) {
    const image = page.locator(`[data-frame-slug="${slug}"] picture img`);
    const first = await image.screenshot();
    await page.waitForTimeout(2000);
    expect((await image.screenshot()).equals(first)).toBe(false);
  }
  // Emulate a client that does not accept image/webp in <picture>.
  await page.locator("article picture source").evaluateAll(sources => sources.forEach(source => source.setAttribute("type", "image/x-unsupported-for-test")));
  for (const frame of manifest.frames) {
    const image = page.locator(`[data-frame-slug="${frame.slug}"] picture img`);
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 380 && img.naturalHeight === 512 && new URL(img.currentSrc).pathname.endsWith(".png"))).toBe(true);
  }
  const stationary = page.locator('[data-frame-slug="ascension"] picture img');
  const first = await stationary.screenshot();
  await page.waitForTimeout(2000);
  expect((await stationary.screenshot()).equals(first)).toBe(true);
});

for (const player of players) {
  test(`real player ${player.id}: ${player.loading_frame}`, async ({ page, request }) => {
    test.setTimeout(30_000);
    const response = await request.get(`/api/players/${player.id}`);
    expect(response.ok(), `Profile API returned HTTP ${response.status()}`).toBe(true);
    const body = await response.json();
    const name = body.player.loading_frame;
    const resolved = resolveLoadingFrameAsset(name);
    const expected = resolved ?? resolveLoadingFrameAsset("Default Ally Team")!;
    await page.goto(`/players/${player.id}`);
    const image = page.locator('picture img[src*="/images/loading-frames/"]');
    await expect(image).toHaveAttribute("src", expected.assets.png);
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => ({ ready: img.complete && img.naturalWidth === 380, path: img.currentSrc ? new URL(img.currentSrc).pathname + new URL(img.currentSrc).search : "" }))).toEqual({ ready: true, path: expected.assets.webp });
    if (process.env.LOADING_FRAME_COVERAGE) appendFileSync(process.env.LOADING_FRAME_COVERAGE, JSON.stringify({id:player.id,frame:name,slug:expected.slug,mapped:!!resolved,webpLoaded:true,pngFallback:expected.assets.png}) + "\n");
  });
}
