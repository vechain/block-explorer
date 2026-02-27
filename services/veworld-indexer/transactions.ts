import { queryOptions, keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from './index'
import { type IndexerGetTransactionsParams, indexerResponseSchema, indexerTransactionSchema } from './schemas'
import { useContractTransactions } from './transactions-contract'

const TRANSACTIONS_QUERY_KEY = 'getTransactions'

const accountTransactionsQueryOptions = (
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

const useAccountTransactions = ({
  params,
  enabled = true,
}: {
  params: IndexerGetTransactionsParams
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTransactionsQueryOptions(activeNetwork.name, params, { enabled }))
}

export const useAddressTransactions = ({
  address,
  hasCode,
  page = 0,
  size = 10,
}: {
  address: AddressString
  hasCode: boolean | undefined
  page?: number
  size?: number
}) => {
  const contractTxs = useContractTransactions({
    params: { contractAddress: address, page, size },
    enabled: hasCode === true,
  })

  const accountTxs = useAccountTransactions({
    params: { origin: address, page, size },
    enabled: hasCode === false,
  })

  return hasCode ? contractTxs : accountTxs
}

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
