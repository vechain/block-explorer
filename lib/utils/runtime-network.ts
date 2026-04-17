import {
  SOLO_B3TR_ADDRESS,
  SOLO_STARGATE_DELEGATION_ADDRESS,
  SOLO_STARGATE_NFT_ADDRESS,
  SOLO_VOT3_ADDRESS,
  VEWORLD_INDEXER_MAINNET_URL,
  VEWORLD_INDEXER_TESTNET_URL,
} from '@/env.public'
import { DEV_MODE_DEFAULTS } from '@/lib/constants/dev-mode'
import { NETWORKS, type Network, type NetworkContracts, NetworkName } from '@/lib/constants/network'

type PersistedSettings = {
  state?: {
    soloNodeUrl?: unknown
    soloIndexerUrl?: unknown
  }
}

export const SETTINGS_STORAGE_KEY = 'settings'

export const normalizeConfigUrl = (value: string) => value.trim().replace(/\/+$/, '')

export const DEFAULT_SOLO_NODE_URL = normalizeConfigUrl(DEV_MODE_DEFAULTS.soloNodeUrl)
export const DEFAULT_SOLO_INDEXER_URL = normalizeConfigUrl(
  process.env.NEXT_PUBLIC_VEWORLD_INDEXER_SOLO_URL || DEV_MODE_DEFAULTS.soloIndexerUrl,
)

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

export const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const isValidIndexerBaseUrl = (value: string) => {
  if (!isValidHttpUrl(value)) return false

  const url = new URL(value)
  return !/\/(api|v\d+)(\/|$)/i.test(url.pathname)
}

const readPersistedSettings = () => {
  if (typeof window === 'undefined') return null

  try {
    const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!rawSettings) return null

    const persistedSettings = JSON.parse(rawSettings) as PersistedSettings
    return persistedSettings.state ?? null
  } catch {
    return null
  }
}

const getRuntimeSoloNodeUrl = () => {
  const persistedSoloNodeUrl = readPersistedSettings()?.soloNodeUrl
  if (!isNonEmptyString(persistedSoloNodeUrl)) return DEFAULT_SOLO_NODE_URL

  const normalizedUrl = normalizeConfigUrl(persistedSoloNodeUrl)
  return isValidHttpUrl(normalizedUrl) ? normalizedUrl : DEFAULT_SOLO_NODE_URL
}

const getRuntimeSoloIndexerUrl = () => {
  const persistedSoloIndexerUrl = readPersistedSettings()?.soloIndexerUrl
  if (!isNonEmptyString(persistedSoloIndexerUrl)) return DEFAULT_SOLO_INDEXER_URL

  const normalizedUrl = normalizeConfigUrl(persistedSoloIndexerUrl)
  return isValidIndexerBaseUrl(normalizedUrl) ? normalizedUrl : DEFAULT_SOLO_INDEXER_URL
}

export const getSoloContracts = (): NetworkContracts => ({
  ...(SOLO_B3TR_ADDRESS ? { b3tr: SOLO_B3TR_ADDRESS } : {}),
  ...(SOLO_VOT3_ADDRESS ? { vot3: SOLO_VOT3_ADDRESS } : {}),
  ...(SOLO_STARGATE_NFT_ADDRESS ? { stargateNft: SOLO_STARGATE_NFT_ADDRESS } : {}),
  ...(SOLO_STARGATE_DELEGATION_ADDRESS ? { stargateDelegation: SOLO_STARGATE_DELEGATION_ADDRESS } : {}),
})

export const getRuntimeNetwork = (networkName: NetworkName): Network => {
  if (networkName !== NetworkName.SOLO) {
    return NETWORKS[networkName]
  }

  return {
    ...NETWORKS[NetworkName.SOLO],
    url: getRuntimeSoloNodeUrl(),
    contracts: getSoloContracts(),
  }
}

export const getRuntimeIndexerBaseUrl = (networkName: NetworkName) => {
  if (networkName === NetworkName.SOLO) return getRuntimeSoloIndexerUrl()
  if (networkName === NetworkName.TESTNET) return VEWORLD_INDEXER_TESTNET_URL
  return VEWORLD_INDEXER_MAINNET_URL
}
