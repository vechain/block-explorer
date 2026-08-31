import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
  },
  // No server to resize through, so `next/image` emits the remote URL as-is.
  images: { unoptimized: true, remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  output: 'export',
  webpack: config => {
    // Suppress webpack cache warnings
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  },
}

export default nextConfig
