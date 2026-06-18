// Verify all iconUrl references in champion-data.ts exist on disk
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const dataPath = resolve('lib', 'champion-data.ts');
const base = resolve('public');

const source = readFileSync(dataPath, 'utf-8');

// Match iconUrl: "..." — double-quote delimited only (data uses double quotes)
const urlRegex = /iconUrl:\s*"([^"]+)"/g;
const matches = [...source.matchAll(urlRegex)];

const total = matches.length;
let missing = 0;
const missingUrls = [];

for (const match of matches) {
  const url = match[1];
  const fsPath = join(base, url.replace(/^\//, ''));
  if (!existsSync(fsPath)) {
    missing++;
    missingUrls.push(url);
  }
}

console.log(`Total iconUrl references: ${total}`);
console.log(`Missing files: ${missing}`);

if (missing > 0) {
  console.log('\nMissing:');
  for (const url of missingUrls) {
    console.log(`  ${url}`);
  }
} else {
  console.log('\n✅ All iconUrl references have matching files on disk.');
}
