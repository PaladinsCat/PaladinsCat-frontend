import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const frontendRoot = resolve(import.meta.dirname, "..");
const repository = resolve(
  process.env.PALADINSCAT_LOCALES_REPO || resolve(frontendRoot, "..", "..", "community-locales"),
);
const source = resolve(repository, "locales");
const destination = resolve(frontendRoot, "public", "locales");

await rm(destination, { recursive: true, force: true });
await mkdir(resolve(frontendRoot, "public"), { recursive: true });
await cp(source, destination, { recursive: true });
console.log(`Copied pinned locale files from ${source} to ${destination}`);
