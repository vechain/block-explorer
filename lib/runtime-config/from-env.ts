import { addressStringSchema } from '@/lib/schemas'
import { DEFAULT_RUNTIME_CONFIG, type RuntimeConfig } from './types'

const parseAddress = (value: string | undefined) => addressStringSchema.safeParse(value?.trim()).data

/** Server-only. Everything else reads the config the browser fetched, never `process.env`. */
export const readRuntimeConfigFromEnv = (): RuntimeConfig => ({
  appVersion: process.env.APP_VERSION?.trim() || 'dev',
  allowDevMode: process.env.ALLOW_DEV_MODE === 'true' || process.env.NODE_ENV === 'development',
  bypassIndexerProxy: process.env.BYPASS_INDEXER_PROXY === 'true',
  b32Url: process.env.B32_URL?.trim() || DEFAULT_RUNTIME_CONFIG.b32Url,
  openchainUrl: process.env.OPENCHAIN_URL?.trim() || DEFAULT_RUNTIME_CONFIG.openchainUrl,
  soloContracts: {
    b3tr: parseAddress(process.env.SOLO_B3TR_ADDRESS),
    vot3: parseAddress(process.env.SOLO_VOT3_ADDRESS),
    stargateNft: parseAddress(process.env.SOLO_STARGATE_NFT_ADDRESS),
    stargateDelegation: parseAddress(process.env.SOLO_STARGATE_DELEGATION_ADDRESS),
  },
})
