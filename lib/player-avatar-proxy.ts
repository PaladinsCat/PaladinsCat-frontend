/**
 * Return the numeric ID from a PNG filename containing 1-10 digits with a nonzero first digit; return null for every other filename.
 * Validates and resolves player avatar proxy requests.
 * refs: none
 */
const HI_REZ_AVATAR_ORIGIN = "https://hirez-api.onrender.com";
const AVATAR_FILE_PATTERN = /^(?<id>[1-9]\d{0,9})\.png$/;

/**
 * Return the numeric ID from a PNG filename containing 1-10 digits with a nonzero first digit; return null for every other filename.
 * refs: none
 * I/O types: `file: string -> string | null`.
 */
export function parsePlayerAvatarFile(file: string): string | null {
  return AVATAR_FILE_PATTERN.exec(file)?.groups?.id ?? null;
}

/**
 * Build the fixed Hi-Rez avatar URL for the supplied ID; this builder does not validate the ID.
 * refs: none
 * I/O types: `avatarId: string -> string`.
 */
export function playerAvatarUpstreamUrl(avatarId: string): string {
  return `${HI_REZ_AVATAR_ORIGIN}/paladins/avatar/${avatarId}`;
}

/**
 * Return the local PNG proxy path only for a positive safe integer ID of at most ten digits and an exact trusted upstream URL. Reject credentials, query, fragment, mismatched paths/origins, and malformed URLs with null.
 * refs: none
 * I/O types: `avatarId: number; sourceUrl: string | null | undefined -> string | null`.
 */
export function playerAvatarProxyPath(
  avatarId: number,
  sourceUrl: string | null | undefined,
): string | null {
  if (!Number.isSafeInteger(avatarId) || avatarId <= 0 || avatarId > 9_999_999_999) {
    return null;
  }

  try {
    const parsed = new URL(sourceUrl ?? "");
    const expectedPath = `/paladins/avatar/${avatarId}`;
    if (
      parsed.origin !== HI_REZ_AVATAR_ORIGIN
      || parsed.pathname !== expectedPath
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return `/player-avatars/${avatarId}.png`;
}
