export type PlayerModeration = {
  cheater: boolean;
  susCount: number;
  verified: boolean;
};

const EMPTY: PlayerModeration = { cheater: false, susCount: 0, verified: false };
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<number, { value: PlayerModeration; expiresAt: number }>();
const pending = new Map<number, Array<(value: PlayerModeration) => void>>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  timer = null;
  const ids = [...pending.keys()].slice(0, 50);
  if (ids.length === 0) return;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/players/bulk?ids=${ids.join(",")}`);
    if (!response.ok) throw new Error("Unable to load player badges");
    const json = await response.json() as { data?: { players?: Array<{ id: string | number; cheater?: boolean; sus_count?: number; verified?: boolean }> }; players?: Array<{ id: string | number; cheater?: boolean; sus_count?: number; verified?: boolean }> };
    const players = json.data?.players ?? json.players ?? [];
    const results = new Map(players.map((player) => [Number(player.id), {
      cheater: Boolean(player.cheater),
      susCount: Number(player.sus_count ?? 0),
      verified: Boolean(player.verified),
    }]));
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
