export const HOME_CAT_ACCENT_PROPERTY = "--pc-home-cat-accent";
export const HOME_PLATFORM_ACCENT_PROPERTY = "--pc-home-platform-accent";

const SAMPLE_SIZE = 48;
const HUE_BUCKETS = 24;

type Hsl = { h: number; s: number; l: number };
export type WallpaperAccents = {
  primary: string | null;
  secondary: string | null;
};

type ColorBucket = {
  weight: number;
  red: number;
  green: number;
  blue: number;
  samples: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(red: number, green: number, blue: number): Hsl {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l: lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);

  return { h: hue < 0 ? hue + 360 : hue, s: saturation, l: lightness };
}

function formatBucketColor(bucket: ColorBucket): string | null {
  if (bucket.samples < 6 || bucket.weight <= 0) return null;

  const color = rgbToHsl(
    bucket.red / bucket.weight,
    bucket.green / bucket.weight,
    bucket.blue / bucket.weight,
  );
  const saturation = Math.round(clamp(color.s * 100, 55, 85));
  const lightness = Math.round(clamp(color.l * 100, 58, 72));
  return `hsl(${Math.round(color.h)} ${saturation}% ${lightness}%)`;
}

function hueBucketDistance(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, HUE_BUCKETS - distance);
}

/**
 * Finds two representative colorful hue families while ignoring shadows,
 * highlights, and near-gray pixels. The secondary family stays visually
 * separate from the dominant one so the two accents remain intentional.
 */
export function pickWallpaperAccents(pixels: Uint8ClampedArray): WallpaperAccents {
  const buckets: ColorBucket[] = Array.from({ length: HUE_BUCKETS }, () => ({
    weight: 0,
    red: 0,
    green: 0,
    blue: 0,
    samples: 0,
  }));

  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.75) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const hsl = rgbToHsl(red, green, blue);
    if (hsl.s < 0.24 || hsl.l < 0.16 || hsl.l > 0.86) continue;

    const midtoneWeight = 1 - Math.min(0.8, Math.abs(hsl.l - 0.52) * 1.45);
    const weight = alpha * hsl.s * hsl.s * midtoneWeight;
    const bucket = buckets[Math.floor(hsl.h / (360 / HUE_BUCKETS)) % HUE_BUCKETS];
    bucket.weight += weight;
    bucket.red += red * weight;
    bucket.green += green * weight;
    bucket.blue += blue * weight;
    bucket.samples += 1;
  }

  const ranked = buckets
    .map((bucket, index) => ({ bucket, index }))
    .filter(({ bucket }) => bucket.samples >= 6 && bucket.weight > 0)
    .sort((left, right) => right.bucket.weight - left.bucket.weight);
  const primary = ranked[0];
  if (!primary) return { primary: null, secondary: null };

  const secondary = ranked.find(({ index }) => hueBucketDistance(index, primary.index) >= 3);
  return {
    primary: formatBucketColor(primary.bucket),
    secondary: secondary ? formatBucketColor(secondary.bucket) : null,
  };
}

/** Backward-compatible shortcut for consumers that only need the main accent. */
export function pickWallpaperAccent(pixels: Uint8ClampedArray): string | null {
  return pickWallpaperAccents(pixels).primary;
}

/** Samples an image in a tiny canvas. Cross-origin images safely fall back. */
export async function extractWallpaperAccents(source: string): Promise<WallpaperAccents> {
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = source;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return { primary: null, secondary: null };
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return pickWallpaperAccents(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
  } catch {
    return { primary: null, secondary: null };
  }
}

export async function extractWallpaperAccent(source: string): Promise<string | null> {
  return (await extractWallpaperAccents(source)).primary;
}
