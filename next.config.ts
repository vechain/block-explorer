import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  output: 'standalone', // Required for Docker deployment
  webpack: config => {
    // Suppress webpack cache warnings
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  },
}

export default nextConfig
