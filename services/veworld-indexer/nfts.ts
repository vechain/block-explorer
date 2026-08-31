import { useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { serializeZodParams } from '@/lib/utils/serialization'
import { zodParse } from '@/lib/utils/zod'
import { indexerFetch } from '.'
import {
  type IndexerGetErc721Params,
  type IndexerResponse,
  indexerErc721Schema,
  indexerResponseSchema,
} from './schemas'

const ERC721_TOKENS_QUERY_KEY = 'getErc721Tokens'

const accountErc721TokensQueryOptions = (networkName: NetworkName, params: IndexerGetErc721Params) => ({
  queryKey: [ERC721_TOKENS_QUERY_KEY, networkName, params],
  queryFn: () => getErc721Tokens({ networkName, params }),

  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchInterval: 2 * 60_000,
  refetchOnWindowFocus: true,

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

export const useAccountErc721 = ({ params }: { params: IndexerGetErc721Params }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountErc721TokensQueryOptions(activeNetwork.name, params))
}

const getErc721Tokens = async ({
  networkName,
  params,
}: {
  networkName: NetworkName
  params: IndexerGetErc721Params
}) => {
  const { data } = await indexerFetch({
    networkName,
    endPoint: 'nfts',
    params: serializeZodParams(params),
  })

  return zodParse({
    data,
    schema: indexerResponseSchema(indexerErc721Schema),
    errorMessage: 'Invalid NFTs response from VeWorld Indexer',
  })
}
