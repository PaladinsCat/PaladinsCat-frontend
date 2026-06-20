import type { NextConfig } from "next";

const apiDestination = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3304";

const nextConfig: NextConfig = {
  output: undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      { source: "/stats/:path*", destination: `${apiDestination}/stats/:path*` },
      { source: "/api/:path*", destination: `${apiDestination}/api/:path*` },
      { source: "/players/:path*", destination: `${apiDestination}/players/:path*` },
      { source: "/champions/:path*", destination: `${apiDestination}/champions/:path*` },
    ];
  },
};

export default nextConfig;
