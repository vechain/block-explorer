import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  webpack: config => {
    // Suppress webpack cache warnings
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  },
}

export default nextConfig
