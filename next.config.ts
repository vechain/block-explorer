import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    // A day rather than longer: a /_next/image URL carries no content hash, and this is
    // the browser's max-age as well as the server's. The default is 60 seconds.
    minimumCacheTTL: 60 * 60 * 24,
  },
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
