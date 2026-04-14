'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ColorMode } from '@/components/theme/config'
import { DEFAULT_NETWORK, NETWORKS, type Network, NetworkName } from '@/lib/constants/network'
import {
  DEFAULT_SOLO_INDEXER_URL,
  DEFAULT_SOLO_NODE_URL,
  SETTINGS_STORAGE_KEY,
  normalizeConfigUrl,
} from '@/lib/utils/runtime-network'

export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  CNY = 'cny',
  JPY = 'jpy',
  AUD = 'aud',
  CAD = 'cad',
}

type PersistedSettingsState = {
  activeNetwork?: unknown
  isDevMode?: unknown
  soloNodeUrl?: unknown
  soloIndexerUrl?: unknown
}

type SettingsStore = {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  currency: Currency
  setCurrency: (currency: Currency) => void
  activeNetwork: Network
  setActiveNetwork: (network: Network | NetworkName) => void
  isDevMode: boolean
  setIsDevMode: (isDevMode: boolean) => void
  soloNodeUrl: string
  setSoloNodeUrl: (soloNodeUrl: string) => void
  soloIndexerUrl: string
  setSoloIndexerUrl: (soloIndexerUrl: string) => void
}

const isNetworkName = (value: unknown): value is NetworkName =>
  Object.values(NetworkName).includes(value as NetworkName)

const getNetworkConfig = (networkName: NetworkName, soloNodeUrl: string): Network => {
  if (networkName === NetworkName.SOLO) {
    return {
      ...NETWORKS[NetworkName.SOLO],
      url: normalizeConfigUrl(soloNodeUrl),
    }
  }

  return NETWORKS[networkName]
}

const getPersistedNetworkName = (activeNetwork: unknown): NetworkName => {
  if (
    typeof activeNetwork === 'object' &&
    activeNetwork !== null &&
    'name' in activeNetwork &&
    isNetworkName((activeNetwork as { name: unknown }).name)
  ) {
    return (activeNetwork as { name: NetworkName }).name
  }

  return DEFAULT_NETWORK.name
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      colorMode: ColorMode.DARK,
      setColorMode: colorMode => set({ colorMode }),
      currency: Currency.USD,
      setCurrency: currency => set({ currency }),
      activeNetwork: DEFAULT_NETWORK,
      setActiveNetwork: network =>
        set(state => {
          const nextNetworkName = typeof network === 'string' ? network : network.name
          return {
            activeNetwork: getNetworkConfig(nextNetworkName, state.soloNodeUrl),
          }
        }),
      isDevMode: false,
      setIsDevMode: isDevMode =>
        set(state => ({
          isDevMode,
          activeNetwork:
            !isDevMode && state.activeNetwork.name === NetworkName.SOLO
              ? DEFAULT_NETWORK
              : getNetworkConfig(state.activeNetwork.name, state.soloNodeUrl),
        })),
      soloNodeUrl: DEFAULT_SOLO_NODE_URL,
      setSoloNodeUrl: soloNodeUrl =>
        set(state => {
          const nextSoloNodeUrl = normalizeConfigUrl(soloNodeUrl)

          return {
            soloNodeUrl: nextSoloNodeUrl,
            activeNetwork:
              state.activeNetwork.name === NetworkName.SOLO
                ? getNetworkConfig(NetworkName.SOLO, nextSoloNodeUrl)
                : state.activeNetwork,
          }
        }),
      soloIndexerUrl: DEFAULT_SOLO_INDEXER_URL,
      setSoloIndexerUrl: soloIndexerUrl => set({ soloIndexerUrl: normalizeConfigUrl(soloIndexerUrl) }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: 2,
      migrate: persistedState => {
        const state = (persistedState ?? {}) as PersistedSettingsState
        const soloNodeUrl =
          typeof state.soloNodeUrl === 'string' && state.soloNodeUrl.trim()
            ? normalizeConfigUrl(state.soloNodeUrl)
            : DEFAULT_SOLO_NODE_URL
        const soloIndexerUrl =
          typeof state.soloIndexerUrl === 'string' && state.soloIndexerUrl.trim()
            ? normalizeConfigUrl(state.soloIndexerUrl)
            : DEFAULT_SOLO_INDEXER_URL
        const activeNetworkName = getPersistedNetworkName(state.activeNetwork)
        const isDevMode =
          typeof state.isDevMode === 'boolean' ? state.isDevMode : activeNetworkName === NetworkName.SOLO

        return {
          ...state,
          isDevMode,
          soloNodeUrl,
          soloIndexerUrl,
          activeNetwork:
            !isDevMode && activeNetworkName === NetworkName.SOLO
              ? DEFAULT_NETWORK
              : getNetworkConfig(activeNetworkName, soloNodeUrl),
        }
      },
    },
  ),
)
