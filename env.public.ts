const requireEnv = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
}

const assertIndexerBaseUrl = (name: string, value: string, example: string) => {
  if (value.includes('/v') || value.includes('/api')) {
    throw new Error(`${name} must not include version or /api, example: ${example}`)
  }

  return value
}

if (!process.env.NEXT_PUBLIC_COIN_API_URL) {
  throw new Error('NEXT_PUBLIC_COIN_API_URL is not set')
}

// coingecko api proxy
export const COIN_API_URL = process.env.NEXT_PUBLIC_COIN_API_URL

export const VEWORLD_INDEXER_MAINNET_URL = assertIndexerBaseUrl(
  'NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL',
  requireEnv('NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL', process.env.NEXT_PUBLIC_VEWORLD_INDEXER_MAINNET_URL),
  'https://indexer.mainnet.vechain.org',
)

export const VEWORLD_INDEXER_TESTNET_URL = assertIndexerBaseUrl(
  'NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL',
  requireEnv('NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL', process.env.NEXT_PUBLIC_VEWORLD_INDEXER_TESTNET_URL),
  'https://indexer.testnet.vechain.org',
)

if (!process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL) {
  throw new Error('NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL is not set')
}

export const IPFS_GATEWAY_PROXY_URL = process.env.NEXT_PUBLIC_IPFS_GATEWAY_PROXY_URL
