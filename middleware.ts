import { NextRequest, NextResponse } from "next/server";

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
 */
export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replaceAll("-", "");

  const csp = [
    "default-src 'self'",
    // NOTE: 'unsafe-inline' below is a legacy fallback only; browsers that
    // support 'strict-dynamic' ignore it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
    // Next.js injects inline styles (Tailwind, PostCSS, next/font) server-side.
    "style-src 'self' 'unsafe-inline'",
    // Player avatars, live-stream previews, and repository-owned blog images
    // are rendered from these fixed upstreams. Keep this an explicit allowlist;
    // do not broaden it to arbitrary HTTPS image hosts.
    "img-src 'self' data: blob: https://hirez-api.onrender.com https://static-cdn.jtvnw.net https://raw.githubusercontent.com",
    "font-src 'self' data:",
    // Same-origin /api is the proxied backend; api.github.com powers the blog feed.
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Apply only to page (HTML) document navigations; skip proxied API traffic,
  // Next static chunks, images, and other asset files.
  matcher: [
    "/((?!_next/static|_next/image|api|images/favicon|robots.txt|sitemap\\.xml|manifest\\.webmanifest).*)",
  ],
};
