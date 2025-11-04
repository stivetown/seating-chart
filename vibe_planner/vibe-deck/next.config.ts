import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure Turbopack root directory to avoid workspace detection issues
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
