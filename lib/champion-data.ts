// Champion data extracted from Paladins wiki
// Source: dev/paladins-wiki/champions-extracted-v4.json
// TODO: Load dynamically from DB when available

export interface ChampionSkill {
  name: string;
  key: string;
  damage?: string;
  cooldown?: string;
  description?: string;
}

export interface ChampionTalent {
  name: string;
  description: string;
  category: string;
}

export interface ChampionStats {
  health: string;
  speed: string;
  speedUnits: string;
  range: string;
}

export interface ChampionLoadout {
  name: string;
  level: number; // 1-5
  description: string;
  iconUrl?: string;
  // DB fields (placeholder)
  pickRate?: number;
  winRate?: number;
}

export interface ChampionData {
  name: string;
  roles: string[];
  stats: ChampionStats;
  skills: ChampionSkill[];
  talents: ChampionTalent[];
  loadouts?: ChampionLoadout[];
}

// Image paths for wiki assets
const IMG = "/images/wiki";

export const ANDROXUS_DATA: ChampionData = {
  name: "Androxus",
  roles: ["Flank"],
  stats: {
    health: "2100",
    speed: "365",
    speedUnits: "~22 units/s",
    range: "50",
  },
  skills: [
    {
      name: "Revolver",
      key: "LMB",
      damage: "550",
      description: "A cursed automatic revolver that deals 550 damage every 0.5s.",
    },
    {
      name: "Defiance",
      key: "RMB",
      damage: "520",
      description: "Punch forward, striking enemies in front of you for 520 damage.",
    },
    {
      name: "Reversal",
      key: "Q",
      cooldown: "14s",
      description: "Absorb ranged attacks and fire a blast back that deals damage equal to 75% of the damage absorbed.",
    },
    {
      name: "Nether Step",
      key: "F",
      cooldown: "10s",
      description: "Dash through enemies, dealing damage to each one hit. Can be cast up to 3 times.",
    },
    {
      name: "Accursed Arm",
      key: "E",
      damage: "1000",
      cooldown: "Ultimate",
      description: "Transform your weapon into an explosive revolver that deals 1000 damage in an area.",
    },
  ],
  talents: [
    { name: "Darkstalker", description: "Increase damage dealt by 15% while cloaked.", category: "Nether Step" },
    { name: "Defiant Fist", description: "Defiance grants 10% Armor for 2 seconds.", category: "Defiance" },
    { name: "Godslayer", description: "Deal 10% more damage to enemies above 75% health.", category: "" },
    { name: "Heads Will Roll", description: "Gain 5% movement speed for each enemy champion killed, stacking up to 5 times.", category: "" },
    { name: "Nether Strike", description: "Increase the damage of each Nether Step dash by 50.", category: "Nether Step" },
    { name: "Overwhelming", description: "Increase the duration of Reversal by 2s.", category: "Reversal" },
    { name: "Soul Harvest", description: "Heal for 30 when an enemy champion dies within 5s of being hit by Nether Step.", category: "Nether Step" },
    { name: "Vengeance", description: "Heal for 30 when hitting an enemy champion with Defiance.", category: "Defiance" },
    { name: "Watchful", description: "Reduce all active Cooldowns by 10% after getting an Elimination.", category: "" },
    { name: "Spiteful", description: "Defiance deals 25% more damage to enemies below 50% health.", category: "Defiance" },
  ],
  loadouts: [
    // Placeholder loadout types — will be populated from DB
    // Each champion has 1-3 weapon loadouts (LV1-5)
  ],
};

export const CHAMPION_DATA: Record<string, ChampionData> = {
  androxus: ANDROXUS_DATA,
};

export function getChampionData(slug: string): ChampionData | undefined {
  return CHAMPION_DATA[slug.toLowerCase()];
}

// Talent image paths
export function getTalentIconPath(championName: string, talentName: string): string {
  const slug = `${championName}_${talentName.replace(/\s+/g, "")}`;
  return `${IMG}/talents/Talent ${championName} ${talentName}.png`;
}
