import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      { source: "/stats/:path*", destination: "http://localhost:3005/stats/:path*" },
      { source: "/api/:path*", destination: "http://localhost:3005/api/:path*" },
    ];
  },
};

export default nextConfig;
