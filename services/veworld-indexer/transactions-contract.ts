import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { queryOptions } from '@tanstack/react-query'
import { resolveUrl } from './index'
import { type IndexerGetContractTransactionsParams, indexerTransactionSchema, indexerResponseSchema } from './schemas'

const CONTRACT_TRANSACTIONS_QUERY_KEY = 'getContractTransactions'

export const contractTransactionsQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetContractTransactionsParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [CONTRACT_TRANSACTIONS_QUERY_KEY, networkName, params] as const,
    queryFn: () => getContractTransactions({ networkName, params }),
    enabled: options?.enabled ?? true,
  })

const getContractTransactions = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetContractTransactionsParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transactions/contract',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransactionSchema),
    errorMessage: 'Invalid contract transactions response from VeWorld Indexer',
  })
}
