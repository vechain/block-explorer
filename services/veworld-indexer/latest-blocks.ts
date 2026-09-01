'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetch } from './index'
import { indexerBlockSchema, indexerResponseSchema } from './schemas'

const LATEST_BLOCKS_QUERY_KEY = 'getLatestBlocks'
const LIVE_REFETCH_INTERVAL_MS = BLOCK_TIME_MS

const getLatestBlocks = async ({
  networkName,
  size,
  from,
}: {
  networkName: NetworkName
  size: number
  from?: string
}) => {
  const { data } = await indexerFetch({
    networkName,
    endPoint: '/blocks',
    params: {
      size: String(size),
      ...(from ? { from } : {}),
    },
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerBlockSchema),
    errorMessage: 'Invalid blocks response from VeWorld Indexer',
  })
}

export const useLatestBlocks = ({ size = 10, enabled = true }: { size?: number; enabled?: boolean } = {}) => {
  const { activeNetwork } = useSettingsStore()
  return useInfiniteQuery({
    queryKey: [LATEST_BLOCKS_QUERY_KEY, activeNetwork.name, size] as const,
    queryFn: ({ pageParam }) => getLatestBlocks({ networkName: activeNetwork.name, size, from: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => (lastPage.pagination.hasNext ? lastPage.pagination.cursor : undefined),
    staleTime: BLOCK_TIME_MS,
    enabled,
  })
}

/**
 * Live tail of the latest blocks for non-paginated views (e.g. homepage card).
 * Polls the first page on the same cadence as the best-block query.
 */
export const useLatestBlocksLive = ({ size = 5, enabled = true }: { size?: number; enabled?: boolean } = {}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    queryKey: [LATEST_BLOCKS_QUERY_KEY, 'live', activeNetwork.name, size] as const,
    queryFn: () => getLatestBlocks({ networkName: activeNetwork.name, size }),
    staleTime: BLOCK_TIME_MS,
    refetchInterval: LIVE_REFETCH_INTERVAL_MS,
    enabled,
  })
}
