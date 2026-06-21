export interface StaticChampion {
  id: number;
  name: string;
  roles: string[];
}

// Lightweight real champion roster used by search and filters. This is
// reference metadata only; missing stats/leaderboard data should render empty
// states or 404s, never synthetic rows.
export const STATIC_CHAMPIONS: StaticChampion[] = [
  {
    "id": 1,
    "name": "Ash",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 2,
    "name": "Atlas",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 3,
    "name": "Azaan",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 4,
    "name": "Barik",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 5,
    "name": "Fernando",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 6,
    "name": "Inara",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 7,
    "name": "Khan",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 8,
    "name": "Makoa",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 9,
    "name": "Nyx",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 10,
    "name": "Raum",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 11,
    "name": "Ruckus",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 12,
    "name": "Terminus",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 13,
    "name": "Torvald",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 14,
    "name": "Yagorath",
    "roles": [
      "Frontline"
    ]
  },
  {
    "id": 15,
    "name": "Betty La Bomba",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 16,
    "name": "Bomb King",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 17,
    "name": "Cassie",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 18,
    "name": "Dredge",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 19,
    "name": "Drogoz",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 20,
    "name": "Imani",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 21,
    "name": "Kinessa",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 22,
    "name": "Lian",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 23,
    "name": "Octavia",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 24,
    "name": "Omen",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 25,
    "name": "Saati",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 26,
    "name": "Sha Lin",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 27,
    "name": "Strix",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 28,
    "name": "Tiberius",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 29,
    "name": "Tyra",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 30,
    "name": "Viktor",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 31,
    "name": "Vivian",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 32,
    "name": "Willo",
    "roles": [
      "Damage"
    ]
  },
  {
    "id": 33,
    "name": "Androxus",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 34,
    "name": "Buck",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 35,
    "name": "Caspian",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 36,
    "name": "Evie",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 37,
    "name": "Kasumi",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 38,
    "name": "Koga",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 39,
    "name": "Lex",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 40,
    "name": "Maeve",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 41,
    "name": "Skye",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 42,
    "name": "Talus",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 43,
    "name": "Vatu",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 44,
    "name": "VII",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 45,
    "name": "Vora",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 46,
    "name": "Zhin",
    "roles": [
      "Flank"
    ]
  },
  {
    "id": 47,
    "name": "Corvus",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 48,
    "name": "Furia",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 49,
    "name": "Grohk",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 50,
    "name": "Grover",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 51,
    "name": "Io",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 52,
    "name": "Jenos",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 53,
    "name": "Lillith",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 54,
    "name": "Mal Damba",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 55,
    "name": "Moji",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 56,
    "name": "Pip",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 57,
    "name": "Rei",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 58,
    "name": "Seris",
    "roles": [
      "Support"
    ]
  },
  {
    "id": 59,
    "name": "Ying",
    "roles": [
      "Support"
    ]
  }
];
