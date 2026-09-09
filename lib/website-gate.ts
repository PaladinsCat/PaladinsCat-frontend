/** Signed guest admission; this never grants account, operator, or developer privileges. */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const GUEST_COOKIE = "__Host-pc_guest";
export const GUEST_TTL_SECONDS = 24 * 60 * 60;

function signature(payload: string, secret: string, origin: string): Buffer {
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error("Invalid website gate secret");
  return createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`pc-guest-v1|${origin}|${payload}`).digest();
}

export function issueGuest(secret: string, origin: string, now = Date.now()): string {
  const payload = `${randomUUID()}.${Math.floor(now / 1000) + GUEST_TTL_SECONDS}`;
  return `${payload}.${signature(payload, secret, origin).toString("hex")}`;
}

export function validGuest(token: string | undefined, secret: string, origin: string, now = Date.now()): boolean {
  if (!token || !/^[a-f0-9-]{36}\.\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const [id, expiry, mac] = token.split(".");
  const remaining = Number(expiry) - Math.floor(now / 1000);
  if (remaining <= 0 || remaining > GUEST_TTL_SECONDS) return false;
  return timingSafeEqual(Buffer.from(mac, "hex"), signature(`${id}.${expiry}`, secret, origin));
}

/** Fetch metadata and Origin are additional CSRF controls, not authentication. */
export function safeWebsiteRequest(headers: Headers, origin: string): boolean {
  const site = headers.get("sec-fetch-site");
  const suppliedOrigin = headers.get("origin");
  return (!site || site === "same-origin") && (!suppliedOrigin || suppliedOrigin === origin);
}

export function websiteApiPath(path: string): boolean {
  return path === "/api" || path.startsWith("/api/") || path === "/_pc" || path.startsWith("/_pc/");
}
