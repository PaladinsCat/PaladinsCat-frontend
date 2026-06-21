// Map skill images from wiki AbilityInfo blocks to local file paths.
// Usage: node scripts/map-skill-icons.js [champion-name]
//   - No arg: process all 59 champions
//   - With arg: process only that champion (for incremental testing)

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'public', 'data', 'champion-data.json');
const wikiApi = 'https://paladins.fandom.com/api.php?action=parse&page={PAGE}&format=json&prop=wikitext';

// Wiki filename → local path mapping
// Wiki uses spaces, local files use underscores
function wikiToPath(filename) {
  const name = filename.trim();
  // Remove any trailing .png/.jpg
  const base = name.replace(/\.(png|jpg|jpeg)$/i, '');
  // Replace spaces with underscores
  const localName = base.replace(/\s+/g, '_');
  return `/images/skills/${localName}.png`;
}

async function fetchWikiPage(pageName) {
  const url = wikiApi.replace('{PAGE}', encodeURIComponent(pageName));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Wiki fetch failed for ${pageName}: ${res.status}`);
  const data = await res.json();
  return data.parse?.wikitext?.['*'] || '';
}

function extractSkillIcons(wikitext) {
  const blocks = wikitext.split('{{AbilityInfo');
  const results = [];

  for (const block of blocks.slice(1)) {
    const end = block.indexOf('}}');
    if (end === -1) continue;
    const blockText = block.substring(0, end);

    // Extract name
    const nameMatch = blockText.match(/\|name\s*=\s*([^|\n]+)\s*/);
    const name = nameMatch ? nameMatch[1].trim() : null;

    // Extract all image fields (|image, |image2, |image3, etc.)
    const imgMatches = [...blockText.matchAll(/(\|image\d*)\s*=\s*([^|\n\r]+)/g)];
    const icons = {};
    for (const [, field, val] of imgMatches) {
      const idx = field.replace(/\|image/, '').trim();
      const key = idx === '' ? 'iconUrl' : `iconUrl${idx}`;
      icons[key] = wikiToPath(val.trim());
    }

    if (name) {
      results.push({ name, ...icons });
    }
  }

  return results;
}

// Special case: some wiki page names don't follow simple capitalization
const wikiNameMap = {
  vii: 'VII',
  androxus: 'Androxus',
};

async function processChampion(championKey, championData) {
  const wikiName = wikiNameMap[championKey] || (championKey.charAt(0).toUpperCase() + championKey.slice(1));
  const wikitext = await fetchWikiPage(wikiName);
  const skillIcons = extractSkillIcons(wikitext);

  let patched = 0;
  for (const skill of championData.skills || []) {
    const wikiSkill = skillIcons.find(s => s.name === skill.name);
    if (wikiSkill) {
      const oldIcons = { iconUrl: skill.iconUrl, iconUrl2: skill.iconUrl2, iconUrl3: skill.iconUrl3 };
      for (const key of ['iconUrl', 'iconUrl2', 'iconUrl3']) {
        if (wikiSkill[key] && wikiSkill[key] !== skill[key]) {
          skill[key] = wikiSkill[key];
        }
      }
      const newIcons = { iconUrl: skill.iconUrl, iconUrl2: skill.iconUrl2, iconUrl3: skill.iconUrl3 };
      if (JSON.stringify(oldIcons) !== JSON.stringify(newIcons)) {
        patched++;
        console.log(`  ${championKey}: ${skill.name} (${skill.key}) -> ${JSON.stringify(newIcons)}`);
      }
    } else {
      // Try partial match (e.g., "Submachine Guns / Hellkite Claws" vs "Submachine Guns")
      const partial = skillIcons.find(s => s.name.startsWith(skill.name));
      if (partial) {
        for (const key of ['iconUrl', 'iconUrl2', 'iconUrl3']) {
          if (partial[key] && partial[key] !== skill[key]) {
            skill[key] = partial[key];
          }
        }
        patched++;
        console.log(`  ${championKey}: ${skill.name} (${skill.key}) [partial match] -> iconUrl=${skill.iconUrl}`);
      }
    }
  }

  return patched;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const targetName = process.argv[2]?.toLowerCase();

  const champions = Object.keys(data);
  const toProcess = targetName
    ? champions.filter(c => c.toLowerCase() === targetName)
    : champions;

  console.log(`Processing ${toProcess.length} champion(s): ${toProcess.join(', ')}`);

  for (const name of toProcess) {
    console.log(`\n=== ${name} ===`);
    try {
      const patched = await processChampion(name, data[name]);
      console.log(`  Patched ${patched} skill(s)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
    // Rate limit: 1s between requests to avoid being throttled
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('\nDone. champion-data.json updated.');
}

main().catch(console.error);
