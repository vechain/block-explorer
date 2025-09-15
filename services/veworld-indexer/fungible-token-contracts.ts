import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import {
  type IndexerGetFungibleTokenContractsParams,
  indexerFungibleTokenContractSchema,
  indexerResponseSchema,
} from './schemas'

export const accountFungibleTokenContractsQueryOptions = (
  networkName: NetworkName,
  params: IndexerGetFungibleTokenContractsParams,
) => ({
  queryKey: [getFungibleTokenContracts.name, networkName, params],
  queryFn: () => getFungibleTokenContracts({ networkName, params }),
})

const getFungibleTokenContracts = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetFungibleTokenContractsParams
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/transfers/fungible-tokens-contracts',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerFungibleTokenContractSchema),
    errorMessage: 'Invalid fungible token contracts response from VeWorld Indexer',
  })
}
