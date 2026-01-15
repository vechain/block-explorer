import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { addressStringSchema } from '@/lib/schemas/common'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { type IndexerGetErc20ContractsParams, indexerResponseSchema } from './schemas'

const ERC20_CONTRACTS_QUERY_KEY = 'getErc20Contracts'

export const accountErc20ContractsQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetErc20ContractsParams,
) => ({
  queryKey: [ERC20_CONTRACTS_QUERY_KEY, networkName, params],
  queryFn: () => getErc20Contracts({ networkName, params }),
})

const getErc20Contracts = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetErc20ContractsParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transfers/fungible-tokens-contracts',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(addressStringSchema),
    errorMessage: 'Invalid fungible token contracts response from VeWorld Indexer',
    fallbackData: {
      data: [],
      pagination: { hasNext: false },
    },
  })
}
