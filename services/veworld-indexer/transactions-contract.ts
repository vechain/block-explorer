import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from './index'
import {
  type IndexerGetContractTransactionsParams,
  indexerContractTransactionSchema,
  indexerResponseSchema,
} from './schemas'

const CONTRACT_TRANSACTIONS_QUERY_KEY = 'getContractTransactions'

export const contractTransactionsQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetContractTransactionsParams,
) => ({
  queryKey: [CONTRACT_TRANSACTIONS_QUERY_KEY, networkName, params],
  queryFn: () => getContractTransactions({ networkName, params }),
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
    schema: indexerResponseSchema(indexerContractTransactionSchema),
    errorMessage: 'Invalid contract transactions response from VeWorld Indexer',
  })
}
