import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const API_URL = "https://paladins.fandom.com/api.php";
const USER_AGENT = "PaladinsCatChampionAudit/1.0 (https://paladinscat.com)";
const WRITE = process.argv.includes("--write");
const dataPath = fileURLToPath(new URL("../public/data/champion-data.json", import.meta.url));
const messagesPath = fileURLToPath(new URL("../lib/localization/catalog/game/champions.json", import.meta.url));
const reportPath = fileURLToPath(new URL("../../../dev/data/champion-wiki-audit.json", import.meta.url));
const EXPECTED = { champions: 59, skills: 295, talents: 177, cards: 944 };

const championData = JSON.parse(await readFile(dataPath, "utf8"));
const messages = JSON.parse(await readFile(messagesPath, "utf8"));

function slug(value) {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function entrySlug(value) {
  // Fandom currently spells Io's talent as “Goddess’ Blessing”, while the
  // Hi-Rez data uses “Goddess's Blessing”. Treat that possessive variation as
  // the same entry without changing stable localization keys.
  return slug(String(value ?? "").replace(/[’‘]/g, "'").replace(/s's\b/gi, "s'"));
}

function wikiChampionName(name) {
  return slug(name) === "vii" ? "VII" : name;
}

function cardCategoryName(championName) {
  if (championName === "Drogoz") return "Drogoz' Cards";
  if (championName === "Tiberius") return "Tiberius's Cards";
  return `${championName}${championName.toLowerCase().endsWith("s") ? "'" : "'s"} Cards`;
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function splitTopLevel(value, delimiter = "|") {
  const parts = [];
  let current = "";
  let templateDepth = 0;
  let linkDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const pair = value.slice(index, index + 2);
    if (pair === "{{") {
      templateDepth += 1;
      current += pair;
      index += 1;
      continue;
    }
    if (pair === "}}" && templateDepth > 0) {
      templateDepth -= 1;
      current += pair;
      index += 1;
      continue;
    }
    if (pair === "[[") {
      linkDepth += 1;
      current += pair;
      index += 1;
      continue;
    }
    if (pair === "]]" && linkDepth > 0) {
      linkDepth -= 1;
      current += pair;
      index += 1;
      continue;
    }
    if (value[index] === delimiter && templateDepth === 0 && linkDepth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += value[index];
  }
  parts.push(current);
  return parts;
}

function extractTemplateBlocks(wikitext, templateName) {
  const blocks = [];
  const source = wikitext.toLowerCase();
  const needle = `{{${templateName.toLowerCase()}`;
  let cursor = 0;
  while (cursor < wikitext.length) {
    const start = source.indexOf(needle, cursor);
    if (start < 0) break;
    const boundary = source[start + needle.length] ?? "";
    if (boundary && !/[\s|}]/.test(boundary)) {
      cursor = start + needle.length;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let index = start; index < wikitext.length - 1; index += 1) {
      const pair = wikitext.slice(index, index + 2);
      if (pair === "{{") {
        depth += 1;
        index += 1;
      } else if (pair === "}}") {
        depth -= 1;
        index += 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }
    if (end < 0) throw new Error(`Unclosed {{${templateName}}} template`);
    blocks.push(wikitext.slice(start, end));
    cursor = end;
  }
  return blocks;
}

function parseTemplate(block) {
  const inner = block.slice(2, -2);
  const parts = splitTopLevel(inner);
  const name = parts.shift()?.trim() ?? "";
  const fields = {};
  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim().toLowerCase();
    fields[key] = part.slice(separator + 1).trim();
  }
  return { name, fields };
}

function renderSimpleTemplate(block) {
  const inner = block.slice(2, -2);
  const parts = splitTopLevel(inner);
  const name = parts.shift()?.trim().toLowerCase() ?? "";
  const positional = parts.filter((part) => !part.includes("=")).map((part) => part.trim());
  if (name === "!") return "|";
  if (name === "space") return " ";
  if (["control", "tt", "tooltip", "abbr", "color"].includes(name)) return positional[0] ?? "";
  if (name === "icon" || name.endsWith("icon")) return "";
  return positional[0] ?? "";
}

function cleanWikiText(value) {
  let text = String(value ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<br\s*\/?>/gi, " ");

  // Resolve innermost display helpers first. Card scaling syntax uses single
  // braces and remains intact, including {40{{!}}40} -> {40|40}.
  for (let pass = 0; pass < 12 && text.includes("{{"); pass += 1) {
    const next = text.replace(/\{\{([^{}]*)\}\}/g, (block) => renderSimpleTemplate(block));
    if (next === text) break;
    text = next;
  }

  text = text
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/'{2,5}/g, "")
    .replace(/\u00a0/g, " ");
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function normalizedDescription(value) {
  return cleanWikiText(value).normalize("NFKC");
}

async function fetchApi(params, attempt = 1) {
  const query = new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params });
  const response = await fetch(`${API_URL}?${query}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if ((!response.ok || response.status === 429) && attempt < 4) {
    await new Promise((resolve) => setTimeout(resolve, 400 * (2 ** attempt)));
    return fetchApi(params, attempt + 1);
  }
  if (!response.ok) throw new Error(`Fandom API returned ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`Fandom API error: ${payload.error.info ?? payload.error.code}`);
  return payload;
}

async function mapConcurrent(values, concurrency, mapper) {
  const results = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

async function fetchWikitextPages(titles) {
  const pages = new Map();
  const chunks = [];
  for (let index = 0; index < titles.length; index += 40) chunks.push(titles.slice(index, index + 40));
  await mapConcurrent(chunks, 3, async (chunk) => {
    const payload = await fetchApi({
      action: "query",
      prop: "revisions",
      rvprop: "ids|timestamp|content",
      rvslots: "main",
      redirects: "1",
      titles: chunk.join("|"),
    });
    for (const page of payload.query?.pages ?? []) {
      const revision = page.revisions?.[0];
      const content = revision?.slots?.main?.content;
      if (page.missing || typeof content !== "string") throw new Error(`Missing wiki page: ${page.title}`);
      pages.set(slug(page.title), {
        title: page.title,
        revisionId: revision.revid,
        timestamp: revision.timestamp,
        wikitext: content,
      });
    }
  });
  return pages;
}

async function fetchChampionCardTitles(championName) {
  const category = cardCategoryName(championName);
  const payload = await fetchApi({
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${category}`,
    cmnamespace: "0",
    cmlimit: "100",
  });
  return {
    category,
    titles: (payload.query?.categorymembers ?? []).map((member) => member.title),
  };
}

function entriesByName(entries) {
  return new Map(entries.map((entry) => [entrySlug(entry.name), entry]));
}

function descriptionKey(championName, section, entryName) {
  return `champions.${slug(championName)}.${section}.${slug(entryName)}.description`;
}

const championEntries = Object.values(championData);
if (championEntries.length !== EXPECTED.champions) {
  throw new Error(`Expected ${EXPECTED.champions} local champions, found ${championEntries.length}`);
}

console.log(`Fetching ${championEntries.length} champion pages from the Paladins Wiki...`);
const wikiNames = championEntries.map((champion) => wikiChampionName(champion.name));
const championPages = await fetchWikitextPages(wikiNames);

console.log("Resolving active card categories...");
const cardCategories = await mapConcurrent(wikiNames, 4, fetchChampionCardTitles);
const allCardTitles = cardCategories.flatMap((category) => category.titles);
if (allCardTitles.length !== EXPECTED.cards) {
  const unexpected = cardCategories
    .filter((category) => category.titles.length !== 16)
    .map((category) => `${category.category} (${category.titles.length})`)
    .join(", ");
  if (unexpected) console.error(`Unexpected card categories: ${unexpected}`);
  throw new Error(`Expected ${EXPECTED.cards} active wiki cards, found ${allCardTitles.length}`);
}
console.log(`Fetching ${allCardTitles.length} active card pages...`);
const cardPages = await fetchWikitextPages(allCardTitles);

const wikiDataset = {};
const discrepancies = [];
const coverage = { champions: championEntries.length, skills: 0, talents: 0, cards: 0 };
const sectionChanges = { skills: 0, talents: 0, loadouts: 0 };
const reportChampions = [];

for (let championIndex = 0; championIndex < championEntries.length; championIndex += 1) {
  const local = championEntries[championIndex];
  const wikiName = wikiNames[championIndex];
  const page = championPages.get(slug(wikiName));
  if (!page) throw new Error(`Wiki page was not returned for ${wikiName}`);

  const skills = extractTemplateBlocks(page.wikitext, "AbilityInfo")
    .map(parseTemplate)
    .map(({ fields }) => ({
      name: cleanWikiText(fields.name),
      description: cleanWikiText(fields.description),
    }))
    .filter((entry) => entry.name && entry.description);
  const talents = extractTemplateBlocks(page.wikitext, "Talents")
    .map(parseTemplate)
    .map(({ fields }) => ({
      name: cleanWikiText(fields.name),
      description: cleanWikiText(fields.description),
    }))
    .filter((entry) => entry.name && entry.description);

  const category = cardCategories[championIndex];
  const cards = category.titles.map((title) => {
    const cardPage = cardPages.get(slug(title));
    if (!cardPage) throw new Error(`Card page was not returned for ${title}`);
    const templates = extractTemplateBlocks(cardPage.wikitext, "CardsOB67").map(parseTemplate);
    if (templates.length !== 1) throw new Error(`${title}: expected one CardsOB67 template, found ${templates.length}`);
    const fields = templates[0].fields;
    return {
      name: cleanWikiText(fields.name || title),
      description: cleanWikiText(fields.description),
      revisionId: cardPage.revisionId,
      timestamp: cardPage.timestamp,
    };
  });

  const expectedCounts = { skills: 5, talents: 3, cards: 16 };
  for (const [section, expected] of Object.entries(expectedCounts)) {
    const actual = section === "skills" ? skills.length : section === "talents" ? talents.length : cards.length;
    if (actual !== expected) discrepancies.push(`${local.name}: expected ${expected} ${section}, wiki has ${actual}`);
  }

  const sections = [
    ["skills", local.skills ?? [], skills],
    ["talents", local.talents ?? [], talents],
    ["loadouts", local.loadouts ?? [], cards],
  ];
  for (const [section, localEntries, wikiEntries] of sections) {
    const localByName = entriesByName(localEntries);
    const wikiByName = entriesByName(wikiEntries);
    for (const wikiEntry of wikiEntries) {
      const localEntry = localByName.get(entrySlug(wikiEntry.name));
      if (!localEntry) {
        discrepancies.push(`${local.name}.${section}: missing local entry "${wikiEntry.name}"`);
        continue;
      }
      const localDescription = normalizedDescription(localEntry.description);
      const wikiDescription = normalizedDescription(wikiEntry.description);
      if (localDescription !== wikiDescription) {
        discrepancies.push(
          `${local.name}.${section}.${wikiEntry.name}\n`
          + `  local: ${localDescription}\n`
          + `  wiki:  ${wikiDescription}`,
        );
        sectionChanges[section] += 1;
        if (WRITE) localEntry.description = wikiDescription;
      }
      const key = descriptionKey(local.name, section, localEntry.name);
      if (!(key in messages)) {
        discrepancies.push(`${local.name}.${section}.${wikiEntry.name}: missing English catalog key ${key}`);
      } else if (normalizedDescription(messages[key]) !== wikiDescription) {
        discrepancies.push(
          `${key}\n`
          + `  local: ${normalizedDescription(messages[key])}\n`
          + `  wiki:  ${wikiDescription}`,
        );
        if (WRITE) messages[key] = wikiDescription;
      }
    }
    for (const localEntry of localEntries) {
      if (!wikiByName.has(entrySlug(localEntry.name))) {
        discrepancies.push(`${local.name}.${section}: local entry "${localEntry.name}" is not active on the wiki`);
      }
    }
  }

  coverage.skills += skills.length;
  coverage.talents += talents.length;
  coverage.cards += cards.length;
  wikiDataset[slug(local.name)] = { name: local.name, skills, talents, cards };
  reportChampions.push({
    name: local.name,
    wikiPage: page.title,
    revisionId: page.revisionId,
    revisionTimestamp: page.timestamp,
    category: category.category,
    skills: skills.length,
    talents: talents.length,
    cards: cards.length,
  });
}

for (const [key, expected] of Object.entries(EXPECTED)) {
  if (coverage[key] !== expected) discrepancies.push(`Coverage mismatch: ${key} expected ${expected}, found ${coverage[key]}`);
}

const report = {
  auditedAt: new Date().toISOString(),
  source: "https://paladins.fandom.com/wiki/",
  sourceApi: API_URL,
  coverage,
  expected: EXPECTED,
  wikiDatasetSha256: createHash("sha256").update(JSON.stringify(wikiDataset)).digest("hex"),
  discrepanciesBeforeWrite: discrepancies.length,
  canonicalDescriptionChanges: sectionChanges,
  discrepancies,
  champions: reportChampions,
};

if (WRITE) {
  await Promise.all([
    writeFile(dataPath, `${JSON.stringify(championData, null, 2)}\n`),
    writeFile(messagesPath, `${JSON.stringify(messages, null, 2)}\n`),
    writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`),
  ]);
}

if (discrepancies.length > 0 && !WRITE) {
  console.error(`Champion wiki audit failed with ${discrepancies.length} discrepancy record(s):`);
  const visibleDiscrepancies = discrepancies.slice(0, 120);
  for (const discrepancy of visibleDiscrepancies) console.error(`- ${discrepancy}`);
  if (discrepancies.length > visibleDiscrepancies.length) {
    console.error(`... ${discrepancies.length - visibleDiscrepancies.length} more discrepancy record(s) omitted.`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Champion wiki audit ${WRITE ? "synchronized" : "verified"}: ${coverage.champions} champions, `
    + `${coverage.skills} skills, ${coverage.talents} talents, ${coverage.cards} cards.`,
  );
  if (WRITE) {
    console.log(`Corrected ${sectionChanges.skills} skill, ${sectionChanges.talents} talent, and ${sectionChanges.loadouts} card descriptions.`);
    console.log(`Recorded ${discrepancies.length} pre-write discrepancy record(s) in ${reportPath}.`);
  }
}
