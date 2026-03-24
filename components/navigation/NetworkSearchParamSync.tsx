'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { NETWORKS } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { getNetworkNameFromSearchParams } from '@/lib/utils/network'

export const NetworkSearchParamSync = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const setActiveNetwork = useSettingsStore(state => state.setActiveNetwork)

  useEffect(() => {
    const networkName = getNetworkNameFromSearchParams(searchParams)

    if (!networkName || useSettingsStore.getState().activeNetwork.name === networkName) return

    setActiveNetwork(NETWORKS[networkName])
  }, [pathname, searchParams, setActiveNetwork])

  return null
}
