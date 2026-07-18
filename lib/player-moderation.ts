export type PlayerModeration = {
  cheater: boolean;
  susCount: number;
  dropper: boolean;
  afkWintrade: boolean;
  boosted: boolean;
  altAccount: boolean;
  verified: boolean;
};

const EMPTY: PlayerModeration = {
  cheater: false,
  susCount: 0,
  dropper: false,
  afkWintrade: false,
  boosted: false,
  altAccount: false,
  verified: false,
};
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<number, { value: PlayerModeration; expiresAt: number }>();
const pending = new Map<number, Array<(value: PlayerModeration) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;


// User-facing error keys — resolved at the UI layer via t()
export const MODERATION_ERROR_KEYS = {
  unableToLoadBadges: "generated.moderation.unableToLoadBadges",
  unableToLoadPrivateBadges: "generated.moderation.unableToLoadPrivateBadges",
} as const;

/** Keep fields already supplied by a canonical page payload over a fallback lookup. */
export function mergePlayerModeration(
  fallback: PlayerModeration,
  supplied: Partial<PlayerModeration>,
): PlayerModeration {
  return {
    cheater: supplied.cheater === undefined ? fallback.cheater : Boolean(supplied.cheater),
    susCount: supplied.susCount === undefined ? fallback.susCount : Number(supplied.susCount) || 0,
    dropper: supplied.dropper === undefined ? fallback.dropper : Boolean(supplied.dropper),
    afkWintrade: supplied.afkWintrade === undefined ? fallback.afkWintrade : Boolean(supplied.afkWintrade),
    boosted: supplied.boosted === undefined ? fallback.boosted : Boolean(supplied.boosted),
    altAccount: supplied.altAccount === undefined ? fallback.altAccount : Boolean(supplied.altAccount),
    verified: supplied.verified === undefined ? fallback.verified : Boolean(supplied.verified),
  };
}

type BulkPlayer = {
  id: string | number;
  cheater?: boolean;
  sus_count?: number;
  dropper?: boolean;
  afk_wintrade?: boolean;
  boosted?: boolean;
  alt_account?: boolean;
  verified?: boolean;
};

function moderationRows(json: { data?: { players?: BulkPlayer[] }; players?: BulkPlayer[] }): BulkPlayer[] {
  return json.data?.players ?? json.players ?? [];
}

function moderationFromRow(player: BulkPlayer): PlayerModeration {
  return {
    cheater: Boolean(player.cheater),
    susCount: Number(player.sus_count ?? 0),
    dropper: Boolean(player.dropper),
    afkWintrade: Boolean(player.afk_wintrade),
    boosted: Boolean(player.boosted),
    altAccount: Boolean(player.alt_account),
    verified: Boolean(player.verified),
  };
}

/** One database-only moderation read for data surfaces that already have player profiles. */
export async function fetchPlayerModerationBatch(playerIds: Array<string | number>): Promise<Map<number, PlayerModeration>> {
  const ids = [...new Set(playerIds
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0))]
    .slice(0, 50);
  if (ids.length === 0) return new Map();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "/api"}/players/bulk?ids=${ids.join(",")}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(MODERATION_ERROR_KEYS.unableToLoadBadges);
  const json = await response.json() as { data?: { players?: BulkPlayer[] }; players?: BulkPlayer[] };
  const expiresAt = Date.now() + TTL_MS;
  const results = new Map<number, PlayerModeration>();
  for (const player of moderationRows(json)) {
    const id = Number(player.id);
    const value = moderationFromRow(player);
    results.set(id, value);
    cache.set(id, { value, expiresAt });
  }
  return results;
}

/**
 * Read moderation for canonical private identities without mixing their serial
 * IDs into the public Hi-Rez player-ID cache.
 */
export async function fetchPrivateAccountModerationBatch(
  privateIds: Array<string | number>,
): Promise<Map<number, PlayerModeration>> {
  const ids = [...new Set(privateIds
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0))]
    .slice(0, 50);
  if (ids.length === 0) return new Map();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "/api"}/player-ext/private/bulk?ids=${ids.join(",")}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(MODERATION_ERROR_KEYS.unableToLoadPrivateBadges);
  const json = await response.json() as {
    accounts?: Array<{ id: string | number; cheater?: boolean; sus_count?: number }>;
  };
  return new Map((json.accounts ?? []).map((account) => [Number(account.id), {
    cheater: Boolean(account.cheater),
    susCount: Number(account.sus_count ?? 0),
    dropper: false,
    afkWintrade: false,
    boosted: false,
    altAccount: false,
    verified: false,
  }]));
}

async function flush() {
  timer = null;
  const ids = [...pending.keys()].slice(0, 50);
  if (ids.length === 0) return;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/players/bulk?ids=${ids.join(",")}`);
    if (!response.ok) throw new Error(MODERATION_ERROR_KEYS.unableToLoadBadges);
    const json = await response.json() as { data?: { players?: BulkPlayer[] }; players?: BulkPlayer[] };
    const results = new Map(moderationRows(json).map((player) => [Number(player.id), moderationFromRow(player)]));
    const expiresAt = Date.now() + TTL_MS;
    for (const id of ids) {
      const value = results.get(id) ?? EMPTY;
      cache.set(id, { value, expiresAt });
      const resolvers = pending.get(id) ?? [];
      pending.delete(id);
      resolvers.forEach((resolve) => resolve(value));
    }
  } catch {
    for (const id of ids) {
      const resolvers = pending.get(id) ?? [];
      pending.delete(id);
      resolvers.forEach((resolve) => resolve(EMPTY));
    }
  }

  if (pending.size > 0) timer = setTimeout(() => void flush(), 0);
}

/** Batches visible player-name status lookups and retains each result for five minutes. */
export function fetchPlayerModeration(playerId: string | number): Promise<PlayerModeration> {
  const id = Number(playerId);
  if (!Number.isSafeInteger(id) || id <= 0) return Promise.resolve(EMPTY);
  const cached = cache.get(id);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

  return new Promise((resolve) => {
    const resolvers = pending.get(id) ?? [];
    resolvers.push(resolve);
    pending.set(id, resolvers);
    if (!timer) timer = setTimeout(() => void flush(), 0);
  });
}
