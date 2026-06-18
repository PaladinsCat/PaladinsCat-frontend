const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'champion-data.ts');
let content = fs.readFileSync(filePath, 'utf8');

// First, add bannerUrl to the ChampionData interface
content = content.replace(
  /export interface ChampionData \{/,
  'export interface ChampionData {\n  bannerUrl?: string;'
);

// Map of champion names to banner filenames
const bannerMap = {
  'Androxus': '/images/champions/Banner_Androxus.png',
  'Ash': '/images/champions/Banner_Ash.png',
  'Atlas': '/images/champions/Banner_Atlas.png',
  'Azaan': '/images/champions/Banner_Azaan.png',
  'Barik': '/images/champions/Banner_Barik.png',
  'Betty La Bomba': '/images/champions/Banner_Betty_la_Bomba.png',
  'Bomb King': '/images/champions/Banner_Bomb_King.png',
  'Buck': '/images/champions/Banner_Buck.png',
  'Caspian': '/images/champions/Banner_Caspian.png',
  'Cassie': '/images/champions/Banner_Cassie.png',
  'Corvus': '/images/champions/Banner_Corvus.png',
  'Dredge': '/images/champions/Banner_Dredge.png',
  'Drogoz': '/images/champions/Banner_Drogoz.png',
  'Evie': '/images/champions/Banner_Evie.png',
  'Fernando': '/images/champions/Banner_Fernando.png',
  'Furia': '/images/champions/Banner_Furia.png',
  'Grohk': '/images/champions/Banner_Grohk.png',
  'Inara': '/images/champions/Banner_Inara.png',
  'Io': '/images/champions/Banner_Io.png',
  'Jenos': '/images/champions/Banner_Jenos.png',
  'Kasumi': '/images/champions/Banner_Kasumi.png',
  'Khan': '/images/champions/Banner_Khan.png',
  'Koga': '/images/champions/Banner_Koga.png',
  'Lex': '/images/champions/Banner_Lex.png',
  'Lian': '/images/champions/Banner_Lian.png',
  'Lillith': '/images/champions/Banner_Lillith.png',
  'Maeve': '/images/champions/Banner_Maeve.png',
  'Makoa': '/images/champions/Banner_Makoa.png',
  "Mal'Damba": "/images/champions/Banner_Mal'Damba.png",
  'Moji': '/images/champions/Banner_Moji.png',
  'Nyx': '/images/champions/Banner_Nyx.png',
  'Octavia': '/images/champions/Banner_Octavia.png',
  'Pip': '/images/champions/Banner_Pip.png',
  'Raum': '/images/champions/Banner_Raum.png',
  'Saati': '/images/champions/Banner_Saati.png',
  'Ying': '/images/champions/Banner_Ying.png',
  'Zhin': '/images/champions/Banner_Zhin.png',
};

let count = 0;

// Add bannerUrl after each name field in champion data objects
for (const [name, bannerUrl] of Object.entries(bannerMap)) {
  // Escape special regex characters
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp('name: "' + escaped + '",' + '\\r?\\n');
  const replacement = 'name: "' + name + '",' + '\n  bannerUrl: "' + bannerUrl + '",' + '\n';
  
  const before = content;
  content = content.replace(regex, replacement);
  
  if (content !== before) {
    count++;
    console.log('  Added bannerUrl for:', name);
  } else {
    console.log('  NO MATCH for:', name);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\nAdded bannerUrl to', count, 'champions');
