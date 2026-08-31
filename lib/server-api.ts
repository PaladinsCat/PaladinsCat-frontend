/**
 * Keeps server api server-side and aligned with its data source.
 * Preserve its server boundary and caller-facing data contracts.
 */
import "server-only";

type ServerFetchOptions = Omit<RequestInit, "signal"> & {
  timeoutMs?: number;
};

function serverApiBase(): string {
  const value = (
    process.env.NEXT_SERVER_API_URL
    || process.env.NEXT_PUBLIC_API_URL
    || "http://localhost:3304"
  ).replace(/\/+$/, "");

  if (value.startsWith("/")) {
    throw new Error("Server API URL must be absolute");
  }
  return value;
}

/**
 * Fetches JSON from the backend with server-side caching, revalidation, and error handling.
 */
export async function fetchServerJson<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, ...requestOptions } = options;
  const response = await fetch(`${serverApiBase()}${path.startsWith("/") ? path : `/${path}`}`, {
    ...requestOptions,
    cache: requestOptions.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      ...requestOptions.headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Server API ${response.status} for ${path}`);
  }
  return response.json() as Promise<T>;
}
