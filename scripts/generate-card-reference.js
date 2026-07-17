const fs = require("fs");
const path = require("path");
const { Client } = require("../../backend/node_modules/pg");

const ROOT = path.resolve(__dirname, "../../..");
const PUBLIC_DATA = path.join(ROOT, "src/frontend/public/data");
const ITEM_REFERENCE_PATH = path.join(PUBLIC_DATA, "paladins-items-reference.json");
const OUTPUT_PATH = path.join(PUBLIC_DATA, "paladins-card-reference.json");
const TALENT_OUTPUT_PATH = path.join(PUBLIC_DATA, "paladins-talent-reference.json");
const WIKI_REFERENCE_PATH = path.join(ROOT, "dev/paladins-wiki/champions-extracted-v4.json");
const CARD_IMAGE_DIR = path.join(ROOT, "src/frontend/public/images/cards");
const CHAMPION_IMAGE_DIR = path.join(ROOT, "src/frontend/public/images/champions");
const POSTGRES_ENV_PATH = path.join(ROOT, "env/postgres.env");

const EXPLICIT_CARD_REMAPS = [
  {
    id: 33049,
    remapsFromId: 22882,
    championId: 2479,
    note: "Khan current loadouts use 33049 where old Chokehold id 22882 no longer appears.",
  },
];

const CARD_ASSET_ALIASES = new Map([
  // The live/card reference name is "Blade Dancer", but the local champion-page
  // asset is named after Zhin's ability string, "Blade Dance". Keep the alias in
  // the generator so rendering stays local without special cases in React.
  ["Blade Dancer", "Blade_Dance"],
]);

const TALENT_ASSET_ALIASES = new Map([
  // Patch notes renamed Seris' Soul Collector talent to Resuscitate while the
  // icon asset stayed on the older Soul Collector filename.
  ["Seris|Resuscitate", "Seris Soul Collector"],
  // Live ingest has Grover talent id 20249 named Great Oak, but the local
  // champion data and available assets expose the current default support
  // talent as Wisps of Sylvanus.
  ["Grover|Great Oak", "Grover Wisps of Sylvanus"],
]);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readPostgresEnv() {
  try {
    return Object.fromEntries(
      fs
        .readFileSync(POSTGRES_ENV_PATH, "utf8")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf("=");
          return [line.slice(0, idx), line.slice(idx + 1)];
        }),
    );
  } catch {
    return null;
  }
}

function assetSegment(name) {
  return String(name || "")
    .trim()
    .replace(/[^\w\s'-]/g, "")
    .replace(/\s+/g, "_");
}

function looseAssetKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function canonicalCardAssetKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bguerrilla\b/g, "guerilla")
    .replace(/\b([a-z0-9]{3,})s\b/g, "$1")
    .replace(/\s+/g, "");
}

function buildAssetIndex(dir, prefix) {
  const index = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!/\.(avif|png)$/i.test(entry.name)) continue;
    if (!entry.name.startsWith(prefix)) continue;
    const ext = path.extname(entry.name).toLowerCase();
    const stem = entry.name.slice(prefix.length, -ext.length);
    const key = looseAssetKey(stem);
    const current = index.get(key);
    if (!current || ext === ".avif") {
      index.set(key, entry.name);
    }
  }
  return index;
}

const CARD_ASSET_INDEX = buildAssetIndex(CARD_IMAGE_DIR, "Card_");
const TALENT_ASSET_INDEX = buildAssetIndex(CHAMPION_IMAGE_DIR, "Talent ");
const CARD_CANONICAL_ASSET_INDEX = new Map();
for (const filename of fs.readdirSync(CARD_IMAGE_DIR)) {
  if (!/^Card_.*\.(?:avif|png)$/i.test(filename)) continue;
  const ext = path.extname(filename);
  const stem = filename.slice("Card_".length, -ext.length);
  const key = canonicalCardAssetKey(stem);
  const current = CARD_CANONICAL_ASSET_INDEX.get(key);
  if (!current || ext.toLowerCase() === ".avif") CARD_CANONICAL_ASSET_INDEX.set(key, filename);
}

function indexedAssetUrl(index, publicDir, prefix, name) {
  const segment = assetSegment(name);
  const exactKey = looseAssetKey(name);
  const segmentKey = looseAssetKey(segment);
  const filename = index.get(exactKey) || index.get(segmentKey);
  return filename ? `${publicDir}/${filename}` : null;
}

function localCardIcon(name) {
  const alias = CARD_ASSET_ALIASES.get(normalizeName(name));
  const exact = indexedAssetUrl(CARD_ASSET_INDEX, "/images/cards", "Card_", alias || name);
  if (exact) return exact;
  const canonical = CARD_CANONICAL_ASSET_INDEX.get(canonicalCardAssetKey(alias || name));
  return canonical ? `/images/cards/${canonical}` : null;
}

function localTalentIcon(championName, talentName) {
  const alias = TALENT_ASSET_ALIASES.get(`${normalizeName(championName)}|${normalizeName(talentName)}`);
  return indexedAssetUrl(TALENT_ASSET_INDEX, "/images/champions", "Talent ", alias || `${championName} ${talentName}`);
}

function normalizeName(value) {
  return String(value || "").trim();
}

function normalizeLookupName(value) {
  return normalizeName(value).toLowerCase();
}

function put(map, candidate) {
  const id = Number(candidate.id);
  const name = normalizeName(candidate.name);
  if (!Number.isFinite(id) || id <= 0 || !name) return;
  const existing = map.get(id) || {};
  map.set(id, {
    ...existing,
    ...candidate,
    id,
    name,
    description: candidate.description || existing.description || null,
    shortDescription: candidate.shortDescription || existing.shortDescription || null,
    championId: candidate.championId ?? existing.championId ?? null,
    itemType: candidate.itemType || existing.itemType || "Champion Card",
    iconUrl: candidate.iconUrl || existing.iconUrl || localCardIcon(name),
    source: candidate.source || existing.source || "unknown",
  });
}

function isChampionCard(row) {
  const type = String(row.itemType || row.item_type || "").toLowerCase();
  return type.includes("card vendor") || type.includes("champion card");
}

function isTalent(row) {
  const type = String(row.itemType || row.item_type || "").toLowerCase();
  return type.includes("talent");
}

async function loadObservedCardIds() {
  const env = readPostgresEnv();
  if (!env) return [];

  const client = new Client({
    host: env.POSTGRES_HOST || "127.0.0.1",
    port: Number(env.POSTGRES_PORT || 5433),
    database: env.POSTGRES_DB,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
  });

  await client.connect();
  try {
    const result = await client.query(`
      SELECT
        mp.champion_id,
        COALESCE(c.name, MAX(mp.champion_id::text)) AS champion_name,
        ARRAY_AGG(DISTINCT mpc.card_id ORDER BY mpc.card_id) AS card_ids
      FROM match_player_cards mpc
      JOIN match_players mp
        ON mp.match_id = mpc.match_id
       AND mp.player_id = mpc.player_id
      LEFT JOIN champions c ON c.id = mp.champion_id
      WHERE mp.champion_id IS NOT NULL
      GROUP BY mp.champion_id, c.name
      ORDER BY c.name NULLS LAST, mp.champion_id
    `);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function loadObservedTalents() {
  const env = readPostgresEnv();
  if (!env) return [];

  const client = new Client({
    host: env.POSTGRES_HOST || "127.0.0.1",
    port: Number(env.POSTGRES_PORT || 5433),
    database: env.POSTGRES_DB,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
  });

  await client.connect();
  try {
    const result = await client.query(`
      SELECT DISTINCT
        mpt.talent_id,
        COALESCE(t.talent_name, i.item_name) AS talent_name,
        COALESCE(t.champion_id, i.champion_id, mp.champion_id) AS champion_id,
        c.name AS champion_name,
        i.description,
        i.item_type,
        i.icon_url
      FROM match_player_talents mpt
      JOIN match_players mp
        ON mp.match_id = mpt.match_id
       AND mp.player_id = mpt.player_id
      LEFT JOIN talents t ON t.talent_id = mpt.talent_id
      LEFT JOIN items i ON i.item_id = mpt.talent_id
      LEFT JOIN champions c ON c.id = COALESCE(t.champion_id, i.champion_id, mp.champion_id)
      WHERE mpt.talent_id IS NOT NULL
      ORDER BY c.name NULLS LAST, talent_name NULLS LAST, mpt.talent_id
    `);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function main() {
  const itemReference = readJson(ITEM_REFERENCE_PATH, []);
  const wikiReference = readJson(WIKI_REFERENCE_PATH, {});
  const wikiByName = new Map(
    Object.entries(wikiReference).map(([name, value]) => [normalizeLookupName(name), value]),
  );
  const byId = new Map();
  const talentById = new Map();
  const staticIdsByChampion = new Map();

  // Old and mid-era champions are authoritative in the checked-in get-items
  // snapshot. Those rows carry real Hi-Rez item ids, names, descriptions, and
  // remote image URLs, so they must beat any inferred ordering from observed
  // match loadouts.
  for (const row of itemReference) {
    if (!isChampionCard(row)) continue;
    const championId = Number(row.championId ?? row.champion_id ?? 0);
    const id = Number(row.id ?? row.ItemId);
    const name = normalizeName(row.name ?? row.DeviceName);
    if (!Number.isFinite(id) || !name) continue;
    if (championId > 0) {
      const set = staticIdsByChampion.get(championId) || new Set();
      set.add(id);
      staticIdsByChampion.set(championId, set);
    }
    put(byId, {
      id,
      name,
      description: row.description ?? row.Description ?? null,
      shortDescription: row.shortDescription ?? row.ShortDesc ?? null,
      championId: championId || null,
      itemType: row.itemType ?? row.item_type ?? "Champion Card",
      iconUrl: localCardIcon(name) || row.iconUrl || row.itemIcon_URL || null,
      source: "items-reference",
    });
  }

  for (const row of itemReference) {
    if (!isTalent(row)) continue;
    const id = Number(row.id ?? row.ItemId);
    const name = normalizeName(row.name ?? row.DeviceName);
    const championId = Number(row.championId ?? row.champion_id ?? 0);
    if (!Number.isFinite(id) || !name) continue;
    const wikiEntry = Object.entries(wikiReference).find(([, value]) => Number(value?.id) === championId);
    put(talentById, {
      id,
      name,
      description: row.description ?? row.Description ?? null,
      shortDescription: row.shortDescription ?? row.ShortDesc ?? null,
      championId: championId || null,
      championName: wikiEntry?.[0] ?? null,
      itemType: row.itemType ?? row.item_type ?? "Talent",
      iconUrl: localTalentIcon(wikiEntry?.[0] ?? "", name) || row.iconUrl || row.itemIcon_URL || null,
      source: "items-reference",
    });
  }

  // Small explicit remaps cover partial current-season id changes where the DB
  // only exposes one new id, not a complete 16-card set. Each remap points at an
  // older authoritative row and is added only after the old row is loaded.
  for (const remap of EXPLICIT_CARD_REMAPS) {
    const oldRow = byId.get(remap.remapsFromId);
    if (!oldRow) continue;
    put(byId, {
      ...oldRow,
      id: remap.id,
      championId: remap.championId ?? oldRow.championId,
      source: "explicit-observed-remap",
    });
  }

  // Newer or remapped champions can be absent from the static get-items snapshot
  // while the match DB still records all 16 card ids used in loadouts. Only when
  // a champion has a complete 16-id observed gap do we map those sorted ids to
  // the first 16 local champion-page cards. Some crawled wiki entries contain
  // trailing duplicate rows, so the first 16-card slice is the canonical loadout
  // list. Partial gaps stay unmapped because guessing a single card id by order
  // is less trustworthy than showing the id until a full/local source exists.
  const observed = await loadObservedCardIds().catch((err) => {
    console.warn(`Skipping DB-observed card ids: ${err.message}`);
    return [];
  });
  for (const row of observed) {
    const championId = Number(row.champion_id);
    const championName = normalizeName(row.champion_name);
    const wiki = wikiByName.get(normalizeLookupName(championName));
    const cards = Array.isArray(wiki?.cards) ? wiki.cards.slice(0, 16) : [];
    const ids = (row.card_ids || []).map(Number).filter((id) => Number.isFinite(id));
    const missingIds = ids.filter((id) => !byId.has(id));
    if (!championId || !championName || missingIds.length !== 16 || cards.length !== 16) continue;

    missingIds.forEach((id, index) => {
      const card = cards[index];
      put(byId, {
        id,
        name: card.name,
        description: card.description || null,
        championId,
        itemType: "Champion Card",
        iconUrl: localCardIcon(card.name),
        source: "db-observed-wiki-order",
      });
    });
  }

  const observedTalents = await loadObservedTalents().catch((err) => {
    console.warn(`Skipping DB-observed talent ids: ${err.message}`);
    return [];
  });
  for (const row of observedTalents) {
    const id = Number(row.talent_id);
    const name = normalizeName(row.talent_name);
    const championId = Number(row.champion_id);
    const championName = normalizeName(row.champion_name);
    if (!Number.isFinite(id) || !name) continue;
    put(talentById, {
      id,
      name,
      description: row.description || null,
      championId: Number.isFinite(championId) ? championId : null,
      championName: championName || null,
      itemType: row.item_type || "Talent",
      iconUrl: localTalentIcon(championName, name) || row.icon_url || null,
      source: "db-observed",
    });
  }

  const output = Array.from(byId.values()).sort((a, b) => a.id - b.id);
  const talentOutput = Array.from(talentById.values()).sort((a, b) => a.id - b.id);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(TALENT_OUTPUT_PATH, `${JSON.stringify(talentOutput, null, 2)}\n`);
  console.log(`Wrote ${output.length} card references to ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`Wrote ${talentOutput.length} talent references to ${path.relative(ROOT, TALENT_OUTPUT_PATH)}`);

  // Champion data owns the exact current talent artwork. Re-attach stable IDs
  // and copy those URLs after every reference regeneration so consumers never
  // fall back to display-name-derived filenames.
  require("./sync-champion-talent-ids");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
