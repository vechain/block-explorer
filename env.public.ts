if (!process.env.NEXT_PUBLIC_COIN_API_URL) {
  throw new Error('NEXT_PUBLIC_COIN_API_URL is not set')
}

export const COIN_API_URL = process.env.NEXT_PUBLIC_COIN_API_URL

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

export const VEWORLD_INDEXER_MAINNET_URL = process.env.NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL

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

export const VEWORLD_INDEXER_TESTNET_URL = process.env.NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL

if (!process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL) {
  throw new Error('NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL is not set')
}

export const IPFS_GATEWAY_PROXY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL
