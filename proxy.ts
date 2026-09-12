/** proxy component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { GUEST_COOKIE, GUEST_TTL_SECONDS, issueGuest, validGuest, safeWebsiteRequest, websiteApiPath } from "./lib/website-gate";
import { isAccountOnlyPath, isVerifiedOnlyPath } from "./lib/verified-access";
import { serverApiBase } from "./lib/server-api";
import { anonymousPresenceRequestAllowed } from "./lib/anonymous-presence-gate";

const ACCOUNT_SESSION_COOKIE = "__Host-pc_session";
type AccountSessionState = "guest" | "unverified" | "verified" | "unavailable";

/** Validate the opaque browser session through the backend auth owner. */
async function accountSessionState(request: NextRequest): Promise<AccountSessionState> {
  const session = request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value;
  if (!session) return "guest";
  try {
    const response = await fetch(`${serverApiBase()}/auth/me`, {
      headers: { accept: "application/json", authorization: `Bearer ${session}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });
    if (response.status === 401 || response.status === 403) return "guest";
    if (!response.ok) return "unavailable";
    const account = await response.json() as { linked_player_id?: unknown };
    const linkedPlayerId = Number(account.linked_player_id);
    return Number.isSafeInteger(linkedPlayerId) && linkedPlayerId > 0 ? "verified" : "unverified";
  } catch {
    return "unavailable";
  }
}

/** Redirect a protected website request without accepting caller-controlled origins. */
function accessRedirect(request: NextRequest, destination: "/auth/login" | "/link-account") {
  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = "";
  if (destination === "/auth/login") {
    url.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  }
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/**
 * Content-Security-Policy with a per-request nonce.
 *
 * The nonce is generated here, placed in the outgoing Content-Security-Policy
 * header, and handed to the App Router via the `x-nonce` request header so the
 * root layout can tag its own inline scripts (e.g. the JSON-LD block) with the
 * matching nonce. Next.js applies the same nonce to the inline scripts it
 * emits (RSC bootstrap, fonts, devtools), which is why `script-src` carries
 * the nonce plus `'strict-dynamic'`. `'unsafe-inline'` in script-src is a
 * harmless fallback for legacy browsers that do not understand nonces —
 * modern browsers that support `strict-dynamic`/nonces ignore it.
 *
 * style-src keeps `'unsafe-inline'` because Next.js + Tailwind rely on inline
 * <style> injection; removing it breaks the app rather than hardening it.
 *
 * NOTE: This file was `middleware.ts` until the Next.js 16 rename to the
 * `proxy` file convention (https://nextjs.org/docs/messages/middleware-to-proxy).
 * refs: none
 */
export async function proxy(request: NextRequest) {
  // The production nonce policy makes Next's development runtime defer client
  // hydration. Dev servers must not be used as a public surface; let Next
  // handle its local assets and HMR without injecting production headers.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  // Do not let percent-encoded namespace aliases reach a rewrite without admission.
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
    if (websiteApiPath(decodedPath) && !websiteApiPath(path)) {
      return NextResponse.json({ error: { code: "NON_CANONICAL_API_PATH" } }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }
  } catch {
    return NextResponse.json({ error: { code: "INVALID_PATH" } }, { status: 400 });
  }
  const api = websiteApiPath(path);
  // This one bodyless endpoint cannot participate in guest/account admission.
  // Its dedicated handler strips transport metadata before the anonymous counter.
  if (path === "/api/analytics/presence") {
    if (!anonymousPresenceRequestAllowed(request, process.env.PALADINSCAT_PUBLIC_ORIGIN || "https://paladinscat.com")) {
      return new NextResponse(null, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  // Developer routes authenticate in Rust; Next-owned OIDC endpoints retain
  // their state/CSRF/signature checks, including provider callbacks without a guest cookie.
  const oidcEndpoint = ["login", "callback", "logout", "account", "backchannel-logout"]
    .some((name) => path === `/api/auth/oidc/${name}`);
  if (path === "/api/v1" || path.startsWith("/api/v1/") || oidcEndpoint) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const verifiedOnly = isVerifiedOnlyPath(decodedPath);
  if (verifiedOnly || isAccountOnlyPath(decodedPath)) {
    const state = await accountSessionState(request);
    if (state === "guest") return accessRedirect(request, "/auth/login");
    if (verifiedOnly && state === "unverified") return accessRedirect(request, "/link-account");
    if (state === "unavailable") {
      return NextResponse.json({ error: { code: "AUTHENTICATION_UNAVAILABLE" } }, {
        status: 503, headers: { "Cache-Control": "private, no-store" },
      });
    }
  }
  const origin = process.env.PALADINSCAT_PUBLIC_ORIGIN || "https://paladinscat.com";
  let secret: string;
  try {
    secret = readFileSync(
      /* turbopackIgnore: true */ process.env.PALADINSCAT_WEBSITE_GATE_SECRET_FILE || "",
      "utf8",
    ).trim();
    if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error("Invalid website gate secret");
  } catch {
    return NextResponse.json({ error: { code: "WEBSITE_GATE_UNAVAILABLE" } }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
  const admitted = validGuest(request.cookies.get(GUEST_COOKIE)?.value, secret, origin);
  if (api) {
    if (!admitted || !safeWebsiteRequest(request.headers, origin)) {
      return NextResponse.json({ error: { code: "WEBSITE_SESSION_REQUIRED", message: "Open the website to establish a guest session. External clients must use /api/v1 with a registered API key." } }, {
        status: 403, headers: { "Cache-Control": "private, no-store" },
      });
    }
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const nonce = crypto.randomUUID().replaceAll("-", "");
  const forwardedProtocol = request.headers.get("x-forwarded-proto")
    ?? request.nextUrl.protocol.replace(":", "");

  const csp = [
    "default-src 'self'",
    // 'unsafe-inline' below is a legacy fallback only; browsers that support
    // 'strict-dynamic' ignore it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
    // Next.js injects inline styles (Tailwind, PostCSS, next/font) server-side.
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    // Player avatars, live-stream previews, and repository-owned blog images
    // are rendered from these fixed upstreams. Keep this an explicit allowlist;
    // do not broaden it to arbitrary HTTPS image hosts.
    "img-src 'self' data: blob: https://hirez-api.onrender.com https://static-cdn.jtvnw.net https://raw.githubusercontent.com",
    "font-src 'self' data:",
    // Same-origin /api is the proxied backend; api.github.com powers the blog feed.
    "connect-src 'self' https://api.github.com",
    "media-src 'self' https://medal.tv https://cdn.medal.tv https://cdn.discordapp.com https://media.discordapp.net",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://clips.twitch.tv",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(forwardedProtocol === "https" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  if (!admitted && request.method === "GET" && request.headers.get("accept")?.includes("text/html")) {
    response.cookies.set(GUEST_COOKIE, issueGuest(secret, origin), {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: GUEST_TTL_SECONDS,
    });
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * refs: none
 */
export const config = {
  // Cover both API aliases as well as documents; static assets need no guest cookie.
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|images/|fonts/|locales/|robots.txt|sitemap\\.xml|manifest\\.webmanifest).*)",
  ],
};
