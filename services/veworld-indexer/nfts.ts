import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { keepPreviousData } from '@tanstack/react-query'
import { resolveUrl } from '.'
import {
  type IndexerGetErc721Params,
  type IndexerResponse,
  indexerErc721Schema,
  indexerResponseSchema,
} from './schemas'

const ERC721_TOKENS_QUERY_KEY = 'getErc721Tokens'

export const accountErc721TokensQueryOptions = (networkName: NetworkName, params: IndexerGetErc721Params) => ({
  queryKey: [ERC721_TOKENS_QUERY_KEY, networkName, params],
  queryFn: () => getErc721Tokens({ networkName, params }),

  placeholderData: keepPreviousData,
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchInterval: 2 * 60_000,
  refetchOnWindowFocus: true,
  retry: 2,

  select: (data: IndexerResponse<typeof indexerErc721Schema>) => {
    const tokenIdsMap = data.data.reduce((acc, nft) => {
      const { tokenId, contractAddress } = nft
      const tokenIds = acc.get(contractAddress)

      if (tokenIds) {
        tokenIds.add(tokenId)
      } else {
        acc.set(contractAddress, new Set([tokenId]))
      }
      return acc
    }, new Map<AddressString, Set<bigint>>())

    return {
      data: tokenIdsMap,
      pagination: data.pagination,
    }
  },
})

const getErc721Tokens = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetErc721Params
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/nfts',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerErc721Schema),
    errorMessage: 'Invalid NFTs response from VeWorld Indexer',
  })
}
