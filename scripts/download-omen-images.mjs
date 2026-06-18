// Download missing Omen images from wiki
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const baseDir = 'C:\\Users\\nabi\\PaladinsCat\\src\\frontend\\public\\images';

// High-res URLs (remove scale-to-width-down parameter for full resolution)
const images = {
  skills: [
    { name: 'WeaponAttack_Omen_Icon.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/1/1c/WeaponAttack_Omen_Icon.png/revision/latest?cb=20230808001738' },
    { name: 'Ability_Deadly_Domain.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/8/8c/Ability_Deadly_Domain.png/revision/latest?cb=20230808001702' },
    { name: 'Ability_Gravity_Vice.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/f/fe/Ability_Gravity_Vice.png/revision/latest?cb=20230808001703' },
    { name: 'Ability_Dark_Stride.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/a/ad/Ability_Dark_Stride.png/revision/latest?cb=20230808001701' },
    { name: 'Ability_Heavens_Asunder.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/a/a6/Ability_Heavens_Asunder.png/revision/latest?cb=20230808001700' },
  ],
  talents: [
    { name: 'Talent Omen UmbralLance.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/7/74/Talent_Omen_UmbralLance.png/revision/latest?cb=20230808002545', dir: 'champions' },
    { name: 'Talent Omen EveryoneDies.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/6/68/Talent_Omen_EveryoneDies.png/revision/latest?cb=20230808002547', dir: 'champions' },
    { name: 'Talent Omen BinaryVoid.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/5/58/Talent_Omen_BinaryVoid.png/revision/latest?cb=20230808002546', dir: 'champions' },
  ],
  cards: [
    { name: 'Card_Coming_End.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/9/9f/Card_Coming_End.png/revision/latest?cb=20231028161038' },
    { name: 'Card_Dark_Leech.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/6/68/Card_Dark_Leech.png/revision/latest?cb=20231028161049' },
    { name: 'Card_Dusk_Trail.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/3/38/Card_Dusk_Trail.png/revision/latest?cb=20231028161042' },
    { name: 'Card_Engulfing_Mire.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/c/c7/Card_Engulfing_Mire.png/revision/latest?cb=20231028161039' },
    { name: 'Card_Everlasting_Power.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/c/cd/Card_Everlasting_Power.png/revision/latest?cb=20231028161046' },
    { name: 'Card_Everlasting_Vision.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/7/7b/Card_Everlasting_Vision.png/revision/latest?cb=20231028161050' },
    { name: 'Card_Gloom.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/b/bd/Card_Gloom.png/revision/latest?cb=20231028161040' },
    { name: 'Card_I_Am_Everywhere.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/a/a9/Card_I_Am_Everywhere.png/revision/latest?cb=20231028161043' },
    { name: 'Card_Lightless.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/2/24/Card_Lightless.png/revision/latest?cb=20231028161044' },
    { name: 'Card_More_More_More.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/b/b8/Card_More_More_More.png/revision/latest?cb=20231028161047' },
    { name: 'Card_Noxious_Guard.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/9/95/Card_Noxious_Guard.png/revision/latest?cb=20231028161041' },
    { name: 'Card_Ominous_Protection.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/c/c0/Card_Ominous_Protection.png/revision/latest?cb=20231028161047' },
    { name: 'Card_Pure_Aggression.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/7/73/Card_Pure_Aggression.png/revision/latest?cb=20231028161048' },
    { name: 'Card_Shaded_Speed.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/f/fb/Card_Shaded_Speed.png/revision/latest?cb=20231028161045' },
    { name: 'Card_Void_Choke.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/f/fe/Card_Void_Choke.png/revision/latest?cb=20231028161051' },
    { name: 'Card_Wrathful_Descent.png', url: 'https://static.wikia.nocookie.net/paladins_gamepedia/images/9/9d/Card_Wrathful_Descent.png/revision/latest?cb=20231028161052' },
  ]
};

async function downloadImage(img, dir) {
  const filePath = join(baseDir, dir, img.name);
  if (existsSync(filePath)) {
    console.log(`SKIP (exists): ${img.name}`);
    return;
  }
  
  try {
    const response = await fetch(img.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(filePath, buffer);
    console.log(`DOWNLOADED: ${img.name} (${buffer.length} bytes)`);
  } catch (err) {
    console.error(`FAILED: ${img.name} - ${err.message}`);
  }
}

async function main() {
  console.log('=== Downloading Omen Skill Icons ===');
  for (const img of images.skills) {
    await downloadImage(img, 'skills');
  }
  
  console.log('\n=== Downloading Omen Talent Images ===');
  for (const img of images.talents) {
    await downloadImage(img, 'champions');
  }
  
  console.log('\n=== Downloading Omen Card Images ===');
  for (const img of images.cards) {
    await downloadImage(img, 'cards');
  }
  
  console.log('\n=== Done ===');
}

main();
