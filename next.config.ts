import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
  },
  webpack: config => {
    // Suppress webpack cache warnings
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  },
}

export default nextConfig
