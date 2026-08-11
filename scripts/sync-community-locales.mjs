import { access, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(import.meta.dirname, "..");
const targetRepository = process.argv[2]
  || process.env.PALADINSCAT_LOCALES_AUTHORING_REPO;
if (!targetRepository) {
  throw new Error(
    "Provide a dedicated PaladinsCat-locales authoring clone as an argument or set PALADINSCAT_LOCALES_AUTHORING_REPO. Do not use the pinned community-locales submodule.",
  );
}
try {
  await access(targetRepository);
} catch {
  throw new Error(
    `Locale authoring repository does not exist at ${targetRepository}.`,
  );
}

const catalogSource = fileURLToPath(new URL("../lib/localization/catalog", import.meta.url));
const moduleSource = fileURLToPath(new URL("../lib/localization/modules.json", import.meta.url));
const localesRoot = resolve(targetRepository, "locales");
const destination = resolve(localesRoot, "en");

await mkdir(localesRoot, { recursive: true });
await rm(destination, { recursive: true, force: true });
await rm(resolve(localesRoot, "en.json"), { force: true });
await cp(catalogSource, destination, { recursive: true });
await cp(moduleSource, resolve(localesRoot, "modules.json"));
console.log(`Synced canonical English locale modules to ${destination}`);
