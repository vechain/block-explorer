'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { IS_DEV_MODE_ALLOWED } from '@/lib/constants/dev-mode'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { consumeManualNetworkSearchParamSync, getNetworkNameFromSearchParams } from '@/lib/utils/network'
import { showAutomaticNetworkSwitchToast } from '@/lib/utils/network-switch-toast'

export const NetworkSearchParamSync = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { activeNetwork, isDevMode, setActiveNetwork } = useSettingsStore()

  useEffect(() => {
    const networkName = getNetworkNameFromSearchParams(searchParams)
    if (networkName === NetworkName.SOLO && !(IS_DEV_MODE_ALLOWED && isDevMode)) return

    if (!networkName) return

    const isManualNetworkSwitch = consumeManualNetworkSearchParamSync(networkName)
    const currentNetworkName = activeNetwork.name

    if (currentNetworkName === networkName) return

    if (!isManualNetworkSwitch) {
      showAutomaticNetworkSwitchToast({ t, fromNetworkName: currentNetworkName, toNetworkName: networkName })
    }

    setActiveNetwork(networkName)
  }, [activeNetwork.name, isDevMode, pathname, searchParams, setActiveNetwork, t])

  return null
}
