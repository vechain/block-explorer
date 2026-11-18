import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { IndexerVersion, indexerFetch } from './index'
import { indexerTransactionSchema, indexerResponseSchema } from './schemas'

const CONTRACT_TRANSACTIONS_QUERY_KEY = 'getContractTransactions'

const getContractTransactions = async ({
  networkName,
  contractAddress,
  size,
  cursor,
}: {
  networkName: NetworkName
  contractAddress: AddressString
  size: number
  cursor?: string
}) => {
  const { data } = await indexerFetch({
    networkName,
    endPoint: '/transactions/contract',
    params: { contractAddress, size: String(size), ...(cursor ? { cursor } : {}) },
    version: IndexerVersion.V2,
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransactionSchema),
    errorMessage: 'Invalid contract transactions response from VeWorld Indexer',
  })
}

/** Serves 0-indexed `page` from a cursor-paged feed; the controls only step one page at a time. */
export const useContractTransactions = ({
  contractAddress,
  page,
  size,
  enabled = true,
}: {
  contractAddress: AddressString
  page: number
  size: number
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  const query = useInfiniteQuery({
    queryKey: [CONTRACT_TRANSACTIONS_QUERY_KEY, activeNetwork.name, contractAddress, size] as const,
    queryFn: ({ pageParam }) =>
      getContractTransactions({ networkName: activeNetwork.name, contractAddress, size, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => (lastPage.pagination.hasNext ? lastPage.pagination.cursor : undefined),
    staleTime: BLOCK_TIME_MS,
    enabled,
  })

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = query
  const loadedPages = data?.pages.length ?? 0
  useEffect(() => {
    if (enabled && page >= loadedPages && loadedPages > 0 && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [enabled, page, loadedPages, hasNextPage, isFetchingNextPage, fetchNextPage])

  return { data: data?.pages[page], isLoading: query.isLoading || (enabled && page >= loadedPages && hasNextPage) }
}
