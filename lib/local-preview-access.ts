/** Local UI testing policy; never grants API privileges or production access. */
export function localPreviewAccessAllowed(mode: string | undefined, enabled: string | undefined, hostname: string): boolean {
  return mode === "development" && enabled === "1"
    && ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}
