import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from './index'
import { type GetTransactionsParams, responseSchema, transactionSchema } from './schemas'

export const accountTransactionsQueryOptions = (networkName: NetworkName, params: GetTransactionsParams) => ({
  queryKey: [getTransactions.name, networkName, params],
  queryFn: () => getTransactions({ networkName, params }),
})

const getTransactions = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: GetTransactionsParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transactions',
    params: serializeZodParams(params),
  })

  return zodParse(data, responseSchema(transactionSchema), 'Invalid transactions response from VeWorld Indexer')
}
