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

export const INARA_DATA: ChampionData = {
  name: "Inara",
  roles: ["Frontline"],
  stats: {
    health: "4700",
    speed: "350",
    speedUnits: "~21 units/s",
    range: "85",
  },
  skills: [
    {
      name: "Stone Spear",
      key: "LMB",
      iconUrl: "/images/skills/Ability_StoneSpear.png",
      damage: "3× 225 /1.25s",
      description: "Fire a burst of 3 sharp stone projectiles across the battlefield every 1.25s that each do 225 damage.",
    },
    {
      name: "Earthen Guard",
      key: "RMB",
      iconUrl: "/images/skills/Ability_EarthenGuard.png",
      cooldown: "11s",
      description: "Channel the Realm's strength, reducing damage taken by you and your deployables and increasing your healing received for a brief period of time.",
    },
    {
      name: "Impasse",
      key: "Q",
      iconUrl: "/images/skills/Ability_Impasse.png",
      damage: "5500",
      cooldown: "14s",
      description: "Deploy a 5500-Health stone wall from the ground to hinder enemies and protect allies.",
    },
    {
      name: "Warder's Field",
      key: "F",
      iconUrl: "/images/skills/Ability_WardersField.png",
      damage: "150 /1s",
      cooldown: "12s",
      description: "Deploy an obelisk that channels nature's wrath in an area to Slow and deal 150 damage every 1s to enemies caught inside.",
    },
    {
      name: "Seismic Crash",
      key: "E",
      iconUrl: "/images/skills/Ability_SeismicCrash.png",
      damage: "550",
      cooldown: "Ultimate",
      description: "Launch a powerful spear that pierces shields, Stunning and dealing 550 damage to enemies caught in its impact.",
    },
  ],
  talents: [
    { name: "Mother's Grace", description: "Increase the Damage Reduction of Earthen Guard by 10% and gain Immunity to Crowd Control while Earthen Guard is active.", category: "Earthen Guard", iconUrl: "/images/champions/Talent Inara MothersGrace.png" },
    { name: "Tremors", description: "Impasse now has 2 charges and its Cooldown is reduced to 12s, but you are unable to destroy your walls.", category: "Impasse", iconUrl: "/images/champions/Talent Inara Tremors.png" },
    { name: "Treacherous Ground", description: "The radius of Warder's Field is increased by 50% and it Cripples enemies within it.", category: "Warder's Field", iconUrl: "/images/champions/Talent Inara TreacherousGround.png" },
  ],
  loadouts: [
    { name: "Caretaker", description: "Heal for 22", category: "Warder's Field", iconUrl: "/images/cards/Card_Caretaker.png" },
    { name: "Cloudbreaker", description: "Increase the damage of Impasse.", category: "Impasse", iconUrl: "/images/cards/Card_Cloudbreaker.png" },
    { name: "Crag", description: "Increase the Health of Impasse.", category: "Impasse", iconUrl: "/images/cards/Card_Crag.png" },
    { name: "Geomancer", description: "Reduce the Cooldown of Earthen Guard.", category: "Earthen Guard", iconUrl: "/images/cards/Card_Geomancer.png" },
    { name: "Insurmountable", description: "Increase the number of Impasse walls.", category: "", iconUrl: "/images/cards/Card_Insurmountable.png" },
    { name: "Living Stone", description: "Increase the Damage Reduction of Earthen Guard.", category: "Earthen Guard", iconUrl: "/images/cards/Card_Living_Stone.png" },
    { name: "Lodestone", description: "Increase the damage of Warder's Field.", category: "Warder's Field", iconUrl: "/images/cards/Card_Lodestone.png" },
    { name: "Plateau", description: "Increase the Health of Impasse.", category: "Impasse", iconUrl: "/images/cards/Card_Plateau.png" },
    { name: "Rolling Stones", description: "Reduce the Cooldown of Warder's Field.", category: "", iconUrl: "/images/cards/Card_Rolling_Stones.png" },
    { name: "Sacred Ground", description: "Reduce the Cooldown of Warder's Field.", category: "Warder's Field", iconUrl: "/images/cards/Card_Sacred_Ground.png" },
    { name: "Shear", description: "Increase the Damage Reduction of Earthen Guard.", category: "Earthen Guard", iconUrl: "/images/cards/Card_Shear.png" },
    { name: "Standing Stones", description: "Reduce the Cooldown of Warder's Field.", category: "Warder's Field", iconUrl: "/images/cards/Card_Standing_Stones.png" },
    { name: "Steadfast", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Steadfast.png" },
    { name: "Stone Bulwark", description: "Increase the Damage Reduction of Earthen Guard.", category: "Earthen Guard", iconUrl: "/images/cards/Card_Stone_Bulwark.png" },
    { name: "Summit", description: "Increase the damage of Impasse.", category: "Impasse", iconUrl: "/images/cards/Card_Summit.png" },
    { name: "Whetstone", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Whetstone.png" },
  ],
};

export const KHAN_DATA: ChampionData = {
  name: "Khan",
  roles: ["Frontline"],
  stats: {
    health: "4000",
    speed: "350",
    speedUnits: "~21 units/s",
    range: "60",
  },
  skills: [
    {
      name: "Heavy Repeater",
      key: "LMB",
      iconUrl: "/images/skills/Ability_HeavyRepeater.png",
      damage: "210",
      description: "An automatic heavy repeater that riddles enemies with high-caliber bullets, dealing 210 damage every 0.22s.",
    },
    {
      name: "Bulwark",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Bulwark.png",
      damage: "4500",
      description: "Activate a shield that blocks up to 4500 damage and regenerates itself while not active.",
    },
    {
      name: "Battle Shout",
      key: "Q",
      iconUrl: "/images/skills/Ability_BattleShout.png",
      cooldown: "12s",
      description: "Release a battle-shout, becoming immune and healing yourself and nearby allies for 1350.",
    },
    {
      name: "Commander's Grab",
      key: "F",
      iconUrl: "/images/skills/Ability_CommandersGrab.png",
      cooldown: "12s",
      description: "Grab an enemy and slam them down, dealing damage to them and nearby enemies.",
    },
    {
      name: "Overpower",
      key: "E",
      iconUrl: "/images/skills/Ability_Overpower.png",
      cooldown: "Ultimate",
      description: "Fire a powerful shot that deals damage and applies Knockback to enemies in its path.",
    },
  ],
  talents: [
    { name: "Lian's Shield", description: "Your Shield now regenerates at 120% effectiveness, and regenerates even while it is active.", category: "Bulwark", iconUrl: "/images/champions/Talent Khan LiansShield.png" },
    { name: "Storm of Bullets", description: "Increase your Attack Speed by 40%, but reduce your damage-per-shot by 25%.", category: "Heavy Repeater", iconUrl: "/images/champions/Talent Khan StormofBullets.png" },
    { name: "Vortex Grip", description: "Commander's Grab now pulls all nearby enemies toward you and Stuns them for 1s.", category: "Commander's Grab", iconUrl: "/images/champions/Talent Khan VortexGrip.png" },
  ],
  loadouts: [
    { name: "Bloodthirst", description: "Gain Lifesteal.", category: "", iconUrl: "/images/cards/Card_Bloodthirst.png" },
    { name: "Chokehold", description: "Increase the Stun duration of Commander's Grab.", category: "Commander's Grab", iconUrl: "/images/cards/Card_Chokehold.png" },
    { name: "Close and Personal", description: "Reduce the Cooldown of Commander's Grab.", category: "Commander's Grab", iconUrl: "/images/cards/Card_Close_and_Personal.png" },
    { name: "Excessive Force", description: "Increase the number of targets Commander's Grab can hit.", category: "", iconUrl: "/images/cards/Card_Excessive_Force.png" },
    { name: "Hold The Line!", description: "Increase the healing of Battle Shout.", category: "Battle Shout", iconUrl: "/images/cards/Card_Hold_The_Line!.png" },
    { name: "Hopeguard", description: "Increase the Shield of Bulwark.", category: "Bulwark", iconUrl: "/images/cards/Card_Hopeguard.png" },
    { name: "Hulking Strength", description: "Reduce the Cooldown of Commander's Grab.", category: "Commander's Grab", iconUrl: "/images/cards/Card_Hulking_Strength.png" },
    { name: "Into The Breach!", description: "Increase the damage reduction of Battle Shout.", category: "Battle Shout", iconUrl: "/images/cards/Card_Into_The_Breach!.png" },
    { name: "Lifetaker", description: "Reduce the damage you take.", category: "", iconUrl: "/images/cards/Card_Lifetaker.png" },
    { name: "Martial Law", description: "Increase the number of targets Commander's Grab can hit.", category: "Commander's Grab", iconUrl: "/images/cards/Card_Martial_Law.png" },
    { name: "Never Surrender!", description: "Reduce the Cooldown of Battle Shout.", category: "Battle Shout", iconUrl: "/images/cards/Card_Never_Surrender!.png" },
    { name: "Open Fire!", description: "Increase the number of bullets from your weapon.", category: "Battle Shout", iconUrl: "/images/cards/Card_Open_Fire!.png" },
    { name: "Platemail", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Platemail.png" },
    { name: "Ready For War", description: "Increase the Shield of Bulwark.", category: "Bulwark", iconUrl: "/images/cards/Card_Ready_For_War.png" },
    { name: "Shield Wall", description: "Increase the Shield of Bulwark.", category: "Bulwark", iconUrl: "/images/cards/Card_Shield_Wall.png" },
    { name: "Vigorous Defense", description: "Increase the Shield of Bulwark.", category: "Bulwark", iconUrl: "/images/cards/Card_Vigorous_Defense.png" },
  ],
};

export const MAKOA_DATA: ChampionData = {
  name: "Makoa",
  roles: ["Frontline"],
  stats: {
    health: "4500",
    speed: "350",
    speedUnits: "~21 units/s",
    range: "75",
  },
  skills: [
    {
      name: "Cannon",
      key: "LMB",
      iconUrl: "/images/skills/Ability_Cannon.png",
      damage: "575",
      description: "A salvaged ship cannon that fires cannonballs every 1s, each dealing 575 damage.",
    },
    {
      name: "Dredge Anchor",
      key: "RMB",
      iconUrl: "/images/skills/Ability_DredgeAnchor.png",
      cooldown: "14s",
      description: "Fire a harpoon that pulls you toward an enemy or surface.",
    },
    {
      name: "Shell Shield",
      key: "Q",
      iconUrl: "/images/skills/Ability_ShellShield.png",
      damage: "4500",
      cooldown: "14s",
      description: "Create a shield in an area around you to protect yourself and allies from up to 4500 damage.",
    },
    {
      name: "Shell Spin",
      key: "F",
      iconUrl: "/images/skills/Ability_ShellSpin.png",
      cooldown: "12s",
      description: "Spin around, dealing damage to nearby enemies.",
    },
    {
      name: "Ancient Rage",
      key: "E",
      iconUrl: "/images/skills/Ability_AncientRage.png",
      cooldown: "Ultimate",
      description: "Call on the powers of the Ancients, increasing your health and trading your cannon for an anchor that deals 600 damage per swing.",
    },
  ],
  talents: [
    { name: "Pluck", description: "For 4s after hitting an enemy with Dredge Anchor, your next weapon shot against that enemy deals 75% increased damage.", category: "Dredge Anchor", iconUrl: "/images/champions/Talent Makoa Pluck.png" },
    { name: "Half Shell", description: "Shell Shield is placed on the ground instead of channeled around you and lasts 2s longer.", category: "Shell Shield", iconUrl: "/images/champions/Talent Makoa HalfShell.png" },
    { name: "Leviathan", description: "Increase your Ultimate charge rate by 25% and Health by 500. Ancient Rage now causes Makoa to grow 50% in size, resets all his Cooldowns, and increases his Movement Speed by 45%.", category: "Ancient Rage", iconUrl: "/images/champions/Talent Makoa Leviathan.png" },
  ],
  loadouts: [
    { name: "Ancient Resolve", description: "Increase the duration of Shell Shield.", category: "Shell Shield", iconUrl: "/images/cards/Card_Ancient_Resolve.png" },
    { name: "Barrier Reef", description: "Reduce the Cooldown of Shell Shield.", category: "Shell Shield", iconUrl: "/images/cards/Card_Barrier_Reef.png" },
    { name: "Carapace", description: "Increase the Shield of Shell Shield.", category: "Shell Shield", iconUrl: "/images/cards/Card_Carapace.png" },
    { name: "Crashing Wave", description: "Reduce the Cooldown of Shell Spin.", category: "Shell Spin", iconUrl: "/images/cards/Card_Crashing_Wave.png" },
    { name: "Determination", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Determination.png" },
    { name: "Ebb and Flow", description: "Reduce the damage you take.", category: "", iconUrl: "/images/cards/Card_Ebb_and_Flow.png" },
    { name: "Harden", description: "Reduce the Cooldown of Dredge Anchor.", category: "Dredge Anchor", iconUrl: "/images/cards/Card_Harden.png" },
    { name: "Lighter Cannonballs", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Lighter_Cannonballs.png" },
    { name: "Rampage", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Rampage.png" },
    { name: "Salvage", description: "Increase the pull distance of Dredge Anchor.", category: "Dredge Anchor", iconUrl: "/images/cards/Card_Salvage.png" },
    { name: "Sea Legs", description: "Increase the damage of Dredge Anchor.", category: "Dredge Anchor", iconUrl: "/images/cards/Card_Sea_Legs.png" },
    { name: "Spring Tide", description: "Increase the damage of Shell Spin.", category: "Shell Spin", iconUrl: "/images/cards/Card_Spring_Tide.png" },
    { name: "Strongarm", description: "Reduce the Cooldown of Dredge Anchor.", category: "Dredge Anchor", iconUrl: "/images/cards/Card_Strongarm.png" },
    { name: "Surf", description: "Increase the damage of Shell Spin.", category: "Shell Spin", iconUrl: "/images/cards/Card_Surf.png" },
    { name: "Tidal Grace", description: "Increase the Shield of Shell Shield.", category: "Shell Shield", iconUrl: "/images/cards/Card_Tidal_Grace.png" },
    { name: "Tsunami", description: "Increase the damage of Shell Spin.", category: "Shell Spin", iconUrl: "/images/cards/Card_Tsunami.png" },
  ],
};

export const NYX_DATA: ChampionData = {
  name: "Nyx",
  roles: ["Frontline"],
  stats: {
    health: "4700",
    speed: "350",
    speedUnits: "~21 units/s",
    range: "100",
  },
  skills: [
    {
      name: "Realm Breaker",
      key: "LMB",
      iconUrl: "/images/skills/Ability_RealmBreaker.png",
      damage: "200×3, 425×2",
      description: "Punch in a five hit attack chain, dealing 200 three times and 425 two times. Resets to the first hit after missing 2 hits or after 1.25s.",
    },
    {
      name: "Rift Slash",
      key: "RMB",
      iconUrl: "/images/skills/Ability_RiftSlash.png",
      damage: "200, 275, 350, 50, 200",
      cooldown: "11s",
      description: "Fire a projectile that deals damage and leaves behind an Abyssal Rift. The Rift slows enemies within 30 units and explodes after 2s.",
    },
    {
      name: "Abyssal Fortress",
      key: "Q",
      iconUrl: "/images/skills/Ability_AbyssalFortress.png",
      damage: "5000, 1500",
      cooldown: "12s",
      description: "Place a 5000 shield at the target location. The shield loses health the farther it is placed from you.",
    },
    {
      name: "Royal Presence",
      key: "F",
      iconUrl: "/images/skills/Ability_RoyalPresence.png",
      cooldown: "14s",
      description: "Gain increased Movement Speed and leave a trail that slows enemies.",
    },
    {
      name: "Chaos Nexus",
      key: "E",
      iconUrl: "/images/skills/Ability_ChaosNexus.png",
      cooldown: "Ultimate",
      description: "Create a rift that pulls enemies toward its center and deals damage over time.",
    },
  ],
  talents: [
    { name: "Show of Force", description: "Royal Presence now Stuns enemies that enter its area.", category: "Royal Presence", iconUrl: "/images/champions/Talent Nyx Show of Force.png" },
    { name: "Abyssal Breach", description: "Rift Slash now deals 50% more damage and the Abyssal Rift lasts 2s longer.", category: "Rift Slash", iconUrl: "/images/champions/Talent Nyx Abyssal Breach.png" },
    { name: "Subjugation", description: "Chaos Nexus now has a larger radius and pulls enemies faster.", category: "Chaos Nexus", iconUrl: "/images/champions/Talent Nyx Subjugation.png" },
  ],
  loadouts: [
    { name: "A Swift End", description: "Increase the damage of Abyssal Fortress.", category: "Abyssal Fortress", iconUrl: "/images/cards/Card_A_Swift_End.png" },
    { name: "Abyssal Authority", description: "Increase the slow effect of Royal Presence.", category: "Royal Presence", iconUrl: "/images/cards/Card_Abyssal_Authority.png" },
    { name: "All Will Kneel", description: "Increase the damage of Rift Slash.", category: "Rift Slash", iconUrl: "/images/cards/Card_All_Will_Kneel.png" },
    { name: "Brutal Pursuer", description: "Increase the damage of Rift Slash.", category: "Rift Slash", iconUrl: "/images/cards/Card_Brutal_Pursuer.png" },
    { name: "Center of Combat", description: "Increase the duration of Royal Presence.", category: "Royal Presence", iconUrl: "/images/cards/Card_Center_of_Combat.png" },
    { name: "Devastating Blows", description: "Increase the number of hits from Realm Breaker.", category: "", iconUrl: "/images/cards/Card_Devastating_Blows.png" },
    { name: "Face to Face", description: "Increase the slow effect of Royal Presence.", category: "Royal Presence", iconUrl: "/images/cards/Card_Face_to_Face.png" },
    { name: "Forever Changed", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Forever_Changed.png" },
    { name: "Frontline Commander", description: "Increase the Health of Abyssal Fortress.", category: "Abyssal Fortress", iconUrl: "/images/cards/Card_Frontline_Commander.png" },
    { name: "The Little Things", description: "Reduce the Cooldown of Rift Slash.", category: "", iconUrl: "/images/cards/Card_The_Little_Things.png" },
    { name: "The New Order", description: "Increase the healing of Royal Presence.", category: "Royal Presence", iconUrl: "/images/cards/Card_The_New_Order.png" },
    { name: "True Freedom", description: "Increase the damage of Realm Breaker.", category: "", iconUrl: "/images/cards/Card_True_Freedom.png" },
    { name: "Unbreakable Will", description: "Reduce the Cooldown of Abyssal Fortress.", category: "Abyssal Fortress", iconUrl: "/images/cards/Card_Unbreakable_Will.png" },
    { name: "Unchecked Power", description: "Increase the damage of Rift Slash.", category: "Rift Slash", iconUrl: "/images/cards/Card_Unchecked_Power.png" },
    { name: "Unyielding Advance", description: "Increase the Health of Abyssal Fortress.", category: "Abyssal Fortress", iconUrl: "/images/cards/Card_Unyielding_Advance.png" },
    { name: "World Torn Asunder", description: "Increase the damage of Rift Slash.", category: "Rift Slash", iconUrl: "/images/cards/Card_World_Torn_Asunder.png" },
  ],
};

export const RAUM_DATA: ChampionData = {
  name: "Raum",
  roles: ["Frontline"],
  stats: {
    health: "4500",
    speed: "365",
    speedUnits: "~22 units/s",
    range: "80",
  },
  skills: [
    {
      name: "Hellfire Gatling",
      key: "LMB",
      iconUrl: "/images/skills/Ability_HellfireGatling.png",
      damage: "40 /0.05s",
      description: "An Abyssal Gatling gun that shreds its targets' souls every 5 hits. Deals 40 damage every 0.05s when fully spun up. Each soul fragment can be consumed to gain soul armor.",
    },
    {
      name: "Ignition",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Ignition.png",
      cooldown: "10s",
      description: "Ignite your Gatling gun to fully spin it up and consume no ammo for 3s.",
    },
    {
      name: "Soul Harvest",
      key: "Q",
      iconUrl: "/images/skills/Ability_SoulHarvest.png",
      cooldown: "10s",
      description: "Harvest your enemies' shattered souls, drawing loose souls in and gaining 2000 soul armor on activation, as well as an additional 200 soul armor for each fragment collected.",
    },
    {
      name: "Juggernaut",
      key: "F",
      iconUrl: "/images/skills/Ability_Juggernaut.png",
      cooldown: "15s",
      description: "Charge forward, becoming immune to Crowd Control and dealing damage to enemies in your path.",
    },
    {
      name: "Cataclysm",
      key: "E",
      iconUrl: "/images/skills/Ability_Cataclysm.png",
      cooldown: "Ultimate",
      description: "Fire a devastating shot that deals massive damage in an area.",
    },
  ],
  talents: [
    { name: "Enforcer", description: "Gain 1.2s of Crowd Control Immunity and reduce your damage taken by 40% while using Juggernaut.", category: "Juggernaut", iconUrl: "/images/champions/Talent Raum Enforcer.png" },
    { name: "Earthsplitter", description: "Increase your Ultimate charge rate by 60%.", category: "Cataclysm", iconUrl: "/images/champions/Talent Raum Earthsplitter.png" },
    { name: "Subservience", description: "All your living allies are Healed for 1.5% of their maximum Health for each Soul Harvested.", category: "Soul Harvest", iconUrl: "/images/champions/Talent Raum Subservience.png" },
  ],
  loadouts: [
    { name: "Abhorrent Vista", description: "Reduce the Cooldown of Ignition.", category: "Ignition", iconUrl: "/images/cards/Card_Abhorrent_Vista.png" },
    { name: "Abyssal Connections", description: "Increase the duration of Ignition.", category: "Ignition", iconUrl: "/images/cards/Card_Abyssal_Connections.png" },
    { name: "Apocalypse", description: "Increase the damage of Juggernaut.", category: "Juggernaut", iconUrl: "/images/cards/Card_Apocalypse.png" },
    { name: "Declaration of War", description: "Increase the damage of Juggernaut.", category: "Juggernaut", iconUrl: "/images/cards/Card_Declaration_of_War.png" },
    { name: "Desperation", description: "Increase your damage when below 50% Health.", category: "", iconUrl: "/images/cards/Card_Desperation.png" },
    { name: "Fanning the Flames", description: "Increase the damage of Juggernaut.", category: "Juggernaut", iconUrl: "/images/cards/Card_Fanning_the_Flames.png" },
    { name: "Harbinger", description: "Reduce the Cooldown of Soul Harvest.", category: "Soul Harvest", iconUrl: "/images/cards/Card_Harbinger.png" },
    { name: "Hellish Lodestones", description: "Reduce the Cooldown of Ignition.", category: "Ignition", iconUrl: "/images/cards/Card_Hellish_Lodestones.png" },
    { name: "Infernal Reload", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Infernal_Reload.png" },
    { name: "Shattered Essence", description: "Increase the soul armor of Soul Harvest.", category: "Soul Harvest", iconUrl: "/images/cards/Card_Shattered_Essence.png" },
    { name: "Sinister Allies", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Sinister_Allies.png" },
    { name: "Subjugation", description: "Increase the damage of Juggernaut.", category: "Juggernaut", iconUrl: "/images/cards/Card_Subjugation.png" },
    { name: "Tormented Fissure", description: "Increase the duration of Ignition.", category: "Ignition", iconUrl: "/images/cards/Card_Tormented_Fissure.png" },
    { name: "Triumphant Ascension", description: "Increase the soul armor of Soul Harvest.", category: "Soul Harvest", iconUrl: "/images/cards/Card_Triumphant_Ascension.png" },
    { name: "Void Lord", description: "Reduce the Cooldown of Soul Harvest.", category: "Soul Harvest", iconUrl: "/images/cards/Card_Void_Lord.png" },
    { name: "War-Torn Plains", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_War-Torn_Plains.png" },
  ],
};

export const RUCKUS_DATA: ChampionData = {
  name: "Ruckus",
  roles: ["Frontline"],
  stats: {
    health: "4000",
    speed: "365",
    speedUnits: "~22 units/s",
    range: "85",
  },
  skills: [
    {
      name: "Miniguns",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Ruckus_Icon.png",
      damage: "40 /0.05s",
      description: "Fast-firing miniguns that shred your enemies with bullets, dealing 40 damage every 0.05s when fully spun up.",
    },
    {
      name: "Missile Launcher",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Missile_Launcher.png",
      damage: "225",
      cooldown: "10s",
      description: "Fire large missiles that explode and deal 225 damage each. Has 3 charges.",
    },
    {
      name: "Emitter",
      key: "Q",
      iconUrl: "/images/skills/Ability_Emitter.png",
      cooldown: "12s",
      description: "Shield yourself for up to 2500 damage for a brief time.",
    },
    {
      name: "Advance",
      key: "F",
      iconUrl: "/images/skills/Ability_Advance.png",
      cooldown: "5s",
      description: "Jet in the direction you're moving, maintaining your ability to fire. Stationary use launches upward.",
    },
    {
      name: "Hexa Fire",
      key: "E",
      iconUrl: "/images/skills/Ability_Hexa_Fire.png",
      cooldown: "Ultimate",
      description: "Unleash 2 miniguns and rocket launchers that unload their ammo over a short duration. The guns deal 120 damage every 0.04s and the launchers deal 250 damage every 0.25s.",
    },
  ],
  talents: [
    { name: "Flux Generator", description: "Increase the Shield granted by Emitter by 1000 and reduce its cooldown by 1s. While Emitter is active, gain Immunity to Crowd Control.", category: "Emitter", iconUrl: "/images/champions/Talent Ruckus FluxGenerator.png" },
    { name: "Rocket Barrage", description: "Increase the radius of Missile Launcher's explosions by 66%.", category: "Missile Launcher", iconUrl: "/images/champions/Talent Ruckus RocketBarrage.png" },
    { name: "Aerial Assault", description: "Advance gains a 3rd charge.", category: "Advance", iconUrl: "/images/champions/Talent Ruckus Aerial Assault.png" },
  ],
  loadouts: [
    { name: "Air Cooled", description: "Increase the duration of Advance.", category: "Advance", iconUrl: "/images/cards/Card_Air_Cooled.png" },
    { name: "At The Ready", description: "Increase the number of missiles of Missile Launcher.", category: "Missile Launcher", iconUrl: "/images/cards/Card_At_the_Ready.png" },
    { name: "Countermeasure", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Countermeasure.png" },
    { name: "Crystal Capacitor", description: "Reduce the Cooldown of Missile Launcher.", category: "Missile Launcher", iconUrl: "/images/cards/Card_Crystal_Capacitor.png" },
    { name: "Dampener", description: "Increase the Shield of Emitter.", category: "", iconUrl: "/images/cards/Card_Dampener.png" },
    { name: "Extended Magazines", description: "Increase the duration of Advance.", category: "Advance", iconUrl: "/images/cards/Card_Extended_Magazines.png" },
    { name: "Fuel Reserves", description: "Increase the duration of Advance.", category: "Advance", iconUrl: "/images/cards/Card_Fuel_Reserves.png" },
    { name: "Metal March", description: "Reduce the Cooldown of Missile Launcher.", category: "Missile Launcher", iconUrl: "/images/cards/Card_Metal_March.png" },
    { name: "Nanotechnology", description: "Increase the Shield of Emitter.", category: "Emitter", iconUrl: "/images/cards/Card_Nanotechnology.png" },
    { name: "No Chill", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_No_Chill.png" },
    { name: "Opulence", description: "Increase the number of missiles of Missile Launcher.", category: "Missile Launcher", iconUrl: "/images/cards/Card_Opulence.png" },
    { name: "Proximity", description: "Reduce the Cooldown of Advance.", category: "Advance", iconUrl: "/images/cards/Card_Proximity.png" },
    { name: "Quick Loader", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Quick_Loader.png" },
    { name: "Refraction", description: "Reduce the Cooldown of Emitter.", category: "Emitter", iconUrl: "/images/cards/Card_Refraction.png" },
    { name: "Regenerative Alloy", description: "Increase the Shield of Emitter.", category: "Emitter", iconUrl: "/images/cards/Card_Regenerative_Alloy.png" },
    { name: "Warden", description: "Increase the duration of Emitter.", category: "Emitter", iconUrl: "/images/cards/Card_Warden.png" },
  ],
};

export const TERMINUS_DATA: ChampionData = {
  name: "Terminus",
  roles: ["Frontline"],
  stats: {
    health: "4000",
    speed: "350",
    speedUnits: "~22 units/s",
    range: "18",
  },
  skills: [
    {
      name: "Massacre Axe",
      key: "LMB",
      iconUrl: "/images/skills/WeaponAttack_Terminus_Icon.png",
      damage: "650",
      description: "Swing a massive axe every 1.1s to rend foes in front of you for 650 damage.",
    },
    {
      name: "Calamity Blast",
      key: "RMB",
      iconUrl: "/images/skills/Ability_Calamity_Blast.png",
      damage: "250",
      cooldown: "2s",
      description: "Fire a mass of Calamity from your hand and an additional one for every stored charge, dealing 250 damage per blast.",
    },
    {
      name: "Power Siphon",
      key: "Q",
      iconUrl: "/images/skills/Ability_Power_Siphon.png",
      damage: "1200",
      cooldown: "1s",
      description: "Create a powerful funnel that absorbs enemy attacks to generate Calamity Charges.",
    },
    {
      name: "Shatterfall",
      key: "F",
      iconUrl: "/images/skills/Ability_Shatterfall.png",
      cooldown: "12s",
      description: "Leap into the air and slam down, dealing damage and stunning enemies.",
    },
    {
      name: "Reanimate",
      key: "E",
      iconUrl: "/images/skills/Ability_Reanimate.png",
      damage: "2600",
      cooldown: "Ultimate",
      description: "Revive yourself after a short time and deal 2600 damage to enemies upon reviving.",
    },
  ],
  talents: [
    { name: "Undying", description: "Reduce the damage you take by 15% while at or below 50% Health.", category: "", iconUrl: "/images/champions/Talent Terminus Undying.png" },
    { name: "Crush", description: "Shatterfall deals 50% more damage and has a larger area of effect, but its Cooldown is increased by 4s.", category: "Shatterfall", iconUrl: "/images/champions/Talent Terminus Crush.png" },
    { name: "Decimation", description: "Each Calamity Blast deals an additional 100 damage.", category: "Calamity Blast", iconUrl: "/images/champions/Talent Terminus Decimation.png" },
  ],
  loadouts: [
    { name: "Abomination", description: "Increase the damage of Calamity Blast.", category: "Calamity Blast", iconUrl: "/images/cards/Card_Abomination.png" },
    { name: "Blood and Stone", description: "Increase the damage of Shatterfall.", category: "Shatterfall", iconUrl: "/images/cards/Card_Blood_and_Stone.png" },
    { name: "Despoiler", description: "Increase the damage of Power Siphon.", category: "Shatterfall", iconUrl: "/images/cards/Card_Despoiler.png" },
    { name: "Devastation", description: "Increase the damage of Calamity Blast.", category: "Calamity Blast", iconUrl: "/images/cards/Card_Devastation.png" },
    { name: "Forsaken", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_Forsaken.png" },
    { name: "Hulking Monstrosity", description: "Increase your maximum Health.", category: "", iconUrl: "/images/cards/Card_Hulking_Monstrosity.png" },
    { name: "It Follows", description: "Increase the damage of Calamity Blast.", category: "Calamity Blast", iconUrl: "/images/cards/Card_It_Follows.png" },
    { name: "It Waits", description: "Reduce the Cooldown of Power Siphon.", category: "Power Siphon", iconUrl: "/images/cards/Card_It_Waits.png" },
    { name: "It Watches", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_It_Watches.png" },
    { name: "Necromantic Might", description: "Increase the damage of Power Siphon.", category: "Power Siphon", iconUrl: "/images/cards/Card_Necromantic_Might.png" },
    { name: "Playing God", description: "Increase the damage of Power Siphon.", category: "Power Siphon", iconUrl: "/images/cards/Card_Playing_God.png" },
    { name: "Powerslave", description: "Increase the damage of Power Siphon.", category: "Power Siphon", iconUrl: "/images/cards/Card_Powerslave.png" },
    { name: "Strength of Stone", description: "Increase the damage of Shatterfall.", category: "Calamity Blast", iconUrl: "/images/cards/Card_Strength_of_Stone.png" },
    { name: "Unfeeling", description: "Reduce the damage you take.", category: "Shatterfall", iconUrl: "/images/cards/Card_Unfeeling.png" },
    { name: "We Can Rebuild Him", description: "Increase your damage.", category: "", iconUrl: "/images/cards/Card_We_Can_Rebuild_Him.png" },
    { name: "Wrecking Ball", description: "Increase the damage of Shatterfall.", category: "Shatterfall", iconUrl: "/images/cards/Card_Wrecking_Ball.png" },
  ],
};

export const CHAMPION_DATA: Record<string, ChampionData> = {
  androxus: ANDROXUS_DATA,
  ash: ASH_DATA,
  atlas: ATLAS_DATA,
  azaan: AZAAN_DATA,
  barik: BARIK_DATA,
  fernando: FERNANDO_DATA,
  inara: INARA_DATA,
  khan: KHAN_DATA,
  makoa: MAKOA_DATA,
  nyx: NYX_DATA,
  raum: RAUM_DATA,
  ruckus: RUCKUS_DATA,
  terminus: TERMINUS_DATA,
};

export function getChampionData(slug: string): ChampionData | undefined {
  return CHAMPION_DATA[slug.toLowerCase()];
}

// Talent image paths
export function getTalentIconPath(championName: string, talentName: string): string {
  const slug = `${championName}_${talentName.replace(/\s+/g, "")}`;
  return `/images/champions/Talent ${championName} ${talentName}.png`;
}
