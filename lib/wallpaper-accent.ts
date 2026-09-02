/**
 * Derive readable Cat-themed accent colors from wallpaper pixels.
 *
 * This module owns color bucketing and browser image extraction; it does not fetch or persist wallpaper data.
 * refs: none
 */
/** CSS custom property carrying the primary Cat accent; reading it has no side effects. · refs: none */
export const HOME_CAT_ACCENT_PROPERTY = "--pc-home-cat-accent";
/** CSS custom property carrying the secondary platform accent; reading it has no side effects. · refs: none */
export const HOME_PLATFORM_ACCENT_PROPERTY = "--pc-home-platform-accent";
/** CSS custom property carrying the tertiary wallpaper accent; reading it has no side effects. · refs: none */
export const HOME_THIRD_ACCENT_PROPERTY = "--pc-home-third-accent";

const SAMPLE_SIZE = 48;
const HUE_BUCKETS = 24;
const TONE_BUCKETS = 10;
const MIN_BUCKET_SAMPLES = 6;

type Hsl = { h: number; s: number; l: number };
export type WallpaperAccents = {
  primary: string | null;
  secondary: string | null;
  tertiary: string | null;
};

type ColorBucket = {
  weight: number;
  red: number;
  green: number;
  blue: number;
  samples: number;
};

function createColorBucket(): ColorBucket {
  return { weight: 0, red: 0, green: 0, blue: 0, samples: 0 };
}

function addToBucket(
  bucket: ColorBucket,
  red: number,
  green: number,
  blue: number,
  weight: number,
): void {
  bucket.weight += weight;
  bucket.red += red * weight;
  bucket.green += green * weight;
  bucket.blue += blue * weight;
  bucket.samples += 1;
}

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

function bucketColor(bucket: ColorBucket): Hsl | null {
  if (bucket.samples < MIN_BUCKET_SAMPLES || bucket.weight <= 0) return null;
  return rgbToHsl(
    bucket.red / bucket.weight,
    bucket.green / bucket.weight,
    bucket.blue / bucket.weight,
  );
}

function formatBucketColor(bucket: ColorBucket): string | null {
  const color = bucketColor(bucket);
  if (!color) return null;
  const saturation = Math.round(clamp(color.s * 100, 55, 85));
  const lightness = Math.round(clamp(color.l * 100, 58, 72));
  return `hsl(${Math.round(color.h)} ${saturation}% ${lightness}%)`;
}

function formatTonalAccent(color: Hsl, primary: Hsl): string {
  const primarySaturation = clamp(primary.s * 100, 55, 85);
  const sourceSaturation = clamp(color.s * 100, 45, 82);
  const saturation = Math.abs(sourceSaturation - primarySaturation) < 10
    ? clamp(primarySaturation + (primarySaturation >= 65 ? -15 : 15), 45, 82)
    : sourceSaturation;
  const primaryLightness = clamp(primary.l * 100, 58, 72);
  const lightness = primaryLightness >= 68
    ? clamp(primaryLightness - 14, 54, 80)
    : clamp(primaryLightness + 14, 54, 80);
  return `hsl(${Math.round(color.h)} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
}

function deriveContrastingAccent(primary: Hsl, hueOffset = 150): string {
  const hue = Math.round((primary.h + hueOffset) % 360);
  const saturation = Math.round(clamp(primary.s * 85, 55, 75));
  const primaryLightness = clamp(primary.l * 100, 58, 72);
  const lightness = primaryLightness >= 68 ? 58 : 68;
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function hueDistanceDegrees(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, 360 - distance);
}

function tertiaryHueOffset(primaryHue: number, secondaryHue: number): number {
  return [60, 120, 240, 300]
    .map((offset) => {
      const hue = (primaryHue + offset) % 360;
      return {
        offset,
        score: Math.min(
          hueDistanceDegrees(hue, primaryHue),
          hueDistanceDegrees(hue, secondaryHue),
        ),
      };
    })
    .sort((left, right) => right.score - left.score)[0].offset;
}

function hueBucketDistance(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, HUE_BUCKETS - distance);
}

/**
 * Finds a dominant accent and a second readable color. It prefers another hue,
 * falls back to a representative shade, then derives contrast for flat images.
 * Returns: `object`
 * refs: none
 */
export function pickWallpaperAccents(pixels: Uint8ClampedArray): WallpaperAccents {
  const buckets: ColorBucket[] = Array.from({ length: HUE_BUCKETS }, createColorBucket);
  const toneBuckets: ColorBucket[][] = Array.from(
    { length: HUE_BUCKETS },
    () => Array.from({ length: TONE_BUCKETS }, createColorBucket),
  );
  let tonalSampleCount = 0;

  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.75) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const hsl = rgbToHsl(red, green, blue);
    const midtoneWeight = 1 - Math.min(0.8, Math.abs(hsl.l - 0.52) * 1.45);
    const hueBucketIndex = Math.floor(hsl.h / (360 / HUE_BUCKETS)) % HUE_BUCKETS;

    // Keep dark and muted shades for a monochromatic fallback. They are not
    // allowed to lead the palette, but they can provide the second accent.
    if (hsl.s >= 0.16 && hsl.l >= 0.035 && hsl.l <= 0.9) {
      const toneWeight = alpha * hsl.s * hsl.s * (0.35 + 0.65 * midtoneWeight);
      const toneIndex = Math.min(TONE_BUCKETS - 1, Math.floor(hsl.l * TONE_BUCKETS));
      addToBucket(toneBuckets[hueBucketIndex][toneIndex], red, green, blue, toneWeight);
      tonalSampleCount += 1;
    }

    if (hsl.s < 0.24 || hsl.l < 0.16 || hsl.l > 0.86) continue;

    const weight = alpha * hsl.s * hsl.s * midtoneWeight;
    addToBucket(buckets[hueBucketIndex], red, green, blue, weight);
  }

  const ranked = buckets
    .map((bucket, index) => ({ bucket, index }))
    .filter(({ bucket }) => bucket.samples >= MIN_BUCKET_SAMPLES && bucket.weight > 0)
    .sort((left, right) => right.bucket.weight - left.bucket.weight);
  const primary = ranked[0];
  if (!primary) return { primary: null, secondary: null, tertiary: null };

  const primaryColor = bucketColor(primary.bucket);
  if (!primaryColor) return { primary: null, secondary: null, tertiary: null };

  const distinctCandidates = ranked
    .slice(1)
    .filter(({ index }) => hueBucketDistance(index, primary.index) >= 3);
  const secondaryCandidate = distinctCandidates[0] ?? null;
  const tertiaryCandidate = distinctCandidates.find(({ index }) => (
    secondaryCandidate !== null
    && hueBucketDistance(index, secondaryCandidate.index) >= 3
  )) ?? null;

  const minimumToneSamples = Math.max(MIN_BUCKET_SAMPLES, Math.ceil(tonalSampleCount * 0.01));
  const tonalSecondary = toneBuckets
    .flatMap((tones, hueIndex) => tones.map((bucket) => ({ bucket, hueIndex })))
    .filter(({ bucket, hueIndex }) => (
      bucket.samples >= minimumToneSamples
      && bucket.weight > 0
      && hueBucketDistance(hueIndex, primary.index) <= 2
    ))
    .map(({ bucket }) => {
      const color = bucketColor(bucket);
      if (!color) return null;
      const lightnessGap = Math.abs(color.l - primaryColor.l);
      const saturationGap = Math.abs(color.s - primaryColor.s);
      if (lightnessGap < 0.07 && saturationGap < 0.18) return null;
      const contrast = lightnessGap * 2 + saturationGap * 0.35;
      const score = contrast * Math.log2(bucket.samples + 1) * (0.65 + color.l);
      return { color, score };
    })
    .filter((candidate): candidate is { color: Hsl; score: number } => candidate !== null)
    .sort((left, right) => right.score - left.score)[0];

  const secondaryColor = secondaryCandidate ? bucketColor(secondaryCandidate.bucket) : null;
  const secondary = secondaryCandidate
    ? formatBucketColor(secondaryCandidate.bucket)
    : tonalSecondary
      ? formatTonalAccent(tonalSecondary.color, primaryColor)
      : deriveContrastingAccent(primaryColor);
  const secondaryHue = secondaryColor?.h
    ?? (tonalSecondary ? tonalSecondary.color.h : (primaryColor.h + 150) % 360);

  return {
    primary: formatBucketColor(primary.bucket),
    secondary,
    tertiary: tertiaryCandidate
      ? formatBucketColor(tertiaryCandidate.bucket)
      : deriveContrastingAccent(
        primaryColor,
        tertiaryHueOffset(primaryColor.h, secondaryHue),
      ),
  };
}

/** Backward-compatible shortcut for consumers that only need the main accent. · refs: none */
export function pickWallpaperAccent(pixels: Uint8ClampedArray): string | null {
  return pickWallpaperAccents(pixels).primary;
}

/** Samples an image in a tiny canvas. Cross-origin images safely fall back. · refs: none */
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
    if (!context) return { primary: null, secondary: null, tertiary: null };
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return pickWallpaperAccents(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
  } catch {
    return { primary: null, secondary: null, tertiary: null };
  }
}

/**
 * Extract one readable accent color from a wallpaper source URL.
 *
 * Accepts source; returns a color or null after browser image decoding, without authentication or persistence effects.
 * Returns: `Promise<string | null>`
 * refs: none
 */
export async function extractWallpaperAccent(source: string): Promise<string | null> {
  return (await extractWallpaperAccents(source)).primary;
}
