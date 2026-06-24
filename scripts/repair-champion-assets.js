const fs = require("fs");
const path = require("path");

const frontendRoot = path.resolve(__dirname, "..");
const publicRoot = path.join(frontendRoot, "public");
const dataPath = path.join(publicRoot, "data", "champion-data.json");
const cardsDir = path.join(publicRoot, "images", "cards");
const championsDir = path.join(publicRoot, "images", "champions");
const wikiCardsDir = path.resolve(frontendRoot, "..", "..", "dev", "paladins-wiki", "images", "cards");

const COPY_FROM_WIKI = [
  "Card_Resuscitate.png",
  "Card_Unstable.png",
  "Card_Victory_Rush.png",
];

// Legacy Paladins card/talent names sometimes reuse art from an older card
// name. Keep the displayed name from champion-data.json, but point the icon at
// the local file that the archived wiki page uses. This is why Bully can render
// Card_Cull_the_Weak art while still being listed and matched as Bully.
const CARD_ICON_ALIASES = new Map([
  ["bully", "Card_Cull_the_Weak.avif"],
  ["decrepify", "Card_Diminish.avif"],
  ["pepinthestep", "Card_Disinfect.avif"],
  ["sturdy", "Card_Undying.avif"],
  ["dissipate", "Card_Endure.avif"],
  ["poisoner", "Card_Pollute.avif"],
  ["quicksmoker", "Card_Acid_Cloud.avif"],
  ["specter", "Card_Backstab.avif"],
  ["shadowaffinity", "Card_Affinity.avif"],
  ["twilightarmor", "Card_Twilight.avif"],
  ["victoryrush", "Card_Victory_Rush.png"],
  ["unstable", "Card_Unstable.png"],
  ["bladedancer", "Card_Blade_Dance.avif"],
]);

const TALENT_ICON_ALIASES = new Map([
  ["seris:resuscitate", "/images/cards/Card_Resuscitate.png"],
]);

function looseKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function publicPathFor(file, folder) {
  return `/images/${folder}/${file}`.replace(/\\/g, "/");
}

function ensureCopiedWikiAssets() {
  if (!fs.existsSync(wikiCardsDir)) return;
  for (const file of COPY_FROM_WIKI) {
    const source = path.join(wikiCardsDir, file);
    const target = path.join(cardsDir, file);
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.copyFileSync(source, target);
    }
  }
}

function buildAssetIndex(dir, folder) {
  const index = new Map();
  if (!fs.existsSync(dir)) return index;
  const files = fs
    .readdirSync(dir)
    .filter((file) => /\.(avif|png|jpe?g|webp)$/i.test(file))
    .sort((a, b) => {
      const avifA = a.toLowerCase().endsWith(".avif") ? 0 : 1;
      const avifB = b.toLowerCase().endsWith(".avif") ? 0 : 1;
      return avifA - avifB || a.localeCompare(b);
    });
  for (const file of files) {
    const stem = file.replace(/\.(avif|png|jpe?g|webp)$/i, "");
    if (!index.has(looseKey(stem))) {
      index.set(looseKey(stem), publicPathFor(file, folder));
    }
  }
  return index;
}

function escapeNonAscii(json) {
  return json.replace(/[^\x00-\x7F]/g, (char) => {
    return char
      .split("")
      .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`)
      .join("");
  });
}
function pathExists(publicPath) {
  return Boolean(publicPath && fs.existsSync(path.join(publicRoot, publicPath.replace(/^\//, ""))));
}

function resolveCardIcon(cardName, cardIndex) {
  const key = looseKey(cardName);
  const alias = CARD_ICON_ALIASES.get(key);
  if (alias) return publicPathFor(alias, "cards");

  const candidates = [
    `Card_${cardName}`,
    `Card ${cardName}`,
    cardName,
  ].map(looseKey);
  for (const candidate of candidates) {
    const hit = cardIndex.get(candidate);
    if (hit) return hit;
  }
  return null;
}

function resolveTalentIcon(championName, talentName, talentIndex) {
  const alias = TALENT_ICON_ALIASES.get(`${looseKey(championName)}:${looseKey(talentName)}`);
  if (alias) return alias;

  const candidates = [
    `Talent ${championName} ${talentName}`,
    `Talent_${championName}_${talentName}`,
    talentName,
  ].map(looseKey);
  for (const candidate of candidates) {
    const hit = talentIndex.get(candidate);
    if (hit) return hit;
  }
  return null;
}

function main() {
  ensureCopiedWikiAssets();

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const cardIndex = buildAssetIndex(cardsDir, "cards");
  const talentIndex = buildAssetIndex(championsDir, "champions");

  const report = {
    champions: 0,
    talents: 0,
    cards: 0,
    updatedTalents: 0,
    updatedCards: 0,
    missingTalents: [],
    missingCards: [],
  };

  for (const champion of Object.values(data)) {
    report.champions += 1;
    for (const talent of champion.talents || []) {
      report.talents += 1;
      if (pathExists(talent.iconUrl)) continue;
      const icon = resolveTalentIcon(champion.name, talent.name, talentIndex);
      if (icon && pathExists(icon)) {
        talent.iconUrl = icon;
        report.updatedTalents += 1;
      } else {
        report.missingTalents.push(`${champion.name}: ${talent.name}`);
      }
    }

    for (const card of champion.loadouts || []) {
      report.cards += 1;
      if (pathExists(card.iconUrl)) continue;
      const icon = resolveCardIcon(card.name, cardIndex);
      if (icon && pathExists(icon)) {
        card.iconUrl = icon;
        report.updatedCards += 1;
      } else {
        report.missingCards.push(`${champion.name}: ${card.name}`);
      }
    }
  }

  fs.writeFileSync(dataPath, `${escapeNonAscii(JSON.stringify(data, null, 2))}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (report.missingTalents.length > 0 || report.missingCards.length > 0) {
    process.exitCode = 1;
  }
}

main();
