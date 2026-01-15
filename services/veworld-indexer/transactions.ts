import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { queryOptions, keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from './index'
import { type IndexerGetTransactionsParams, indexerResponseSchema, indexerTransactionSchema } from './schemas'

const TRANSACTIONS_QUERY_KEY = 'getTransactions'

export const accountTransactionsQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetTransactionsParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [TRANSACTIONS_QUERY_KEY, networkName, params] as const,
    queryFn: () => getTransactions({ networkName, params }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })

const getTransactions = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetTransactionsParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transactions',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransactionSchema),
    errorMessage: 'Invalid transactions response from VeWorld Indexer',
    fallbackData: {
      data: [],
      pagination: { hasNext: false },
    },
  })
}
