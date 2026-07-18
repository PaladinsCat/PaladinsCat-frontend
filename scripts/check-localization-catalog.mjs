import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const catalogDirectory = fileURLToPath(new URL("../lib/localization/catalog/", import.meta.url));
const generatedDirectory = join(catalogDirectory, "generated");

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findJsonFiles(path);
    return entry.isFile() && entry.name.endsWith(".json") ? [path] : [];
  }));
  return files.flat();
}

const canonicalKeys = new Set();
const canonicalFiles = (await findJsonFiles(catalogDirectory))
  .filter((path) => !path.startsWith(`${generatedDirectory}\\`) && !path.startsWith(`${generatedDirectory}/`));

for (const path of canonicalFiles) {
  const messages = JSON.parse(await readFile(path, "utf8"));
  for (const key of Object.keys(messages)) canonicalKeys.add(key);
}

const generated = JSON.parse(await readFile(join(catalogDirectory, "generated/ui.json"), "utf8"));
const duplicateKeys = Object.keys(generated).filter((key) => canonicalKeys.has(key));

if (duplicateKeys.length > 0) {
  console.error(`generated/ui.json duplicates ${duplicateKeys.length} canonical translation key(s):`);
  for (const key of duplicateKeys) console.error(`- ${key}`);
  process.exitCode = 1;
} else {
  console.log(`Localization catalog check passed: ${canonicalFiles.length} curated catalog(s), 0 generated-key duplicates.`);
}
