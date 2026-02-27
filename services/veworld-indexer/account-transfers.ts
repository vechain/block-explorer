import { queryOptions, keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from './index'
import { type IndexerGetTransfersParams, indexerResponseSchema, indexerTransferSchema } from './schemas'

const ACCOUNT_TRANSFERS_QUERY_KEY = 'getAccountTransfers'

const accountTransfersQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetTransfersParams,
  options?: { enabled?: boolean },
) =>
  queryOptions({
    queryKey: [ACCOUNT_TRANSFERS_QUERY_KEY, networkName, params] as const,
    queryFn: () => getAccountTransfers({ networkName, params }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })

export const useAccountTransfers = ({
  params,
  enabled = true,
}: {
  params: IndexerGetTransfersParams
  enabled?: boolean
}) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTransfersQueryOptions(activeNetwork.name, params, { enabled }))
}

const getAccountTransfers = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetTransfersParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transfers',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerTransferSchema),
    errorMessage: 'Invalid transfers response from VeWorld Indexer',
    fallbackData: {
      data: [],
      pagination: { hasNext: false },
    },
  })
}
