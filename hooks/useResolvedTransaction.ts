'use client'

import { useQuery } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import type { NetworkName } from '@/lib/constants/network'
import type { Transaction, TransactionId } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import {
  getFallbackNetworkName,
  getHrefWithNetworkSearchParam,
  getNetworkNameFromSearchParams,
} from '@/lib/utils/network'
import { transactionQueryOptions } from '@/services/thor/transaction'

/**
 * A shared transaction link carries no network, so one that misses on the requested network is
 * retried against the other public one and the URL is pinned to wherever it resolved.
 */
export const useResolvedTransaction = (
  transactionId: TransactionId,
): { transaction: Transaction | null | undefined; networkName: NetworkName; isPending: boolean } => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeNetworkName = useSettingsStore(state => state.activeNetwork.name)

  const requestedNetworkName = getNetworkNameFromSearchParams(searchParams)
  const primaryNetworkName = requestedNetworkName ?? activeNetworkName
  const fallbackNetworkName = getFallbackNetworkName(primaryNetworkName)

  const primary = useQuery(transactionQueryOptions(primaryNetworkName, transactionId))
  const shouldTryFallback = !primary.isPending && !primary.data && fallbackNetworkName !== null
  const fallback = useQuery({
    ...transactionQueryOptions(fallbackNetworkName ?? primaryNetworkName, transactionId),
    enabled: shouldTryFallback,
  })

  const fallbackTransaction = shouldTryFallback ? fallback.data : undefined
  const resolvedNetworkName = primary.data ? primaryNetworkName : fallbackTransaction ? fallbackNetworkName : null

  useEffect(() => {
    if (!resolvedNetworkName || resolvedNetworkName === requestedNetworkName) return

    router.replace(getHrefWithNetworkSearchParam({ pathname, searchParams, networkName: resolvedNetworkName }), {
      scroll: false,
    })
  }, [pathname, requestedNetworkName, resolvedNetworkName, router, searchParams])

  return {
    transaction: primary.data ?? fallbackTransaction,
    networkName: resolvedNetworkName ?? primaryNetworkName,
    isPending: primary.isPending || (shouldTryFallback && fallback.isPending),
  }
}
