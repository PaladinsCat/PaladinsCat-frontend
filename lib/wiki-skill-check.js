const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'champion-data.ts');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Extract champion data from the file
function extractLocalChampionData(fileContent) {
  const champions = {};
  
  // Match each champion's export block
  const championRegex = /export const (\w+)_DATA:\s*ChampionData\s*=\s*\{([\s\S]*?)^\}/gm;
  let match;
  
  while ((match = championRegex.exec(fileContent)) !== null) {
    const key = match[1];
    const block = match[2];
    
    // Extract champion name
    const nameMatch = block.match(/name:\s*"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : key;
    
    // Extract skills
    const skills = [];
    const skillRegex = /\{\s*\n\s*name:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"/g;
    let skillMatch;
    
    while ((skillMatch = skillRegex.exec(block)) !== null) {
      skills.push({
        name: skillMatch[1],
        description: skillMatch[2]
      });
    }
    
    champions[name] = skills;
  }
  
  return champions;
}

const localChampions = extractLocalChampionData(fileContent);

// Champions to check (only those in the local file)
const championsToCheck = Object.keys(localChampions);

async function fetchWiki(champion) {
  const url = `https://paladins.fandom.com/api.php?action=parse&page=${encodeURIComponent(champion)}&format=json&prop=wikitext`;
  const res = await fetch(url);
  const data = await res.json();
  return data.parse?.wikitext?.['*'] || '';
}

function extractWikiDescriptions(wikitext) {
  const matches = wikitext.match(/{{AbilityInfo\s*\n(?:[^\n]*\n)*?}}/gs);
  if (!matches) return [];
  
  return matches.map(block => {
    const nameMatch = block.match(/\|name\s*=\s*([^|\n]+)/);
    const descMatch = block.match(/\|description\s*=\s*([^|\n]+)/);
    return {
      name: nameMatch ? nameMatch[1].trim() : 'UNKNOWN',
      description: descMatch ? descMatch[1].trim() : 'MISSING'
    };
  });
}

function cleanDesc(desc) {
  return desc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function main() {
  for (const champion of championsToCheck) {
    console.log(`\n=== ${champion} ===`);
    const wikitext = await fetchWiki(champion);
    const wikiSkills = extractWikiDescriptions(wikitext);
    
    if (!wikiSkills.length) {
      console.log("  ERROR: No AbilityInfo blocks found on wiki!");
      continue;
    }
    
    const localSkills = localChampions[champion];
    
    let allMatch = true;
    for (const wikiSkill of wikiSkills) {
      const wikiDesc = cleanDesc(wikiSkill.description);
      const localSkill = localSkills.find(s => s.name === wikiSkill.name);
      
      if (!localSkill) {
        console.log(`  ❌ ${wikiSkill.name}: NO LOCAL MATCH`);
        allMatch = false;
        continue;
      }
      
      const localDesc = cleanDesc(localSkill.description);
      
      if (wikiDesc !== localDesc) {
        console.log(`  ❌ ${wikiSkill.name}: MISMATCH`);
        console.log(`     Wiki:   "${wikiDesc}"`);
        console.log(`     Local:  "${localDesc}"`);
        allMatch = false;
      }
    }
    
    // Check for local skills not on wiki
    for (const localSkill of localSkills) {
      const wikiSkill = wikiSkills.find(s => s.name === localSkill.name);
      if (!wikiSkill) {
        console.log(`  ⚠️  ${localSkill.name}: NOT ON WIKI`);
      }
    }
    
    if (allMatch) {
      console.log("  ✅ ALL MATCH");
    }
  }
}

main().catch(console.error);
