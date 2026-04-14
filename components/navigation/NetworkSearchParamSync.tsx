'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { NETWORKS } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { consumeManualNetworkSearchParamSync, getNetworkNameFromSearchParams } from '@/lib/utils/network'
import { showAutomaticNetworkSwitchToast } from '@/lib/utils/network-switch-toast'

export const NetworkSearchParamSync = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const setActiveNetwork = useSettingsStore(state => state.setActiveNetwork)

  useEffect(() => {
    const networkName = getNetworkNameFromSearchParams(searchParams)
    const currentNetworkName = useSettingsStore.getState().activeNetwork.name

    if (!networkName) return

    const isManualNetworkSwitch = consumeManualNetworkSearchParamSync(networkName)

    if (currentNetworkName === networkName) return

    if (!isManualNetworkSwitch) {
      showAutomaticNetworkSwitchToast({ t, fromNetworkName: currentNetworkName, toNetworkName: networkName })
    }

    setActiveNetwork(NETWORKS[networkName])
  }, [pathname, searchParams, setActiveNetwork, t])

  return null
}
