'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ColorMode } from '@/components/theme/config'
import { NETWORKS, type Network, NetworkName } from '@/lib/constants/network'

export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
}

type SettingsStore = {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  currency: Currency
  setCurrency: (currency: Currency) => void
  activeNetwork: Network
  setActiveNetwork: (network: Network) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    set => ({
      colorMode: ColorMode.DARK,
      setColorMode: colorMode => set({ colorMode }),
      currency: Currency.USD,
      setCurrency: currency => set({ currency }),
      activeNetwork: NETWORKS[NetworkName.MAINNET],
      setActiveNetwork: network => set({ activeNetwork: network }),
    }),
    { name: 'settings' },
  ),
)
