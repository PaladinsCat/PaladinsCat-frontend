const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public', 'images');
const dataPath = path.join(__dirname, '..', 'lib', 'champion-data.ts');
const content = fs.readFileSync(dataPath, 'utf8');

const lines = content.split('\n');
let currentChampion = null;
let inTalents = false;
let inSkills = false;
let results = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect champion name
  const nameMatch = line.match(/name: "([^"]+)"/);
  if (nameMatch && !inSkills && !inTalents) {
    currentChampion = nameMatch[1];
    results.push({ name: currentChampion, broken: [] });
  }

  // Check bannerUrl
  if (currentChampion) {
    const bannerMatch = line.match(/bannerUrl: "([^"]+)"/);
    if (bannerMatch) {
      const bannerPath = path.join(publicDir, bannerMatch[1]);
      if (!fs.existsSync(bannerPath)) {
        results[results.length - 1].broken.push({ type: 'banner', path: bannerMatch[1] });
      }
    }

    // Check iconUrl (skills)
    const iconMatch = line.match(/iconUrl: "([^"]+)"/);
    if (iconMatch) {
      const iconPath = path.join(publicDir, iconMatch[1]);
      if (!fs.existsSync(iconPath)) {
        results[results.length - 1].broken.push({ type: 'skill', path: iconMatch[1] });
      }
    }

    // Detect talents section
    if (line.includes('talents: [')) {
      inTalents = true;
    }
    if (inTalents && line.includes('name: "') && line.includes('category:')) {
      // Talent on single line
      const parts = line.match(/name: "([^"]+)"/);
      if (parts) {
        const talentName = parts[1].replace(/\s+/g, '');
        const talentPath = `/images/champions/Talent ${currentChampion} ${talentName}.png`;
        const fullPath = path.join(publicDir, talentPath);
        if (!fs.existsSync(fullPath)) {
          results[results.length - 1].broken.push({ type: 'talent', path: talentPath });
        }
      }
    }
    if (inTalents && line.includes(']')) {
      inTalents = false;
    }
  }
}

const withIssues = results.filter(r => r.broken.length > 0);
withIssues.sort((a, b) => b.broken.length - a.broken.length);

let out = 'CHAMPIONS WITH MISSING IMAGES:\n';
out += '==============================\n';
for (const r of withIssues) {
  out += `\n${r.name} (${r.broken.length} missing):\n`;
  for (const b of r.broken) {
    out += `  [${b.type}] ${b.path}\n`;
  }
}
out += `\nTotal champions with issues: ${withIssues.length}\n`;
const totalBroken = withIssues.reduce((sum, r) => sum + r.broken.length, 0);
out += `Total missing images: ${totalBroken}\n`;

fs.writeFileSync(path.join(__dirname, '..', '..', 'scan-results.txt'), out, 'utf8');
console.log(out);
