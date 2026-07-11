/*
 * Builds stable public map artwork from the official wiki's loading-card art.
 *
 * Each entry gets a PNG fallback plus an AVIF derivative so SmartImage can
 * prefer AVIF without leaving older browsers or failed conversions blank.
 * Run: node scripts/prepare-map-images.js
 */
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "../../..");
const destinationDir = path.join(root, "src", "frontend", "public", "images", "maps");

const images = [
  ["Ranked_Ascension_Peak", "https://static.wikia.nocookie.net/paladins_gamepedia/images/3/38/Loading_AscensionPeak.png/revision/latest?cb=20180210174622"],
  ["Ranked_Bazaar", "https://static.wikia.nocookie.net/paladins_gamepedia/images/e/ea/Loading_Bazaar.png/revision/latest?cb=20190507192056"],
  ["Ranked_Brightmarsh", "https://static.wikia.nocookie.net/paladins_gamepedia/images/d/db/Loading_Atrium.png/revision/latest?cb=20170504114439"],
  ["Ranked_Frog_Isle", "https://static.wikia.nocookie.net/paladins_gamepedia/images/7/72/Loading_Isle.png/revision/latest?cb=20200216202446"],
  ["Ranked_Ice_Mines", "https://static.wikia.nocookie.net/paladins_gamepedia/images/b/b2/Loading_NRMines.png/revision/latest?cb=20190817013544"],
  ["Ranked_Jaguar_Falls", "https://static.wikia.nocookie.net/paladins_gamepedia/images/1/13/Loading_Jaguar_Falls.png/revision/latest?cb=20220703100404"],
  ["Ranked_Serpent_Beach", "https://static.wikia.nocookie.net/paladins_gamepedia/images/7/7e/Loading_BeachV2.png/revision/latest?cb=20250131131745"],
  ["Ranked_Splitstone_Quarry", "https://static.wikia.nocookie.net/paladins_gamepedia/images/4/44/Loading_Quarry.png/revision/latest?cb=20170722155850"],
  ["Ranked_Stone_Keep_Classic", "https://static.wikia.nocookie.net/paladins_gamepedia/images/6/6a/Loading_Castle.png/revision/latest?cb=20210831172847"],
  ["Ranked_Stone_Keep_V2_Night", "https://static.wikia.nocookie.net/paladins_gamepedia/images/6/6a/Loading_Castle.png/revision/latest?cb=20210831172847"],
  ["Ranked_Warders_Gate", "https://static.wikia.nocookie.net/paladins_gamepedia/images/2/2b/Loading_DragonSiege.png/revision/latest?cb=20220225193429"],
];

async function main() {
  await fs.mkdir(destinationDir, { recursive: true });
  for (const [name, sourceUrl] of images) {
    const png = path.join(destinationDir, `${name}.png`);
    const avif = path.join(destinationDir, `${name}.avif`);
    const response = await fetch(sourceUrl, { headers: { "User-Agent": "PaladinsCat asset builder" } });
    if (!response.ok) throw new Error(`Could not download ${sourceUrl}: ${response.status}`);
    const source = Buffer.from(await response.arrayBuffer());
    await sharp(source).png({ compressionLevel: 9 }).toFile(png);
    await sharp(source).avif({ quality: 58, effort: 6 }).toFile(avif);
    console.log(`prepared ${name}`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
