import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const WIKI_PAGE = "Loading Frames";
const WIKI_PAGE_URL = "https://paladins.fandom.com/wiki/Loading_Frames";
const API_URL = "https://paladins.fandom.com/api.php";
const USER_AGENT = "PaladinsCat loading-frame asset sync/1.0";
const OUTPUT_DIR = resolve(process.cwd(), "public", "images", "loading-frames");
const MANIFEST_PATH = resolve(OUTPUT_DIR, "manifest.json");
const DOWNLOAD_CONCURRENCY = 4;

function normalizeSourceFile(value) {
  return value.replaceAll("_", " ").trim();
}

function sourceKey(value) {
  return normalizeSourceFile(value).toLocaleLowerCase("en-US");
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function inspectWebp(buffer) {
  if (
    buffer.length < 20
    || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error("Downloaded optimized asset is not a WebP container");
  }

  let offset = 12;
  let width = 0;
  let height = 0;
  let frameCount = 0;
  let durationMs = 0;
  let hasAnimationHeader = false;

  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkLength = buffer.readUInt32LE(offset + 4);
    const payloadOffset = offset + 8;

    if (payloadOffset + chunkLength > buffer.length) {
      throw new Error(`Invalid WebP ${chunkType} chunk length`);
    }

    if (chunkType === "VP8X" && chunkLength >= 10) {
      width = readUInt24LE(buffer, payloadOffset + 4) + 1;
      height = readUInt24LE(buffer, payloadOffset + 7) + 1;
    } else if (chunkType === "ANIM") {
      hasAnimationHeader = true;
    } else if (chunkType === "ANMF" && chunkLength >= 16) {
      frameCount += 1;
      durationMs += readUInt24LE(buffer, payloadOffset + 12);
    }

    offset = payloadOffset + chunkLength + (chunkLength % 2);
  }

  return {
    width,
    height,
    frameCount: frameCount || 1,
    durationMs,
    animated: hasAnimationHeader && frameCount > 1,
  };
}

function skipGifSubBlocks(buffer, startOffset) {
  let offset = startOffset;
  while (offset < buffer.length) {
    const length = buffer[offset];
    offset += 1;
    if (length === 0) return offset;
    offset += length;
  }
  throw new Error("Unterminated GIF data sub-block");
}

function inspectGif(buffer) {
  const header = buffer.toString("ascii", 0, 6);
  if (header !== "GIF87a" && header !== "GIF89a") {
    throw new Error("Downloaded original asset is not a GIF");
  }

  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  const packed = buffer[10];
  let offset = 13;
  let frameCount = 0;
  let durationMs = 0;
  let pendingDelayMs = 0;

  if (packed & 0x80) {
    offset += 3 * (1 << ((packed & 0x07) + 1));
  }

  while (offset < buffer.length) {
    const marker = buffer[offset];
    offset += 1;

    if (marker === 0x3b) break;

    if (marker === 0x21) {
      const extensionLabel = buffer[offset];
      offset += 1;
      if (extensionLabel === 0xf9) {
        const blockLength = buffer[offset];
        offset += 1;
        if (blockLength !== 4 || offset + blockLength > buffer.length) {
          throw new Error("Invalid GIF graphics control extension");
        }
        offset += 1;
        pendingDelayMs = buffer.readUInt16LE(offset) * 10;
        offset += 3;
        if (buffer[offset] === 0) offset += 1;
      } else {
        offset = skipGifSubBlocks(buffer, offset);
      }
      continue;
    }

    if (marker === 0x2c) {
      frameCount += 1;
      durationMs += pendingDelayMs;
      pendingDelayMs = 0;
      offset += 8;
      const imagePacked = buffer[offset];
      offset += 1;
      if (imagePacked & 0x80) {
        offset += 3 * (1 << ((imagePacked & 0x07) + 1));
      }
      offset += 1;
      offset = skipGifSubBlocks(buffer, offset);
      continue;
    }

    throw new Error(`Unexpected GIF marker 0x${marker.toString(16)}`);
  }

  return {
    width,
    height,
    frameCount,
    durationMs,
    animated: frameCount > 1,
  };
}

async function fetchChecked(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "user-agent": USER_AGENT,
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response;
}

async function fetchJson(params) {
  const query = new URLSearchParams({ format: "json", origin: "*", ...params });
  const response = await fetchChecked(`${API_URL}?${query}`);
  return response.json();
}

function parseGalleryEntries(wikitext) {
  const entries = [];
  const pattern = /^File:(.+? Frame\.gif)\|.*?'''(.+?)'''/gm;
  for (const match of wikitext.matchAll(pattern)) {
    entries.push({
      sourceFile: normalizeSourceFile(match[1]),
      displayName: match[2].trim(),
    });
  }
  return entries;
}

async function fetchImageInfo(sourceFiles) {
  const bySourceFile = new Map();
  for (let offset = 0; offset < sourceFiles.length; offset += 25) {
    const titles = sourceFiles
      .slice(offset, offset + 25)
      .map((sourceFile) => `File:${sourceFile}`)
      .join("|");
    const result = await fetchJson({
      action: "query",
      titles,
      prop: "imageinfo",
      iiprop: "url|mime|size|sha1|mediatype",
    });

    for (const page of Object.values(result.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;
      bySourceFile.set(sourceKey(page.title.replace(/^File:/, "")), {
        sourceUrl: info.url,
        descriptionUrl: info.descriptionurl,
        originalBytesReported: Number(info.size) || null,
        width: Number(info.width) || null,
        height: Number(info.height) || null,
        sha1: info.sha1 || null,
      });
    }
  }
  return bySourceFile;
}

async function mapConcurrent(values, concurrency, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      results[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

async function downloadFrame(entry, imageInfo) {
  const slug = slugify(entry.displayName);
  const webpPath = resolve(OUTPUT_DIR, `${slug}.webp`);
  const gifPath = resolve(OUTPUT_DIR, `${slug}.gif`);

  const [optimizedResponse, originalResponse] = await Promise.all([
    fetchChecked(imageInfo.sourceUrl, {
      headers: { accept: "image/webp,image/*;q=0.8,*/*;q=0.5" },
    }),
    fetchChecked(`${imageInfo.sourceUrl}${imageInfo.sourceUrl.includes("?") ? "&" : "?"}format=original`, {
      headers: { accept: "image/gif,image/*;q=0.8,*/*;q=0.5" },
    }),
  ]);

  const [webpBuffer, gifBuffer] = await Promise.all([
    optimizedResponse.arrayBuffer().then((value) => Buffer.from(value)),
    originalResponse.arrayBuffer().then((value) => Buffer.from(value)),
  ]);
  const webp = inspectWebp(webpBuffer);
  const gif = inspectGif(gifBuffer);

  const expectedWidth = imageInfo.width ?? gif.width;
  const expectedHeight = imageInfo.height ?? gif.height;
  if (
    webp.width !== expectedWidth
    || webp.height !== expectedHeight
    || gif.width !== expectedWidth
    || gif.height !== expectedHeight
  ) {
    throw new Error(`${entry.displayName}: source and optimized canvas dimensions differ`);
  }
  const durationToleranceMs = Math.max(20, Math.round(gif.durationMs * 0.01));
  const webpRetainsMotion = !gif.animated || webp.animated;
  const webpRetainsTiming = !gif.animated || gif.durationMs === 0
    || (webp.animated && Math.abs(webp.durationMs - gif.durationMs) <= durationToleranceMs);
  const preferredFormat = webpRetainsMotion && webpRetainsTiming ? "webp" : "gif";

  await Promise.all([
    writeFile(webpPath, webpBuffer),
    writeFile(gifPath, gifBuffer),
  ]);

  const sourceStem = entry.sourceFile.replace(/\.gif$/i, "").replace(/\s+Frame$/i, "");
  const aliases = [...new Set([
    entry.displayName,
    sourceStem,
    entry.sourceFile.replace(/\.gif$/i, ""),
  ])];

  return {
    name: entry.displayName,
    slug,
    aliases,
    sourceFile: entry.sourceFile,
    sourceUrl: imageInfo.sourceUrl,
    descriptionUrl: imageInfo.descriptionUrl,
    sha1: imageInfo.sha1,
    width: gif.width,
    height: gif.height,
    frameCount: gif.frameCount,
    durationMs: gif.durationMs,
    animated: gif.animated,
    optimizedFrameCount: webp.frameCount,
    optimizedDurationMs: webp.durationMs,
    preferredFormat,
    assets: {
      webp: `/images/loading-frames/${basename(webpPath)}`,
      gif: `/images/loading-frames/${basename(gifPath)}`,
    },
    bytes: {
      webp: webpBuffer.length,
      gif: gifBuffer.length,
    },
  };
}

await mkdir(OUTPUT_DIR, { recursive: true });

const [parsed, revisionQuery] = await Promise.all([
  fetchJson({
    action: "parse",
    page: WIKI_PAGE,
    prop: "wikitext",
  }),
  fetchJson({
    action: "query",
    titles: WIKI_PAGE,
    prop: "revisions",
    rvprop: "ids|timestamp",
  }),
]);
const wikitext = parsed.parse?.wikitext?.["*"] ?? "";
const galleryEntries = parseGalleryEntries(wikitext);
if (galleryEntries.length === 0) {
  throw new Error("No loading-frame gallery entries were found");
}

const imageInfoBySourceFile = await fetchImageInfo(galleryEntries.map((entry) => entry.sourceFile));
const frames = await mapConcurrent(galleryEntries, DOWNLOAD_CONCURRENCY, async (entry) => {
  const imageInfo = imageInfoBySourceFile.get(sourceKey(entry.sourceFile));
  if (!imageInfo) throw new Error(`Missing image metadata for ${entry.sourceFile}`);
  return downloadFrame(entry, imageInfo);
});

const expectedAssetNames = new Set(
  frames.flatMap((frame) => [
    basename(frame.assets.webp),
    basename(frame.assets.gif),
  ]),
);
for (const fileName of await readdir(OUTPUT_DIR)) {
  if (fileName === "manifest.json") continue;
  if (!expectedAssetNames.has(fileName) && /\.(?:gif|webp)$/i.test(fileName)) {
    await unlink(resolve(OUTPUT_DIR, fileName));
  }
}

const totals = frames.reduce((result, frame) => ({
  webpBytes: result.webpBytes + frame.bytes.webp,
  gifBytes: result.gifBytes + frame.bytes.gif,
  animated: result.animated + Number(frame.animated),
  gifFallbacks: result.gifFallbacks + Number(frame.preferredFormat === "gif"),
}), { webpBytes: 0, gifBytes: 0, animated: 0, gifFallbacks: 0 });
const revisionPage = Object.values(revisionQuery.query?.pages ?? {})[0];
const sourceRevision = revisionPage?.revisions?.[0] ?? null;

const manifest = {
  schemaVersion: 1,
  sourcePage: WIKI_PAGE_URL,
  sourceRevisionId: sourceRevision?.revid ?? null,
  sourceRevisionTimestamp: sourceRevision?.timestamp ?? null,
  frameCount: frames.length,
  animatedFrameCount: totals.animated,
  totals: {
    webpBytes: totals.webpBytes,
    gifBytes: totals.gifBytes,
  },
  frames,
};

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

const savings = totals.gifBytes > 0
  ? ((1 - totals.webpBytes / totals.gifBytes) * 100).toFixed(1)
  : "0.0";
console.log(
  `Synced ${frames.length} loading frames (${totals.animated} animated); `
  + `animated WebP is ${savings}% smaller than GIF `
  + `(${(totals.webpBytes / 1024 / 1024).toFixed(2)} MiB vs ${(totals.gifBytes / 1024 / 1024).toFixed(2)} MiB); `
  + `${totals.gifFallbacks} frame(s) require the GIF fallback.`,
);
