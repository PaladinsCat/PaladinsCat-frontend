import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const frontendRoot = resolve(import.meta.dirname, "..");
const repository = resolve(
  process.env.PALADINSCAT_LOCALES_REPO || resolve(frontendRoot, "locales"),
);
const canonicalRoot = resolve(frontendRoot, "lib", "localization", "catalog");
const pinnedEnglishRoot = resolve(repository, "locales", "en");

async function jsonFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(root, path));
    else if (entry.isFile() && entry.name.endsWith(".json")) files.push(relative(root, path).replaceAll("\\", "/"));
  }
  return files.sort();
}

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

async function sameJson(left, right) {
  const [a, b] = await Promise.all([readFile(left, "utf8"), readFile(right, "utf8")]);
  return JSON.stringify(normalize(JSON.parse(a))) === JSON.stringify(normalize(JSON.parse(b)));
}

let canonicalFiles;
let pinnedFiles;
try {
  [canonicalFiles, pinnedFiles] = await Promise.all([jsonFiles(canonicalRoot), jsonFiles(pinnedEnglishRoot)]);
} catch {
  throw new Error(`Pinned locale repository is missing or uninitialized at ${repository}.`);
}

const differences = [];
const allFiles = [...new Set([...canonicalFiles, ...pinnedFiles])].sort();
for (const file of allFiles) {
  if (!canonicalFiles.includes(file)) differences.push(`extra locales/en/${file}`);
  else if (!pinnedFiles.includes(file)) differences.push(`missing locales/en/${file}`);
  else if (!await sameJson(resolve(canonicalRoot, file), resolve(pinnedEnglishRoot, file))) differences.push(`different locales/en/${file}`);
}

if (!await sameJson(
  resolve(frontendRoot, "lib", "localization", "modules.json"),
  resolve(repository, "locales", "modules.json"),
)) differences.push("different locales/modules.json");

if (differences.length) {
  throw new Error(
    `Pinned locale source is not synchronized with the frontend canonical English catalog:\n- ${differences.join("\n- ")}\nSync a dedicated locale authoring clone, merge its PR, then update the locales pin.`,
  );
}

console.log(`Verified frontend English source parity with pinned locales at ${repository}`);
