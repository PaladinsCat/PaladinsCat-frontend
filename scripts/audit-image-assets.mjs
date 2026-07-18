import { execFileSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const root = resolve(process.cwd(), "public", "images");
const assetExtensions = new Set([".avif", ".png"]);
const assets = new Map();

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      return;
    }

    const extension = extname(entry.name).toLowerCase();
    if (!assetExtensions.has(extension)) return;

    const base = path.slice(0, -extension.length);
    const record = assets.get(base) ?? {};
    assets.set(base, record);
    record[extension.slice(1)] = { path, size: (await stat(path)).size };
  }));
}

await walk(root);

const missing = [];
const caseMismatches = [];
let avifBytes = 0;
let pngBytes = 0;
let avifSmaller = 0;
let pngSmaller = 0;

// Windows resolves paths case-insensitively, so the filesystem walk alone
// cannot detect PNG/AVIF pairs whose casing differs in Git. Linux deploys see
// those as separate assets and fail the fallback audit. Compare tracked path
// spellings when repository metadata is available; Docker builds without
// `.git` still retain the filesystem checks below.
try {
  const trackedPaths = execFileSync("git", ["ls-files", "-z", "--", "public/images"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).split("\0").filter(Boolean);
  const trackedBases = new Map();

  for (const path of trackedPaths) {
    const extension = extname(path).toLowerCase();
    if (!assetExtensions.has(extension)) continue;
    const base = path.slice(0, -extension.length);
    const key = base.toLowerCase();
    const spellings = trackedBases.get(key) ?? new Set();
    spellings.add(base);
    trackedBases.set(key, spellings);
  }

  for (const spellings of trackedBases.values()) {
    if (spellings.size > 1) caseMismatches.push([...spellings].join(" <> "));
  }
} catch {
  // Git metadata is optional in production image-build contexts.
}

for (const [base, pair] of assets) {
  const label = relative(root, base).replaceAll("\\", "/");
  if (!pair.avif) missing.push(`${label}.avif`);
  if (!pair.png) missing.push(`${label}.png`);
  if (!pair.avif || !pair.png) continue;

  avifBytes += pair.avif.size;
  pngBytes += pair.png.size;
  if (pair.avif.size <= pair.png.size) avifSmaller += 1;
  else pngSmaller += 1;
}

if (missing.length > 0 || caseMismatches.length > 0) {
  if (caseMismatches.length > 0) {
    console.error(`${caseMismatches.length} tracked image basename casing mismatch(es):`);
    for (const mismatch of caseMismatches) console.error(mismatch);
  }
  if (missing.length > 0) {
    console.error(`${missing.length} image fallback asset(s) missing:`);
    for (const path of missing) console.error(`public/images/${path}`);
  }
  process.exitCode = 1;
} else {
  const savings = pngBytes > 0 ? ((1 - avifBytes / pngBytes) * 100).toFixed(1) : "0.0";
  console.log(
    `Image asset audit passed: ${assets.size} AVIF/PNG pairs; `
    + `AVIF total ${savings}% smaller (${avifSmaller} AVIF-smaller, ${pngSmaller} PNG-smaller).`,
  );
}
