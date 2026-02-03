import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { queryOptions, keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from './index'
import { type IndexerGetTransfersParams, indexerResponseSchema, indexerTransferSchema } from './schemas'

const ACCOUNT_TRANSFERS_QUERY_KEY = 'getAccountTransfers'

export const accountTransfersQueryOptions = (
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
