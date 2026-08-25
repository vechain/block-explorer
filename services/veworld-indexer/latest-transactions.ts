'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerCachedGet } from './index'
import { indexerResponseSchema, indexerTransactionSchema } from './schemas'

const LATEST_TRANSACTIONS_QUERY_KEY = 'getLatestTransactions'
const LIVE_REFETCH_INTERVAL_MS = 10 * 1000

const getLatestTransactions = async ({
  networkName,
  size,
  expanded,
  cursor,
}: {
  networkName: NetworkName
  size: number
  expanded: boolean
  cursor?: string
}) => {
  const { data } = await indexerCachedGet({
    networkName,
    endPoint: '/transactions/latest',
    params: {
      size: String(size),
      expanded: String(expanded),
      ...(cursor ? { cursor } : {}),
    },
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransactionSchema),
    errorMessage: 'Invalid latest transactions response from VeWorld Indexer',
  })
}

export const useLatestTransactions = ({
  size = 10,
  expanded = false,
  enabled = true,
}: {
  size?: number
  expanded?: boolean
  enabled?: boolean
} = {}) => {
  const { activeNetwork } = useSettingsStore()
  return useInfiniteQuery({
    queryKey: [LATEST_TRANSACTIONS_QUERY_KEY, activeNetwork.name, size, expanded] as const,
    queryFn: ({ pageParam }) =>
      getLatestTransactions({
        networkName: activeNetwork.name,
        size,
        expanded,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => (lastPage.pagination.hasNext ? lastPage.pagination.cursor : undefined),
    enabled,
  })
}

/**
 * Live tail of the latest transactions for non-paginated views (e.g. homepage card).
 * Polls the first page on the same cadence as the best-block query.
 */
export const useLatestTransactionsLive = ({
  size = 5,
  expanded = false,
  enabled = true,
}: {
  size?: number
  expanded?: boolean
  enabled?: boolean
} = {}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    queryKey: [LATEST_TRANSACTIONS_QUERY_KEY, 'live', activeNetwork.name, size, expanded] as const,
    queryFn: () => getLatestTransactions({ networkName: activeNetwork.name, size, expanded }),
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
    enabled,
  })
}
