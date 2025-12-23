import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { type IndexerGetTransfersParams, indexerResponseSchema, indexerTransferSchema } from './schemas'

const TRANSFERS_QUERY_KEY = 'getTransfers'

export const accountTransfersQueryOptions = (networkName: NetworkName, params: IndexerGetTransfersParams) => ({
  queryKey: [TRANSFERS_QUERY_KEY, networkName, params],
  queryFn: () => getTransfers({ networkName, params }),
})

const getTransfers = async ({
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
  })
}
