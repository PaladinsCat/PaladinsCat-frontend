import fs from 'fs';
import path from 'path';

const data = fs.readFileSync('C:\\Users\\nabi\\PaladinsCat\\src\\frontend\\lib\\champion-data.ts', 'utf8');

// Extract all iconUrl paths
const matches = data.match(/iconUrl:\s*"([^"]+)"/g) || [];
const paths = matches.map(m => {
  const inner = m.match(/"([^"]+)"/);
  return inner ? inner[1] : null;
}).filter(Boolean);

console.log('Total iconUrl references:', paths.length);
const unique = [...new Set(paths)];
console.log('Unique paths:', unique.length);

// Check which files exist
const base = 'C:\\Users\\nabi\\PaladinsCat\\src\\frontend\\public';
let missing = 0;
const missingList = [];
for (const p of unique) {
  const fullPath = path.join(base, p);
  if (!fs.existsSync(fullPath)) {
    missing++;
    missingList.push(p);
  }
}
console.log('Missing files:', missing);
if (missingList.length) {
  // Group by type
  const skills = missingList.filter(p => p.startsWith('/images/skills/'));
  const cards = missingList.filter(p => p.startsWith('/images/cards/'));
  const talents = missingList.filter(p => p.startsWith('/images/champions/'));
  console.log('\nMissing skill icons:', skills.length);
  skills.forEach(p => console.log('  ' + p));
  console.log('\nMissing card images:', cards.length);
  cards.forEach(p => console.log('  ' + p));
  console.log('\nMissing talent images:', talents.length);
  talents.forEach(p => console.log('  ' + p));
} else {
  console.log('All files present!');
}
