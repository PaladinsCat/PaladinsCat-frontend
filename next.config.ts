/** next.config component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
import type { NextConfig } from "next";

const apiDestination =
  process.env.NEXT_SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://paladinscat.com/api";

const nextConfig: NextConfig = {
  output: undefined,
  // A local proxy instance can run beside another Next dev server without
  // contending for its .next/dev lock. Production keeps the normal .next path.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Production builds on the local desktop can fan out to many workers, but
    // the VPS runs the whole Docker stack in a 2GB budget. Keep static
    // generation conservative by default; raise NEXT_BUILD_CPUS locally when
    // intentionally benchmarking or building on a larger machine.
    cpus: Number(process.env.NEXT_BUILD_CPUS || 2),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      { source: "/stats", destination: "/stats/performance", permanent: true },
      { source: "/stats/metrics", destination: "/stats/performance", permanent: true },
      { source: "/stats/egpm", destination: "/stats/ecpm", permanent: true },
      { source: "/stats/items/:path*", destination: "/game/items/:path*", permanent: true },
      { source: "/stats/maps/:path*", destination: "/game/maps/:path*", permanent: true },
      { source: "/stats/compositions", destination: "/game/compositions", permanent: true },
      { source: "/players/stats/:metric", destination: "/players/performance", permanent: true },
    ];
  },
  async rewrites() {
    // Frontend page routes — must come BEFORE the catch-all
    const pages = [
      "/players/elo",
      "/players/leaderboard",
      "/players/cheaters",
      "/players/suspicious",
      "/players/weirdos",
      "/players/hall-of-fame",
      "/players/class/:role",
    ];
    return [
      ...pages.map((src) => ({ source: src, destination: src })),
      // Browser clients call same-origin /api/*; the Next server strips that
      // proxy prefix and forwards to the backend service. This keeps the public
      // website working even when the direct backend debug port is filtered.
      { source: "/api/:path*", destination: `${apiDestination}/:path*` },
      // Champion page bundles are requested by the browser as a neutral data
      // route. Some embedded browsers block navigations/fetches under /api,
      // even though the same-origin backend response is healthy.
      { source: "/_pc/:path*", destination: `${apiDestination}/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=14400, s-maxage=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
      {
        source: "/_pc/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * refs: none
 */
export default nextConfig;
