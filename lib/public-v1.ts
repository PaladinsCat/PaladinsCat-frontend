/** Build a same-origin URL for a staged public v1 backend route. */
export function publicV1Path(path: string): string {
  const value = path.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) {
    throw new Error("public v1 paths must be relative backend paths");
  }

  const candidate = value === "/api/v1" || value.startsWith("/api/v1/")
    ? value
    : `/api/v1/${value.replace(/^\/+/, "")}`;
  const resolved = new URL(candidate, "https://paladinscat.invalid");
  if (resolved.pathname !== "/api/v1" && !resolved.pathname.startsWith("/api/v1/")) {
    throw new Error("public v1 paths cannot escape the v1 prefix");
  }
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
