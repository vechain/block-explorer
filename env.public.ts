import type { AddressString } from '@/lib/schemas'
import packageJson from '@/package.json'

/** App version - set at build time from git tag, falls back to package.json for local dev @public */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version

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

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

const parseAddressEnv = (name: string, value: string | undefined): AddressString | undefined => {
  if (!value) return undefined
  if (!ADDRESS_PATTERN.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed 40-char hex address`)
  }
  return value as AddressString
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

// Optional solo-network contract overrides (local dev only)
export const SOLO_B3TR_ADDRESS = parseAddressEnv(
  'NEXT_PUBLIC_SOLO_B3TR_ADDRESS',
  process.env.NEXT_PUBLIC_SOLO_B3TR_ADDRESS,
)
export const SOLO_VOT3_ADDRESS = parseAddressEnv(
  'NEXT_PUBLIC_SOLO_VOT3_ADDRESS',
  process.env.NEXT_PUBLIC_SOLO_VOT3_ADDRESS,
)
export const SOLO_STARGATE_NFT_ADDRESS = parseAddressEnv(
  'NEXT_PUBLIC_SOLO_STARGATE_NFT_ADDRESS',
  process.env.NEXT_PUBLIC_SOLO_STARGATE_NFT_ADDRESS,
)
export const SOLO_STARGATE_DELEGATION_ADDRESS = parseAddressEnv(
  'NEXT_PUBLIC_SOLO_STARGATE_DELEGATION_ADDRESS',
  process.env.NEXT_PUBLIC_SOLO_STARGATE_DELEGATION_ADDRESS,
)
