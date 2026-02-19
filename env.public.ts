import packageJson from '@/package.json'

/** App version - set at build time from git tag, falls back to package.json for local dev @public */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version

/** Whether the app is running in solo network mode */
export const IS_SOLO = process.env.NEXT_PUBLIC_IS_SOLO === 'true'

if (!process.env.NEXT_PUBLIC_COIN_API_URL) {
  throw new Error('NEXT_PUBLIC_COIN_API_URL is not set')
}

// coingecko api proxy
export const COIN_API_URL = process.env.NEXT_PUBLIC_COIN_API_URL

if (IS_SOLO) {
  if (!process.env.NEXT_PUBLIC_SOLO_NODE_URL) {
    throw new Error('NEXT_PUBLIC_SOLO_NODE_URL is required when NEXT_PUBLIC_IS_SOLO is true')
  }

  if (!process.env.NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL) {
    throw new Error('NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL is required when NEXT_PUBLIC_IS_SOLO is true')
  }

  if (
    process.env.NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL.includes('/v') ||
    process.env.NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL.includes('/api')
  ) {
    throw new Error(
      'NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL must not include version or /api, example: https://localhost:8670',
    )
  }
} else {
  if (!process.env.NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL) {
    throw new Error('NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL is not set')
  }

  if (
    process.env.NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL.includes('/v') ||
    process.env.NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL.includes('/api')
  ) {
    throw new Error(
      'NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL must not include version or /api, example: https://indexer.mainnet.vechain.org',
    )
  }

  if (!process.env.NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL) {
    throw new Error('NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL is not set')
  }

  if (
    process.env.NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL.includes('/v') ||
    process.env.NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL.includes('/api')
  ) {
    throw new Error(
      'NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL must not include version or /api, example: https://indexer.testnet.vechain.org',
    )
  }
}

export const VEWORLD_INDEXER_MAINNET_URL = process.env.NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL ?? ''
export const VEWORLD_INDEXER_TESTNET_URL = process.env.NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL ?? ''
export const VEWORLD_INDEXER_SOLO_URL = process.env.NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL ?? ''
export const SOLO_NODE_URL = process.env.NEXT_PUBLIC_SOLO_NODE_URL ?? ''

if (!process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL) {
  throw new Error('NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL is not set')
}

export const IPFS_GATEWAY_PROXY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL
