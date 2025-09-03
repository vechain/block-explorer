import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { type GetTransfersParams, responseSchema, transferSchema } from './schemas'

export const accountTransfersQueryOptions = (networkName: NetworkName, params: GetTransfersParams) => ({
  queryKey: [getTransfers.name, networkName, params],
  queryFn: () => getTransfers({ networkName, params }),
})

const getTransfers = async ({ networkName, params }: { networkName: NetworkName; params: GetTransfersParams }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transfers',
    params: serializeZodParams(params),
  })

  return zodParse(data, responseSchema(transferSchema), 'Invalid transfers response from VeWorld Indexer')
}
