'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { nextBlockRefetchDelay } from '@/lib/utils/block-slot'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetch } from './index'
import { indexerResponseSchema, indexerTransactionSchema } from './schemas'

const LATEST_TRANSACTIONS_QUERY_KEY = 'getLatestTransactions'

export const liveTransactionsQueryKey = (networkName: NetworkName) =>
  [LATEST_TRANSACTIONS_QUERY_KEY, 'live', networkName] as const

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
  const { data } = await indexerFetch({
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
    staleTime: BLOCK_TIME_MS,
    enabled,
  })
}

/**
 * Live tail of the latest transactions for non-paginated views (e.g. homepage card).
 * Each poll is timed to land just after the next block should be indexed.
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
    queryKey: [...liveTransactionsQueryKey(activeNetwork.name), size, expanded] as const,
    queryFn: () => getLatestTransactions({ networkName: activeNetwork.name, size, expanded }),
    staleTime: BLOCK_TIME_MS,
    refetchInterval: query => nextBlockRefetchDelay(query.state.data?.data[0]?.blockTimestamp),
    enabled,
  })
}
