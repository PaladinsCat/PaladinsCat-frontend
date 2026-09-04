/**
 * Maintain the checked-in champion catalog used by search and filter fallbacks.
 *
 * This module supplies identity and role metadata only; it does not synthesize
 * live statistics or leaderboard records.
 * refs: none
 */
export interface StaticChampion {
  id: number;
  name: string;
  roles: string[];
}

// Lightweight real champion roster used by search and filters. This is
// reference metadata only; missing stats/leaderboard data should render empty
// states or 404s, never synthetic rows.
/**
 * List the canonical champion IDs, names, and roles available to local UI filters.
 *
 * Returns static metadata without network, authentication, cache, or persistence effects.
 * refs: none
 */
export const STATIC_CHAMPIONS: StaticChampion[] = [  {
    "id": 2404,
    "name": "Ash",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2512,
    "name": "Atlas",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2548,
    "name": "Azaan",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2073,
    "name": "Barik",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2071,
    "name": "Fernando",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2348,
    "name": "Inara",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2479,
    "name": "Khan",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2288,
    "name": "Makoa",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2560,
    "name": "Nyx",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2528,
    "name": "Raum",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2149,
    "name": "Ruckus",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2477,
    "name": "Terminus",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2322,
    "name": "Torvald",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2538,
    "name": "Yagorath",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2550,
    "name": "Betty La Bomba",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2281,
    "name": "Bomb King",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2092,
    "name": "Cassie",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2495,
    "name": "Dredge",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2277,
    "name": "Drogoz",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2509,
    "name": "Imani",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2249,
    "name": "Kinessa",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2417,
    "name": "Lian",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2540,
    "name": "Octavia",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2566,
    "name": "Omen",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2543,
    "name": "Saati",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2307,
    "name": "Sha Lin",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2438,
    "name": "Strix",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2529,
    "name": "Tiberius",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2314,
    "name": "Tyra",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2285,
    "name": "Viktor",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2480,
    "name": "Vivian",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2393,
    "name": "Willo",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 2205,
    "name": "Androxus",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2147,
    "name": "Buck",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2554,
    "name": "Caspian",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2094,
    "name": "Evie",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2555,
    "name": "Kasumi",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2493,
    "name": "Koga",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2362,
    "name": "Lex",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2338,
    "name": "Maeve",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2057,
    "name": "Skye",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2472,
    "name": "Talus",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2541,
    "name": "Vatu",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2549,
    "name": "VII",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2536,
    "name": "Vora",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2420,
    "name": "Zhin",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 2533,
    "name": "Corvus",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2491,
    "name": "Furia",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2093,
    "name": "Grohk",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2254,
    "name": "Grover",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2517,
    "name": "Io",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2431,
    "name": "Jenos",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2551,
    "name": "Lillith",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2303,
    "name": "Mal Damba",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2481,
    "name": "Moji",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2056,
    "name": "Pip",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2542,
    "name": "Rei",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2372,
    "name": "Seris",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 2267,
    "name": "Ying",
    "roles": [
      "Support"
    ]
  }
];
