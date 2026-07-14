const fs = require("fs");
const path = require("path");

const PUBLIC_DATA = path.resolve(__dirname, "../public/data");
const CHAMPION_DATA_PATH = path.join(PUBLIC_DATA, "champion-data.json");
const TALENT_REFERENCE_PATH = path.join(PUBLIC_DATA, "paladins-talent-reference.json");

function identity(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const championData = JSON.parse(fs.readFileSync(CHAMPION_DATA_PATH, "utf8"));
const talentReference = JSON.parse(fs.readFileSync(TALENT_REFERENCE_PATH, "utf8"));
const referencesByChampion = new Map();

function serialize(value) {
  return JSON.stringify(value, null, 2)
    .replace(/’/g, "\\u2019")
    .replace(/×/g, "\\u00d7")
    .replace(/—/g, "\\u2014");
}

for (const reference of talentReference) {
  const key = identity(reference.championName);
  if (!key) continue;
  referencesByChampion.set(key, [...(referencesByChampion.get(key) || []), reference]);
}

let synced = 0;
for (const champion of Object.values(championData)) {
  const talents = champion.talents || [];
  const references = referencesByChampion.get(identity(champion.name)) || [];
  const assignedIds = new Set();
  const unresolved = [];

  for (const talent of talents) {
    const matches = references.filter((reference) => identity(reference.name) === identity(talent.name));
    if (matches.length === 1) {
      talent.id = Number(matches[0].id);
      matches[0].iconUrl = talent.iconUrl;
      assignedIds.add(talent.id);
      synced += 1;
    } else {
      unresolved.push(talent);
    }
  }

  // Punctuation/display-name changes can make an exact text match impossible.
  // Resolve them structurally only when the remaining current talent and ID
  // form an unambiguous one-to-one pair for the same champion.
  const remainingReferences = references.filter((reference) => !assignedIds.has(Number(reference.id)));
  if (unresolved.length === 1 && remainingReferences.length === 1) {
    unresolved[0].id = Number(remainingReferences[0].id);
    remainingReferences[0].iconUrl = unresolved[0].iconUrl;
    synced += 1;
    unresolved.length = 0;
  }

  if (unresolved.length > 0) {
    throw new Error(`Could not assign canonical talent IDs for ${champion.name}: ${unresolved.map((talent) => talent.name).join(", ")}`);
  }
}

const talents = Object.values(championData).flatMap((champion) => champion.talents || []);
const ids = talents.map((talent) => Number(talent.id));
if (synced !== talents.length || ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
  throw new Error(`Canonical talent ID audit failed: synced=${synced}, talents=${talents.length}, uniqueIds=${new Set(ids).size}`);
}

fs.writeFileSync(CHAMPION_DATA_PATH, `${serialize(championData)}\n`);
fs.writeFileSync(TALENT_REFERENCE_PATH, `${serialize(talentReference)}\n`);
console.log(`Synced ${synced} canonical champion talent IDs and image URLs.`);
