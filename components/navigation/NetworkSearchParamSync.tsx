'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { getNetworkNameFromSearchParams } from '@/lib/utils/network'

export const NetworkSearchParamSync = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isDevMode, setActiveNetwork } = useSettingsStore()

  useEffect(() => {
    const networkName = getNetworkNameFromSearchParams(searchParams)
    if (networkName === NetworkName.SOLO && !isDevMode) return

    if (!networkName || useSettingsStore.getState().activeNetwork.name === networkName) return

    setActiveNetwork(networkName)
  }, [isDevMode, pathname, searchParams, setActiveNetwork])

  return null
}
