import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const write = process.argv.includes("--write");
const championPath = fileURLToPath(new URL("../public/data/champion-data.json", import.meta.url));
const cardPath = fileURLToPath(new URL("../public/data/paladins-card-reference.json", import.meta.url));
const talentPath = fileURLToPath(new URL("../public/data/paladins-talent-reference.json", import.meta.url));
const artworkPath = fileURLToPath(new URL("./champion-artwork-reference.json", import.meta.url));
const publicPath = fileURLToPath(new URL("../public", import.meta.url));

const [champions, cards, talents, artwork] = await Promise.all([
  readFile(championPath, "utf8").then(JSON.parse),
  readFile(cardPath, "utf8").then(JSON.parse),
  readFile(talentPath, "utf8").then(JSON.parse),
  readFile(artworkPath, "utf8").then(JSON.parse),
]);

const key = (value) => String(value ?? "")
  .normalize("NFKD")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

const cardIdOverrides = new Map(Object.entries({
  "kinessa:aftershock": 13246,
  "kinessa:eagleeye": 13155,
  "strix:guerillatactics": 19475,
  "tiberius:honedsense": 25172,
}));

const iconOverrides = new Map(Object.entries({
  "barik:talents:forgefire": "/images/champions/Talent Barik Architectonics.avif",
  "barik:talents:fortify": "/images/champions/Talent Barik Barricade.avif",
  "dredge:talents:hurl": "/images/champions/Talent Dredge AbyssSpike.avif",
  "dredge:talents:abyssspike": "/images/champions/Talent Dredge Hurl.avif",
  "kinessa:skills:sniperrifle": "/images/skills/WeaponAttack_Kinessa_Icon.png",
  "kinessa:loadouts:headstrong": "/images/cards/Card_Queen_of_the_Hill.avif",
  "kinessa:loadouts:aftershock": "/images/cards/Card_Octoppressor.avif",
  "skye:loadouts:shadowaffinity": "/images/cards/Card_Surprise_Attack.avif",
  "skye:loadouts:twilightarmor": "/images/cards/Card_Preparation.avif",
  "tiberius:talents:viciousassault": "/images/champions/Talent Tiberius TigronsFury.avif",
  "tiberius:talents:tigronsfury": "/images/champions/Talent Tiberius ViciousAssault.avif",
  "tyra:skills:autorifle": "/images/skills/WeaponAttack_Tyra_Icon.png",
  "vii:skills:heavysmg": "/images/skills/WeaponAttack_VII_Burst_Icon.png",
}));

const errors = [];
const setExpected = (object, field, expected, label) => {
  if (write) {
    object[field] = expected;
  } else if (object[field] !== expected) {
    errors.push(`${label}.${field}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(object[field])}`);
  }
};

const talentById = new Map(talents.map((row) => [Number(row.id), row]));
const cardById = new Map(cards.map((row) => [Number(row.id), row]));
const cardsByChampionAndName = new Map(
  cards.map((row) => [`${Number(row.championId)}:${key(row.name)}`, row]),
);
const championIdByName = new Map(
  talents.map((row) => [key(row.championName), Number(row.championId)]),
);
const assignedCardIds = new Set();

for (const [championSlug, champion] of Object.entries(champions)) {
  const championId = championIdByName.get(key(champion.name));
  if (!Number.isInteger(championId) || championId <= 0) {
    errors.push(`${championSlug}: no stable champion ID in talent reference`);
    continue;
  }

  for (const section of ["skills", "talents", "loadouts"]) {
    for (const entry of champion[section] ?? []) {
      const override = iconOverrides.get(`${championSlug}:${section}:${key(entry.name)}`);
      if (override) setExpected(entry, "iconUrl", override, `${championSlug}.${section}.${entry.name}`);
    }
  }

  for (const talent of champion.talents ?? []) {
    const reference = talentById.get(Number(talent.id));
    const label = `${championSlug}.talents.${talent.id}`;
    if (!reference) {
      errors.push(`${label}: missing talent reference`);
      continue;
    }
    setExpected(reference, "name", talent.name, label);
    setExpected(reference, "description", talent.description, label);
    setExpected(reference, "shortDescription", talent.description, label);
    setExpected(reference, "championId", championId, label);
    setExpected(reference, "championName", champion.name, label);
    setExpected(reference, "iconUrl", talent.iconUrl, label);
    setExpected(reference, "source", "champion-data-canonical", label);
  }

  for (const card of champion.loadouts ?? []) {
    const label = `${championSlug}.loadouts.${card.name}`;
    const overrideId = cardIdOverrides.get(`${championSlug}:${key(card.name)}`);
    const existingId = Number(card.id);
    const namedReference = cardsByChampionAndName.get(`${championId}:${key(card.name)}`);
    const cardId = Number.isInteger(existingId) && existingId > 0
      ? existingId
      : overrideId ?? Number(namedReference?.id);
    const reference = cardById.get(cardId);
    if (!Number.isInteger(cardId) || cardId <= 0 || !reference) {
      errors.push(`${label}: no stable card ID/reference`);
      continue;
    }
    if (assignedCardIds.has(cardId)) errors.push(`${label}: duplicate card ID ${cardId}`);
    assignedCardIds.add(cardId);
    setExpected(card, "id", cardId, label);
    setExpected(reference, "name", card.name, label);
    setExpected(reference, "description", card.description, label);
    setExpected(reference, "shortDescription", card.description, label);
    setExpected(reference, "championId", championId, label);
    setExpected(reference, "iconUrl", card.iconUrl, label);
    setExpected(reference, "source", "champion-data-canonical", label);
  }
}

if (assignedCardIds.size !== 944) {
  errors.push(`expected 944 unique current card IDs, found ${assignedCardIds.size}`);
}

for (const reference of artwork) {
  const entry = champions[reference.champion]?.[reference.section]
    ?.find((row) => row.name === reference.name);
  const label = `${reference.champion}.${reference.section}.${reference.name}`;
  if (!entry) {
    errors.push(`${label}: artwork target is missing`);
    continue;
  }
  if (entry.iconUrl !== reference.iconUrl) {
    errors.push(`${label}.iconUrl: expected ${reference.iconUrl}, found ${entry.iconUrl}`);
  }
  const stem = reference.iconUrl.replace(/^\/images\//, "images/").replace(/\.(?:avif|png)$/i, "");
  for (const extension of ["png", "avif"]) {
    const bytes = await readFile(`${publicPath}/${stem}.${extension}`).catch(() => null);
    if (!bytes) {
      errors.push(`${label}: missing ${extension.toUpperCase()} artwork`);
      continue;
    }
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== reference[`${extension}Sha256`]) {
      errors.push(`${label}: ${extension.toUpperCase()} artwork hash changed`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Champion reference parity failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else if (write) {
  await Promise.all([
    writeFile(championPath, `${JSON.stringify(champions, null, 2)}\n`),
    writeFile(cardPath, `${JSON.stringify(cards, null, 2)}\n`),
    writeFile(talentPath, `${JSON.stringify(talents, null, 2)}\n`),
  ]);
  console.log("Synchronized champion IDs, artwork, names, and descriptions.");
} else {
  console.log("Champion reference parity passed for 177 talents, 944 loadout cards, and 13 audited artwork mappings.");
}
