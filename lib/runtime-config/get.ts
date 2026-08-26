import type { AddressString } from '@/lib/schemas'
import { DEFAULT_RUNTIME_CONFIG, RUNTIME_CONFIG_WINDOW_KEY, type RuntimeConfig } from './types'

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

const parseAddress = (value: string | undefined): AddressString | undefined => {
  if (!value || !ADDRESS_PATTERN.test(value)) return undefined
  return value as AddressString
}

const readFromEnv = (): RuntimeConfig => ({
  allowDevMode: process.env.ALLOW_DEV_MODE === 'true' || process.env.NODE_ENV === 'development',
  bypassIndexerProxy: process.env.BYPASS_INDEXER_PROXY === 'true',
  soloContracts: {
    b3tr: parseAddress(process.env.SOLO_B3TR_ADDRESS),
    vot3: parseAddress(process.env.SOLO_VOT3_ADDRESS),
    stargateNft: parseAddress(process.env.SOLO_STARGATE_NFT_ADDRESS),
    stargateDelegation: parseAddress(process.env.SOLO_STARGATE_DELEGATION_ADDRESS),
  },
})

/**
 * Resolve runtime config on both server and client.
 *
 * Server-side, reads from `process.env` directly so SSR renders with the same values
 * the server will inject via <RuntimeConfigScript>.
 *
 * Client-side, reads from `window.__BLOCK_EXPLORER_RUNTIME_CONFIG__` populated by that
 * inline script (which runs before the React bundle hydrates). This lets the prebuilt
 * Docker image pick up runtime env vars without rebuilding the client bundle.
 */
export const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') return readFromEnv()

  const fromWindow = (window as unknown as Record<string, RuntimeConfig | undefined>)[RUNTIME_CONFIG_WINDOW_KEY]
  return fromWindow ?? DEFAULT_RUNTIME_CONFIG
}
