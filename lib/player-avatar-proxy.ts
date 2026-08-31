/** Validates and resolves player avatar proxy requests.
 * The module owns its existing image, OIDC, proxy, roster, or moderation boundary.
 */
const HI_REZ_AVATAR_ORIGIN = "https://hirez-api.onrender.com";
const AVATAR_FILE_PATTERN = /^(?<id>[1-9]\d{0,9})\.png$/;

/** Apply parsePlayerAvatarFile to the declared request or domain inputs.
 * Contract: validates inputs, preserves the existing security or mapping rules, and returns the documented result.
 */
export function parsePlayerAvatarFile(file: string): string | null {
  return AVATAR_FILE_PATTERN.exec(file)?.groups?.id ?? null;
}

/** Apply playerAvatarUpstreamUrl to the declared request or domain inputs.
 * Contract: validates inputs, preserves the existing security or mapping rules, and returns the documented result.
 */
export function playerAvatarUpstreamUrl(avatarId: string): string {
  return `${HI_REZ_AVATAR_ORIGIN}/paladins/avatar/${avatarId}`;
}

/** Apply playerAvatarProxyPath to the declared request or domain inputs.
 * Contract: validates inputs, preserves the existing security or mapping rules, and returns the documented result.
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
