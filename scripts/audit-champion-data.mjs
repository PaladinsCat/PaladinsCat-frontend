import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(new URL("../public/data/champion-data.json", import.meta.url));
const messagesPath = fileURLToPath(new URL("../lib/localization/catalog/game/champions.json", import.meta.url));
const EXPECTED_CHAMPION_COUNT = 59;
const EXPECTED_COUNTS = {
  skills: 295,
  talents: 177,
  loadouts: 944,
};
const EXPECTED_PER_CHAMPION = {
  skills: 5,
  talents: 3,
  loadouts: 16,
};

const slug = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const present = (value) => typeof value === "string" && value.trim().length > 0;
const normalized = (value) => String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();

const data = JSON.parse(await readFile(dataPath, "utf8"));
const messages = JSON.parse(await readFile(messagesPath, "utf8"));
const errors = [];
const championSlugs = new Set();
const counts = { skills: 0, talents: 0, loadouts: 0 };

for (const [storedSlug, champion] of Object.entries(data)) {
  const canonicalSlug = slug(champion?.name);
  if (!canonicalSlug || canonicalSlug !== storedSlug) {
    errors.push(`${storedSlug}: champion name does not resolve to its stored slug`);
  }
  if (championSlugs.has(canonicalSlug)) errors.push(`${storedSlug}: duplicate champion slug`);
  championSlugs.add(canonicalSlug);

  for (const section of ["skills", "talents", "loadouts"]) {
    const entries = champion?.[section] ?? [];
    const entrySlugs = new Set();
    counts[section] += entries.length;
    if (entries.length !== EXPECTED_PER_CHAMPION[section]) {
      errors.push(
        `${storedSlug}.${section}: expected ${EXPECTED_PER_CHAMPION[section]} entries, found ${entries.length}`,
      );
    }
    for (const entry of entries) {
      const entrySlug = slug(entry?.name);
      const label = `${storedSlug}.${section}.${entrySlug || "<unnamed>"}`;
      if (!present(entry?.name)) errors.push(`${label}: missing name`);
      if (section === "skills" && !present(entry?.key)) errors.push(`${label}: missing skill key`);
      if (!present(entry?.description)) errors.push(`${label}: missing description`);
      if (entrySlugs.has(entrySlug)) errors.push(`${label}: duplicate entry slug`);
      entrySlugs.add(entrySlug);

      const messageKey = `champions.${storedSlug}.${section}.${entrySlug}.description`;
      if (!present(messages[messageKey])) {
        errors.push(`${label}: missing canonical English description (${messageKey})`);
      } else if (normalized(messages[messageKey]) !== normalized(entry?.description)) {
        errors.push(`${label}: canonical data and English catalog descriptions differ`);
      }
    }
  }
}

if (Object.keys(data).length !== EXPECTED_CHAMPION_COUNT) {
  errors.push(`expected ${EXPECTED_CHAMPION_COUNT} champions, found ${Object.keys(data).length}`);
}
for (const [section, expected] of Object.entries(EXPECTED_COUNTS)) {
  if (counts[section] !== expected) {
    errors.push(`expected ${expected} ${section}, found ${counts[section]}`);
  }
}

if (errors.length > 0) {
  console.error(`Champion data audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Champion data audit passed: ${EXPECTED_CHAMPION_COUNT} champions, `
    + `${counts.skills} skills, ${counts.talents} talents, and ${counts.loadouts} loadout cards.`,
  );
}
