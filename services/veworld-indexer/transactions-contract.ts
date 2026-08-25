import { queryOptions, useQuery } from '@tanstack/react-query'
import { BLOCK_TIME_MS, type NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { indexerCachedGet } from './index'
import { type IndexerGetContractTransactionsParams, indexerTransactionSchema, indexerResponseSchema } from './schemas'

const CONTRACT_TRANSACTIONS_QUERY_KEY = 'getContractTransactions'

const contractTransactionsQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetContractTransactionsParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [CONTRACT_TRANSACTIONS_QUERY_KEY, networkName, params] as const,
    queryFn: () => getContractTransactions({ networkName, params }),
    staleTime: BLOCK_TIME_MS,
    enabled: options?.enabled ?? true,
  })

export const useContractTransactions = ({
  params,
  enabled = true,
}: {
  params: IndexerGetContractTransactionsParams
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(contractTransactionsQueryOptions(activeNetwork.name, params, { enabled }))
}

const getContractTransactions = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetContractTransactionsParams
}) => {
  const { data } = await indexerCachedGet({
    networkName,
    endPoint: '/transactions/contract',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransactionSchema),
    errorMessage: 'Invalid contract transactions response from VeWorld Indexer',
  })
}
