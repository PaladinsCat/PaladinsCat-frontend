import type { NextConfig } from "next";

const apiDestination =
  process.env.NEXT_SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3304";

const nextConfig: NextConfig = {
  output: undefined,
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
  async rewrites() {
    // Frontend page routes — must come BEFORE the catch-all
    const pages = [
      "/players/elo",
      "/players/leaderboard",
      "/players/cheaters",
      "/players/suspicious",
      "/players/weirdos",
      "/players/hall-of-fame",
      "/players/stats/:metric",
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

export default nextConfig;
