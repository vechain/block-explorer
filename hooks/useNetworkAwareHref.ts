'use client'

import { useSearchParams } from 'next/navigation'
import { DEFAULT_NETWORK } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { appendNetworkSearchParam, getNetworkNameFromSearchParams } from '@/lib/utils/network'

export const useNetworkAwareHref = (href: string): string => {
  const searchParams = useSearchParams()
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)
  const networkInUrl = getNetworkNameFromSearchParams(searchParams)
  const networkName = networkInUrl ?? activeNetworkName

  if (networkName === DEFAULT_NETWORK.name) return href
  return appendNetworkSearchParam(href, networkName)
}
