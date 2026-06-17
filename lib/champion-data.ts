// Champion data extracted from Paladins wiki
// Source: dev/paladins-wiki/champions-extracted-v4.json
// TODO: Load dynamically from DB when available

export interface ChampionSkill {
  name: string;
  key: string;
  iconUrl?: string;
  damage?: string;
  cooldown?: string;
  description?: string;
}

export interface ChampionTalent {
  name: string;
  description: string;
  category: string;
  iconUrl?: string;
}

export interface ChampionStats {
  health: string;
  speed: string;
  speedUnits: string;
  range: string;
}

export interface ChampionLoadout {
  name: string;
  description: string;
  category: string; // Linked ability (Nether Step, Defiance, Reversal, or "")
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
      iconUrl: "/images/skills/Ability_Revolver.png",
      damage: "550",
      description: "A cursed automatic revolver that deals 550 damage every 0.5s.",
    },
    {
      name: "Defiance",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Defiance.png",
      damage: "520",
      description: "Punch forward, striking enemies in front of you for 520 damage.",
    },
    {
      name: "Reversal",
      key: "Q",
      iconUrl: "/images/skills/Ability_Reversal.png",
      cooldown: "14s",
      description: "Absorb ranged attacks and fire a blast back that deals damage equal to 75% of the damage absorbed.",
    },
    {
      name: "Nether Step",
      key: "F",
      iconUrl: "/images/skills/Ability_Nether_Step.png",
      cooldown: "10s",
      description: "Dash through enemies, dealing damage to each one hit. Can be cast up to 3 times.",
    },
    {
      name: "Accursed Arm",
      key: "E",
      iconUrl: "/images/skills/Ability_Accursed_Arm.png",
      damage: "1000",
      cooldown: "Ultimate",
      description: "Transform your weapon into an explosive revolver that deals 1000 damage in an area.",
    },
  ],
  talents: [
    { name: "Defiant Fist", description: "Successful hits with your Revolver increase the damage of your next Defiance by 20%, stacking up to 100%.", category: "Defiance" },
    { name: "Godslayer", description: "Reversal always fires back and does an additional 800 damage.", category: "Reversal" },
    { name: "Dark Stalker", description: "Nether Step now has 3 separate charges and is no longer linked.", category: "Nether Step" },
  ],
  loadouts: [
    { name: "Abyss Walker", description: "Heal for 40", category: "Nether Step", iconUrl: "/images/cards/Card_Abyss_Walker.png" },
    { name: "Abyssal Touch", description: "Reduce the Cooldown of Nether Step by 1.2s after hitting an enemy with Defiance.", category: "Defiance", iconUrl: "/images/cards/Card_Abyssal_Touch.png" },
    { name: "Buying Time", description: "Generate 1 Energy", category: "Reversal", iconUrl: "/images/cards/Card_Buying_Time.png" },
    { name: "Disrupt", description: "Reduce the Cooldown of Reversal by 1.2s.", category: "Reversal", iconUrl: "/images/cards/Card_Disrupt.png" },
    { name: "Elusive", description: "Increase your Movement Speed by 10% for 3s after activating Nether Step.", category: "Nether Step", iconUrl: "/images/cards/Card_Elusive.png" },
    { name: "Equivalent Exchange", description: "Heal for 10% of the damage Absorbed by Reversal.", category: "Reversal", iconUrl: "/images/cards/Card_Equivalent_Exchange.png" },
    { name: "Featherweight", description: "Heal for 50", category: "", iconUrl: "/images/cards/Card_Featherweight.png" },
    { name: "Marksman", description: "Generate 1 Energy", category: "Defiance", iconUrl: "/images/cards/Card_Marksman.png" },
    { name: "Power of the Abyss", description: "Reduce the Cooldown of Nether Step by 20% after hitting an enemy champion with Reversal.", category: "Reversal", iconUrl: "/images/cards/Card_Power_of_the_Abyss.png" },
    { name: "Quick Draw", description: "Hitting a player with Revolver Heals you for 15.", category: "", iconUrl: "/images/cards/Card_Quick_Draw.png" },
    { name: "Seething Hatred", description: "Reduce the Cooldown of Reversal by 0.5s after hitting an enemy champion with Revolver.", category: "", iconUrl: "/images/cards/Card_Seething_Hatred.png" },
    { name: "Sleight of Hand", description: "Generate 1 Energy", category: "Nether Step", iconUrl: "/images/cards/Card_Sleight_of_Hand.png" },
    { name: "Spiteful", description: "Generate 1% Ultimate charge after hitting at least one enemy champion with Defiance.", category: "Defiance", iconUrl: "/images/cards/Card_Spiteful.png" },
    { name: "Through the Warp", description: "Increase the distance of each Nether Step dash by 5%.", category: "Nether Step", iconUrl: "/images/cards/Card_Through_the_Warp.png" },
    { name: "Vengeance", description: "Heal for 30", category: "Defiance", iconUrl: "/images/cards/Card_Vengeance.png" },
    { name: "Watchful", description: "Reduce all active Cooldowns by 10% after getting an Elimination.", category: "", iconUrl: "/images/cards/Card_Watchful.png" },
  ],
};

export const ASH_DATA: ChampionData = {
  name: "Ash",
  roles: ["Frontline"],
  stats: {
    health: "4500",
    speed: "340",
    speedUnits: "~21 units/s",
    range: "80",
  },
  skills: [
    {
      name: "Burst Cannon",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Ash_Icon.png",
      damage: "400",
      description: "Fire a burst of shrapnel every 0.9s that explodes to deal 400 damage in a small area.",
    },
    {
      name: "Kinetic Burst",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Kinetic_Burst.png",
      damage: "450",
      cooldown: "6s",
      description: "Charge your weapon. Your next shot deals 450 damage to nearby enemies and applies Knockback.",
    },
    {
      name: "Siege Shield",
      key: "Q",
      iconUrl: "/images/skills/Ability_Siege_Shield.png",
      damage: "4750",
      cooldown: "10s",
      description: "Create a moving shield with 4750 health that advances along the ground.",
    },
    {
      name: "Shoulder Bash",
      key: "F",
      iconUrl: "/images/skills/Ability_Shoulder_Bash.png",
      cooldown: "13s",
      description: "Lower your shoulder and charge forward, dealing damage to enemies and applying Knockback.",
    },
    {
      name: "Assert Dominance",
      key: "E",
      iconUrl: "/images/skills/Ability_Assert_Dominance.png",
      damage: "600",
      cooldown: "Ultimate",
      description: "Leap forward and slam your banner down, dealing 600 damage and Stunning enemies on impact while becoming damage immune.",
    },
  ],
  talents: [
    { name: "Battering Ram", description: "Reduce your damage taken by 75% while using Shoulder Bash.", category: "Shoulder Bash" },
    { name: "Slug Shot", description: "Your weapon shots travel 50% faster and 100% farther, dealing 450 Direct Damage with no explosion.", category: "Burst Cannon" },
    { name: "Fortress Breaker", description: "Increase Siege Shield's maximum Health by 2750 and its size by 50%, but reduce its Movement Speed by 80%.", category: "Siege Shield" },
  ],
  loadouts: [
    { name: "Battlement", description: "Increase the duration of Siege Shield.", category: "Siege Shield", iconUrl: "/images/cards/Card_Battlement.png" },
    { name: "Brawl", description: "Heal for damage over 2s for each enemy hit by Kinetic Burst.", category: "Kinetic Burst", iconUrl: "/images/cards/Card_Brawl.png" },
    { name: "Castle Forged", description: "Reduce the Cooldown of Kinetic Burst.", category: "Kinetic Burst", iconUrl: "/images/cards/Card_Castle_Forged.png" },
    { name: "Fervor", description: "Increase your maximum Ammo.", category: "", iconUrl: "/images/cards/Card_Fervor.png" },
    { name: "Furious Charge", description: "Increase the Knockback distance of Shoulder Bash.", category: "Shoulder Bash", iconUrl: "/images/cards/Card_Furious_Charge.png" },
    { name: "Gate Crasher", description: "Reduce the Cooldown of Shoulder Bash.", category: "Shoulder Bash", iconUrl: "/images/cards/Card_Gate_Crasher.png" },
    { name: "Heavy Metal", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Heavy_Metal.png" },
    { name: "Indomitable", description: "Gain Lifesteal.", category: "", iconUrl: "/images/cards/Card_Indomitable.png" },
    { name: "Percussion", description: "Increase the Knockback distance of Kinetic Burst.", category: "Kinetic Burst", iconUrl: "/images/cards/Card_Percussion.png" },
    { name: "Ramparts", description: "Reduce the Cooldown of Siege Shield.", category: "Siege Shield", iconUrl: "/images/cards/Card_Ramparts.png" },
    { name: "Siege Engine", description: "Reduce the Cooldown of Siege Shield for each enemy hit with Kinetic Burst.", category: "Kinetic Burst", iconUrl: "/images/cards/Card_Siege_Engine.png" },
    { name: "Thrive", description: "Heal after hitting an enemy with Shoulder Bash.", category: "Shoulder Bash", iconUrl: "/images/cards/Card_Thrive.png" },
    { name: "Trebuchet", description: "Generate Ammo after activating Siege Shield.", category: "Siege Shield", iconUrl: "/images/cards/Card_Trebuchet.png" },
    { name: "Vanguard", description: "Reduce your damage taken after using Shoulder Bash.", category: "Shoulder Bash", iconUrl: "/images/cards/Card_Vanguard.png" },
    { name: "War Machine", description: "Reduce your active Cooldowns after getting an Elimination.", category: "", iconUrl: "/images/cards/Card_War_Machine.png" },
    { name: "Watchtower", description: "Increase the Health of Siege Shield.", category: "Siege Shield", iconUrl: "/images/cards/Card_Watchtower.png" },
  ],
};

export const ATLAS_DATA: ChampionData = {
  name: "Atlas",
  roles: ["Frontline"],
  stats: {
    health: "4000",
    speed: "360",
    speedUnits: "~22.5 units/s",
    range: "110",
  },
  skills: [
    {
      name: "Chrono-Cannon",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Atlas_Icon.png",
      damage: "780",
      description: "A futuristic weapon you can charge up to increase its accuracy and damage while firing fewer shots. Deals 780 damage every 1.4s if fully charging your shots.",
    },
    {
      name: "Setback",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Setback.png",
      cooldown: "10s",
      description: "Fire a concentration of chronon energy from your weapon that Rewinds your enemy.",
    },
    {
      name: "Stasis Field",
      key: "Q",
      iconUrl: "/images/skills/Ability_Stasis_Field.png",
      cooldown: "14s",
      description: "Create a barrier in front of you to absorb all ranged attacks and projectiles.",
    },
    {
      name: "Second Chance",
      key: "F",
      iconUrl: "/images/skills/Ability_Second_Chance.png",
      cooldown: "16s",
      description: "Rewind yourself into the near past, reversing recent damage and going back to where you were.",
    },
    {
      name: "Exile",
      key: "E",
      iconUrl: "/images/skills/Ability_Exile.png",
      cooldown: "Ultimate",
      description: "Modify your chronon weapon to Banish enemies from this place of existence for a brief period.",
    },
  ],
  talents: [
    { name: "Unstable Fissure", description: "When you use Second Chance you also Rewind enemies within 20 units 3s into the past.", category: "Second Chance" },
    { name: "Temporal Divide", description: "Greatly increase the size of Stasis Field, but its Duration is decreased to 3.5 seconds and its Cooldown is increased to 18s.", category: "Stasis Field" },
    { name: "Deja vu", description: "Setback becomes a lobbed explosive, capable of Rewinding multiple enemies.", category: "Setback" },
  ],
  loadouts: [
    { name: "Beyond the Veil", description: "Passing through Stasis Field increases your allies' or your own Movement Speed by 7% for 3s.", category: "Stasis Field", iconUrl: "/images/cards/Card_Beyond_the_Veil.png" },
    { name: "Continuum Shift", description: "Second Chance sends you 0.4s further into the past.", category: "Second Chance", iconUrl: "/images/cards/Card_Continuum_Shift.png" },
    { name: "Distant Memory", description: "Increase your Healing received from others by 5% while at or below 50% Health.", category: "", iconUrl: "/images/cards/Card_Distant_Memory.png" },
    { name: "Hell Hunter", description: "Generate 1 Ammo after hitting a fully-charged weapon shot.", category: "", iconUrl: "/images/cards/Card_Hell_Hunter.png" },
    { name: "Infinity Engine", description: "Your weapon doesn't consume Ammo for 1.6s after activating Stasis Field.", category: "Stasis Field", iconUrl: "/images/cards/Card_Infinity_Engine.png" },
    { name: "Lessons of the Past", description: "Gain a 100-Health Shield for 5s after hitting an enemy with Setback.", category: "Setback", iconUrl: "/images/cards/Card_Lessons_of_the_Past.png" },
    { name: "Life Unlived", description: "Heal for an additional 150 when using Second Chance.", category: "Second Chance", iconUrl: "/images/cards/Card_Life_Unlived.png" },
    { name: "Lost Legacy", description: "Heal for 80 every 1s for 3s after activating Stasis Field.", category: "Stasis Field", iconUrl: "/images/cards/Card_Lost_Legacy.png" },
    { name: "No One Escapes", description: "Enemies hit by Setback are Rewound 0.3s further into the past.", category: "Setback", iconUrl: "/images/cards/Card_No_One_Escapes.png" },
    { name: "Old Wounds", description: "Increase your maximum Health by 150.", category: "", iconUrl: "/images/cards/Card_Old_Wounds.png" },
    { name: "Paradox", description: "Reduce the Cooldown of Second Chance by 0.5s.", category: "Second Chance", iconUrl: "/images/cards/Card_Paradox.png" },
    { name: "Phantom Pain", description: "Reduces the Cooldown of Stasis Field by 1s after hitting an enemy with Setback.", category: "Setback", iconUrl: "/images/cards/Card_Phantom_Pain.png" },
    { name: "Ravages of Time", description: "Increase your Movement Speed by 5% for 4s after getting an Elimination.", category: "", iconUrl: "/images/cards/Card_Ravages_of_Time.png" },
    { name: "Rewritten History", description: "Generate 1 Ammo after using Second Chance.", category: "Second Chance", iconUrl: "/images/cards/Card_Rewritten_History.png" },
    { name: "Safe Haven", description: "Increase your Healing received by 6% while Stasis Field is active.", category: "Stasis Field", iconUrl: "/images/cards/Card_Safe_Haven.png" },
    { name: "Steady Arm", description: "Generate 1 Ammo after hitting an enemy with Setback.", category: "Setback", iconUrl: "/images/cards/Card_Steady_Arm.png" },
  ],
};

export const AZAAN_DATA: ChampionData = {
  name: "Azaan",
  roles: ["Frontline"],
  stats: {
    health: "4500",
    speed: "365",
    speedUnits: "~22 units/s",
    range: "110",
  },
  skills: [
    {
      name: "Judgement",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Azaan_Icon.png",
      damage: "525, 525, 630",
      description: "Throw your hammer in an attack chain, dealing 525, 525, 630 damage. Dealing and taking damage increases your Ire, which can augment your abilities and provide passive benefits.",
    },
    {
      name: "Reckoning",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Reckoning.png",
      damage: "300",
      cooldown: "9s",
      description: "Send out a projectile that explodes in an area. Enemies hit take 300 damage and are Lifted. Using above Ire threshold reduces the Cooldown.",
    },
    {
      name: "Sanctuary",
      key: "Q",
      iconUrl: "/images/skills/Ability_Sanctuary.png",
      cooldown: "12s",
      description: "Create a series of Deployable wall segments, each with 2500 Health. Using Sanctuary above the Ire threshold increases the Health of segments.",
    },
    {
      name: "Conviction",
      key: "F",
      iconUrl: "/images/skills/Ability_Conviction.png",
      damage: "150 (contact), 350 (wall), 500 (Sanctuary)",
      cooldown: "12s",
      description: "Dash forward, carrying an enemy with you. Deals damage and Stuns on hitting any wall. While above the Ire threshold, this ability is used faster.",
    },
    {
      name: "Deliverance",
      key: "E",
      iconUrl: "/images/skills/Ability_Deliverance.png",
      damage: "725 (initial), 250 (second)",
      cooldown: "Ultimate",
      description: "Rise up and throw your hammer, dealing damage and Knockback, before teleporting to the impact, dealing more damage and Knockback.",
    },
  ],
  talents: [
    { name: "Persistence", description: "Gain 30% Lifesteal on your hits with Judgement.", category: "Judgement" },
    { name: "Tempering", description: "Reckoning's damage and size, Sanctuary's health, and Conviction's range and stun duration are increased by 50%, but their Cooldown is increased by 25%.", category: "Tempering" },
    { name: "Eternal", description: "Your Ire no longer decays due to not taking or dealing damage, but you no longer gain the passive damage increase while above Ire threshold.", category: "Eternal" },
  ],
  loadouts: [
    { name: "Ad Eternum", description: "Reduce the damage you take by 3% while at least one wall segment of Sanctuary is active.", category: "Sanctuary", iconUrl: "/images/cards/Card_Ad_Eternum.png" },
    { name: "Deadly Edict", description: "Reduce the Cooldown of Conviction by 0.3s after using Reckoning.", category: "Reckoning", iconUrl: "/images/cards/Card_Deadly_Edict.png" },
    { name: "Depths of Despair", description: "Reduce the damage you take by 4% for 2s after activating Conviction.", category: "Conviction", iconUrl: "/images/cards/Card_Depths_of_Despair.png" },
    { name: "Duty is a Mountain", description: "Increase the time until Ire starts to decay by 0.25s.", category: "", iconUrl: "/images/cards/Card_Duty_is_a_Mountain.png" },
    { name: "Eternal Strife", description: "Using an ability above Ire threshold Heals you for 75.", category: "", iconUrl: "/images/cards/Card_Eternal_Strife.png" },
    { name: "Flames of Wrath", description: "Increase the duration of the Lift applied by Reckoning by 20%.", category: "Reckoning", iconUrl: "/images/cards/Card_Flames_of_Wrath.png" },
    { name: "Forged in Battle", description: "Reduce the Cooldown of Sanctuary by 0.6s.", category: "Sanctuary", iconUrl: "/images/cards/Card_Forged_in_Battle.png" },
    { name: "Gathering Power", description: "Heal for 70 for each enemy hit with Reckoning.", category: "Reckoning", iconUrl: "/images/cards/Card_Gathering_Power.png" },
    { name: "Grim Deliverance", description: "Heal for 5 for every percentage point of Ire consumed by abilities.", category: "", iconUrl: "/images/cards/Card_Grim_Deliverance.png" },
    { name: "Indignation", description: "Reduce the Cooldown of Conviction by 0.4s.", category: "Conviction", iconUrl: "/images/cards/Card_Indignation.png" },
    { name: "Overwhelming Presence", description: "Heal for 12 every 0.5s while at least one wall segment of Sanctuary is active.", category: "Sanctuary", iconUrl: "/images/cards/Card_Overwhelming_Presence.png" },
    { name: "Piety", description: "Heal for 75 after activating Conviction.", category: "Conviction", iconUrl: "/images/cards/Card_Piety.png" },
    { name: "Righteous Fury", description: "Reduce the Cooldown of Sanctuary by 0.6s after using Reckoning.", category: "Reckoning", iconUrl: "/images/cards/Card_Righteous_Fury.png" },
    { name: "Solemn Watch", description: "Increase the distance traveled by Conviction by 6%.", category: "Conviction", iconUrl: "/images/cards/Card_Solemn_Watch.png" },
    { name: "Tools of Salvation", description: "Increase your maximum Health by 150.", category: "", iconUrl: "/images/cards/Card_Tools_of_Salvation.png" },
    { name: "True Conviction", description: "Reduce the damage your other allies take by 5% while they are within 35 units of the middle wall segment of your Sanctuary.", category: "Sanctuary", iconUrl: "/images/cards/Card_True_Conviction.png" },
  ],
};

export const BARIK_DATA: ChampionData = {
  name: "Barik",
  roles: ["Frontline"],
  stats: {
    health: "3400",
    speed: "345",
    speedUnits: "~21 units/s",
    range: "40",
  },
  skills: [
    {
      name: "Blunderbuss",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Barik_Icon.png",
      damage: "500",
      description: "A short-range blunderbuss that deals 500 damage every 1s.",
    },
    {
      name: "Barricade",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Barricade.png",
      damage: "4500",
      cooldown: "12s",
      description: "Create a barricade with 4500 health to protect allies and yourself from harm.",
    },
    {
      name: "Turret",
      key: "Q",
      iconUrl: "/images/skills/Ability_Turret.png",
      damage: "120, 1000",
      cooldown: "10s",
      description: "Deploy a turret that targets nearby enemies, dealing 120 damage every 1s.",
    },
    {
      name: "Rocket Boots",
      key: "F",
      iconUrl: "/images/skills/Ability_Rocket_Boots.png",
      cooldown: "12s",
      description: "Activate your rocket-boots, charging you forward with great speed for a short time.",
    },
    {
      name: "Dome Shield",
      key: "E",
      iconUrl: "/images/skills/Ability_Dome_Shield.png",
      cooldown: "Ultimate",
      description: "Create a protective dome shield around yourself and nearby allies.",
    },
  ],
  talents: [
    { name: "Fortify", description: "Increase the maximum Health of Barricade by 2000 and reduce its Cooldown by 3s.", category: "Barricade", iconUrl: "/images/champions/Talent Barik Fortify.png" },
    { name: "Tinkerin'", description: "Modify your Blunderbuss to fire a single slug that deals 600 damage.", category: "Blunderbuss", iconUrl: "/images/champions/Talent Barik Tinkerin.png" },
    { name: "Forgefire", description: "Dome Shield now costs 40% Ultimate charge and places a miniature Flamethrower Turret. This turret deals 400 damage every 1s and has no Shield, but you can have 2 active at once.", category: "Dome Shield", iconUrl: "/images/champions/Talent Barik Forgefire.png" },
  ],
  loadouts: [
    { name: "Accelerator Field", description: "Increase the speed of Rocket Boots by 12%.", category: "Barricade", iconUrl: "/images/cards/Card_Accelerator_Field.png" },
    { name: "Bowling Ball", description: "Heal for 175 after hitting an enemy champion with Rocket Boots.", category: "Rocket Boots", iconUrl: "/images/cards/Card_Bowling_Ball.png" },
    { name: "Brave and Bold", description: "Increase your maximum Health by 150.", category: "", iconUrl: "/images/cards/Card_Brave_and_Bold.png" },
    { name: "Bunker", description: "Increase the Health of Barricade by 250.", category: "Barricade", iconUrl: "/images/cards/Card_Bunker.png" },
    { name: "Combat Repair", description: "Heal your Turret for 100 every 2s.", category: "Turret", iconUrl: "/images/cards/Card_Combat_Repair.png" },
    { name: "Double Time", description: "Heal for 65 after activating Rocket Boots.", category: "Rocket Boots", iconUrl: "/images/cards/Card_Double_Time.png" },
    { name: "Failsafe", description: "Reduce your damage taken by 30% while at or below 50% Health.", category: "", iconUrl: "/images/cards/Card_Failsafe.png" },
    { name: "Field Deploy", description: "Generate 1 Ammo after deploying your Turret.", category: "Turret", iconUrl: "/images/cards/Card_Field_Deploy.png" },
    { name: "Forged Alloy", description: "Increase your maximum Health by 150.", category: "Turret", iconUrl: "/images/cards/Card_Forged_Alloy.png" },
    { name: "Foundation", description: "Increase the duration of Barricade by 0.6s.", category: "Barricade", iconUrl: "/images/cards/Card_Foundation.png" },
    { name: "Fuel Efficiency", description: "Increase the duration of Rocket Boots by 0.3s.", category: "Rocket Boots", iconUrl: "/images/cards/Card_Fuel_Efficiency.png" },
    { name: "Healing Station", description: "Heal nearby allies for 50 every 2s while Turret is active.", category: "Turret", iconUrl: "/images/cards/Card_Healing_Station.png" },
    { name: "One Man's Scrap", description: "Reduce your damage taken by 5% for each nearby ally.", category: "", iconUrl: "/images/cards/Card_One_Mans_Scrap.png" },
    { name: "One Man's Treasure", description: "Reduce your active Cooldowns by 10% after getting an Elimination.", category: "", iconUrl: "/images/cards/Card_One_Mans_Treasure.png" },
    { name: "Palisade", description: "Reduce the Cooldown of Barricade by 0.6s.", category: "Barricade", iconUrl: "/images/cards/Card_Palisade.png" },
    { name: "Red Streak", description: "Reduce the Cooldown of Rocket Boots by 0.8s.", category: "Rocket Boots", iconUrl: "/images/cards/Card_Red_Streak.png" },
  ],
};

export const FERNANDO_DATA: ChampionData = {
  name: "Fernando",
  roles: ["Frontline"],
  stats: {
    health: "4600",
    speed: "350",
    speedUnits: "~21 units/s",
    range: "50",
  },
  skills: [
    {
      name: "Flame Lance",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Fernando_Icon.png",
      damage: "35 per 0.1s, 200 over 2s (Burn)",
      description: "A flamethrower that deals 35 damage every 0.1s and applies a Burn that deals 200 damage over 2s.",
    },
    {
      name: "Chivalry",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Shield.png",
      damage: "4000",
      description: "Hold up a large shield with 4000 health in front of you that blocks attacks.",
    },
    {
      name: "Fireball",
      key: "Q",
      iconUrl: "/images/skills/Ability_Fireball.png",
      damage: "450",
      cooldown: "7s",
      description: "Shoot a fireball that pierces through enemies and deals 450 damage to them.",
    },
    {
      name: "Charge",
      key: "F",
      iconUrl: "/images/skills/Ability_Charge.png",
      damage: "400",
      cooldown: "10s",
      description: "Charge through your enemies, dealing 400 damage to them.",
    },
    {
      name: "Immortal",
      key: "E",
      iconUrl: "/images/skills/Ability_Immortal.png",
      damage: "1500",
      cooldown: "Ultimate",
      description: "Rally your allies around you, preventing them from falling below 1500 health.",
    },
  ],
  talents: [
    { name: "Aegis", description: "Increase Chivalry's Shield to 5500, and it begins regenerating 25% sooner and 25% faster. You now only need 20% Shield to activate Chivalry after it is broken.", category: "Chivalry", iconUrl: "/images/champions/Talent Fernando Aegis.png" },
    { name: "Scorch", description: "Increase the damage of Fireball by 35%, decrease its Cooldown by 1s, and deal 20% increased damage for each subsequent target hit after the first.", category: "Fireball", iconUrl: "/images/champions/Talent Fernando Scorch.png" },
    { name: "Formidable", description: "You now have 2 charges of Charge, each Charge deals an additional 100 damage, and you are Immune to Crowd Control while Charging, but the Cooldown of Charge is increased to 13s.", category: "Charge", iconUrl: "/images/champions/Talent Fernando Formidable.png" },
  ],
  loadouts: [
    { name: "Brand", description: "Heal for damage over 2s for each enemy hit by Fireball.", category: "Fireball", iconUrl: "/images/cards/Card_Brand.png" },
    { name: "Cavalier", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Cavalier.png" },
    { name: "Dire Need", description: "Reduce your damage taken while at or below 50% Health.", category: "Chivalry", iconUrl: "/images/cards/Card_Dire_Need.png" },
    { name: "Fearless Leader", description: "Reduce your active Cooldowns after getting an Elimination.", category: "", iconUrl: "/images/cards/Card_Fearless_Leader.png" },
    { name: "Heat Transfer", description: "Reduce the Cooldown of Chivalry.", category: "Chivalry", iconUrl: "/images/cards/Card_Heat_Transfer.png" },
    { name: "Hot Pursuit", description: "Increase the Movement Speed of allies near you.", category: "Fireball", iconUrl: "/images/cards/Card_Hot_Pursuit.png" },
    { name: "Immovable Object", description: "Reduce your damage taken.", category: "", iconUrl: "/images/cards/Card_Immovable_Object.png" },
    { name: "Incinerate", description: "Reduce the Cooldown of Fireball.", category: "Fireball", iconUrl: "/images/cards/Card_Incinerate.png" },
    { name: "Last Stand", description: "Increase the Shield of Chivalry.", category: "Chivalry", iconUrl: "/images/cards/Card_Last_Stand.png" },
    { name: "Launch", description: "Increase the Knockback distance of Charge.", category: "Charge", iconUrl: "/images/cards/Card_Launch.png" },
    { name: "Looks That Kill", description: "Reduce the Cooldown of Fireball.", category: "Fireball", iconUrl: "/images/cards/Card_Looks_That_Kill.png" },
    { name: "Pyre", description: "Increase the Burn damage of Flame Lance.", category: "", iconUrl: "/images/cards/Card_Pyre.png" },
    { name: "Running Start", description: "Increase the Movement Speed of Charge.", category: "Charge", iconUrl: "/images/cards/Card_Running_Start.png" },
    { name: "Safe Travel", description: "Heal after activating Charge.", category: "Charge", iconUrl: "/images/cards/Card_Safe_Travel.png" },
    { name: "Towering Barrier", description: "Reduce your damage taken while Chivalry is active.", category: "Chivalry", iconUrl: "/images/cards/Card_Towering_Barrier.png" },
    { name: "Unstoppable Force", description: "Apply a Slow to enemies hit by Charge.", category: "Charge", iconUrl: "/images/cards/Card_Unstoppable_Force.png" },
  ],
};

export const CHAMPION_DATA: Record<string, ChampionData> = {
  androxus: ANDROXUS_DATA,
  ash: ASH_DATA,
  atlas: ATLAS_DATA,
  azaan: AZAAN_DATA,
  barik: BARIK_DATA,
  fernando: FERNANDO_DATA,
};

export function getChampionData(slug: string): ChampionData | undefined {
  return CHAMPION_DATA[slug.toLowerCase()];
}

// Talent image paths
export function getTalentIconPath(championName: string, talentName: string): string {
  const slug = `${championName}_${talentName.replace(/\s+/g, "")}`;
  return `/images/champions/Talent ${championName} ${talentName}.png`;
}
