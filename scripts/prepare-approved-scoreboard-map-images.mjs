import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDir, "../../..");
const reviewPath = path.join(repositoryRoot, "dev", "prototypes", "scoreboard-map-image-review.json");
const destinationDir = path.join(repositoryRoot, "src", "frontend", "public", "images", "maps");

const review = JSON.parse(await readFile(reviewPath, "utf8"));
const approvedMaps = review.maps.filter((map) => map.status === "approved");

async function loadSource(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: { "User-Agent": "PaladinsCat scoreboard map asset builder" },
    });
    if (!response.ok) throw new Error(`Could not download ${source}: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  const sourcePath = path.resolve(repositoryRoot, source);
  await access(sourcePath);
  return sourcePath;
}

for (const map of approvedMaps) {
  if (!map.matchAsset || !map.approvedSource) {
    throw new Error(`${map.name} is approved without matchAsset and approvedSource fields.`);
  }

  const pngPath = path.join(destinationDir, `${map.matchAsset}.png`);
  const avifPath = path.join(destinationDir, `${map.matchAsset}.avif`);
  const source = await loadSource(map.approvedSource);

  await Promise.all([
    sharp(source).png({ compressionLevel: 9 }).toFile(pngPath),
    sharp(source).avif({ quality: 58, effort: 6 }).toFile(avifPath),
  ]);
  console.log(`prepared ${map.name} from ${map.approvedSource}`);
}

console.log(`prepared ${approvedMaps.length} approved scoreboard map image pair(s)`);
