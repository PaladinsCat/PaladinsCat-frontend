import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dataPath = fileURLToPath(new URL("../public/data/champion-data.json", import.meta.url));
const messagesPath = fileURLToPath(new URL("../lib/localization/catalog/game/champions.json", import.meta.url));
const EXPECTED_CHAMPION_COUNT = 59;
const EXPECTED_SKILL_COUNT = 295;

const slug = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const present = (value) => typeof value === "string" && value.trim().length > 0;

const data = JSON.parse(await readFile(dataPath, "utf8"));
const messages = JSON.parse(await readFile(messagesPath, "utf8"));
const errors = [];
const championSlugs = new Set();
let skillCount = 0;

for (const [storedSlug, champion] of Object.entries(data)) {
  const canonicalSlug = slug(champion?.name);
  if (!canonicalSlug || canonicalSlug !== storedSlug) {
    errors.push(`${storedSlug}: champion name does not resolve to its stored slug`);
  }
  if (championSlugs.has(canonicalSlug)) errors.push(`${storedSlug}: duplicate champion slug`);
  championSlugs.add(canonicalSlug);

  const skillSlugs = new Set();
  for (const skill of champion?.skills ?? []) {
    skillCount += 1;
    const skillSlug = slug(skill?.name);
    const label = `${storedSlug}.${skillSlug || "<unnamed>"}`;
    if (!present(skill?.name)) errors.push(`${label}: missing skill name`);
    if (!present(skill?.key)) errors.push(`${label}: missing skill key`);
    if (!present(skill?.description)) errors.push(`${label}: missing skill description`);
    if (skillSlugs.has(skillSlug)) errors.push(`${label}: duplicate skill slug`);
    skillSlugs.add(skillSlug);

    const messageKey = `champions.${storedSlug}.skills.${skillSlug}.description`;
    if (!present(messages[messageKey])) errors.push(`${label}: missing canonical English description (${messageKey})`);
  }

  for (const section of ["talents", "loadouts"]) {
    for (const entry of champion?.[section] ?? []) {
      const entrySlug = slug(entry?.name);
      if (!present(entry?.name)) errors.push(`${storedSlug}.${section}.<unnamed>: missing name`);
      if (!present(entry?.description)) errors.push(`${storedSlug}.${section}.${entrySlug}: missing description`);
    }
  }
}

if (Object.keys(data).length !== EXPECTED_CHAMPION_COUNT) {
  errors.push(`expected ${EXPECTED_CHAMPION_COUNT} champions, found ${Object.keys(data).length}`);
}
if (skillCount !== EXPECTED_SKILL_COUNT) {
  errors.push(`expected ${EXPECTED_SKILL_COUNT} skills, found ${skillCount}`);
}

if (errors.length > 0) {
  console.error(`Champion data audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Champion data audit passed: ${EXPECTED_CHAMPION_COUNT} champions, ${EXPECTED_SKILL_COUNT} complete skills.`);
}
