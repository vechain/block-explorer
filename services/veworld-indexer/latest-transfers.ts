'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerGet, resolveUrl } from './index'
import { indexerResponseSchema, indexerTransferSchema, type TransferEventType } from './schemas'

const LATEST_TRANSFERS_QUERY_KEY = 'getLatestTransfers'
const LIVE_REFETCH_INTERVAL_MS = 10 * 1000

const getLatestTransfers = async ({
  networkName,
  size,
  eventType,
  cursor,
}: {
  networkName: NetworkName
  size: number
  eventType?: TransferEventType[]
  cursor?: string
}) => {
  const { data } = await indexerGet({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transfers/latest',
    params: {
      size: String(size),
      ...(eventType && eventType.length > 0 ? { eventType } : {}),
      ...(cursor ? { cursor } : {}),
    },
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransferSchema),
    errorMessage: 'Invalid latest transfers response from VeWorld Indexer',
  })
}

export const useLatestTransfers = ({
  size = 10,
  eventType,
  enabled = true,
}: {
  size?: number
  eventType?: TransferEventType[]
  enabled?: boolean
} = {}) => {
  const { activeNetwork } = useSettingsStore()
  // Stable key from a possibly-unsorted array filter
  const eventTypeKey = eventType ? [...eventType].sort().join(',') : ''
  return useInfiniteQuery({
    queryKey: [LATEST_TRANSFERS_QUERY_KEY, activeNetwork.name, size, eventTypeKey] as const,
    queryFn: ({ pageParam }) =>
      getLatestTransfers({
        networkName: activeNetwork.name,
        size,
        eventType,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => (lastPage.pagination.hasNext ? lastPage.pagination.cursor : undefined),
    enabled,
  })
}

/**
 * Live tail of the latest transfers for non-paginated views (e.g. homepage card).
 * Polls the first page on the same cadence as the best-block query.
 */
export const useLatestTransfersLive = ({
  size = 5,
  eventType,
  enabled = true,
}: {
  size?: number
  eventType?: TransferEventType[]
  enabled?: boolean
} = {}) => {
  const { activeNetwork } = useSettingsStore()
  const eventTypeKey = eventType ? [...eventType].sort().join(',') : ''
  return useQuery({
    queryKey: [LATEST_TRANSFERS_QUERY_KEY, 'live', activeNetwork.name, size, eventTypeKey] as const,
    queryFn: () => getLatestTransfers({ networkName: activeNetwork.name, size, eventType }),
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
    enabled,
  })
}
