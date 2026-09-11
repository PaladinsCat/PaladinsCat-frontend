/**
 * Fetches JSON from the backend with server-side caching, revalidation, and error handling.
 * Keeps server api server-side and aligned with its data source.
 * refs: none
 */
import "server-only";
import { cookies } from "next/headers";

type ServerFetchOptions = Omit<RequestInit, "signal"> & {
  timeoutMs?: number;
};

/** Forward the caller's session for protected SSR reads; never share account responses. */
export async function fetchAccountServerJson<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const session = (await cookies()).get("__Host-pc_session")?.value;
  if (!session) throw new Error("Login required");
  return fetchServerJson<T>(path, {
    ...options, cache: "no-store", headers: { ...options.headers, Authorization: `Bearer ${session}` },
  });
}

/** Resolve the absolute internal backend origin used by server-owned requests. */
export function serverApiBase(): string {
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
 * refs: none
 * I/O types: `path: string; options: ServerFetchOptions -> Promise<T>`.
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
