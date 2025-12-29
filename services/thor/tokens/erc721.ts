import { useQueries } from '@tanstack/react-query'
import { ERC721_ABI, ZERO_ADDRESS } from '@vechain/sdk-core'
import type { Contract } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

const ERC721_CONTRACT_QUERY_KEY = 'getErc721Contract'
const ERC721_TOKEN_QUERY_KEY = 'getErc721Token'

export const useErc721Contracts = ({ contractAddressList }: { contractAddressList: Set<AddressString> }) => {
  const { activeNetwork } = useSettingsStore()

  const queries = []

  for (const contractAddress of contractAddressList.values()) {
    queries.push({
      ...erc721ContractQueryOptions(activeNetwork.name, contractAddress),
      enabled: contractAddressList.size > 0,
    })
  }

  return useQueries({
    queries,
    combine: queries => ({
      data: queries.reduce((acc, query) => {
        if (query.data?.erc721) {
          const { address, erc721 } = query.data
          acc.set(address, erc721)
        }
        return acc
      }, new Map<AddressString, Erc721>()),
      isPending: queries.some(query => query.isPending),
    }),
  })
}

export const useErc721Tokens = ({ contract, tokenIds }: { contract: Erc721['contract']; tokenIds: bigint[] }) => {
  const queries = []

  for (const tokenId of tokenIds) {
    queries.push({
      ...erc721TokensQueryOptions(contract, tokenId),
    })
  }

  return useQueries({
    queries,
    combine: queries => ({
      data: queries.map(query => query.data),
      isPending: queries.some(query => query.isPending),
    }),
  })
}

const erc721ContractQueryOptions = (networkName: NetworkName, address: AddressString) => ({
  queryKey: [ERC721_CONTRACT_QUERY_KEY, networkName, address],
  queryFn: () => getErc721Contract(networkName, address),
  select: (data: Erc721 | null) => ({ address, erc721: data }),
})

const erc721TokensQueryOptions = (contract: Erc721['contract'], tokenId: bigint) => ({
  queryKey: [ERC721_TOKEN_QUERY_KEY, contract.address, tokenId.toString()],
  queryFn: () => getErc721Token(contract, tokenId),
})

const getErc721Contract = async (networkName: NetworkName, contractAddress: AddressString): Promise<Erc721 | null> => {
  if (contractAddress === ZERO_ADDRESS) return null

  const thorClient = getThorClient(networkName)
  const erc721 = thorClient.contracts.load(contractAddress, ERC721_ABI)

  const [name] = await erc721.read.name()
  const [symbol] = await erc721.read.symbol()

  return { address: contractAddress, symbol, name, contract: erc721 }
}

const getErc721Token = async (contract: Contract<typeof ERC721_ABI>, tokenId: bigint): Promise<Erc721Token> => {
  const [tokenUri] = await contract.read.tokenURI(tokenId)
  return { tokenId, tokenUri }
}

export type Erc721Token = {
  tokenId: bigint
  tokenUri: string
}

export type Erc721 = {
  address: AddressString
  symbol: string
  name: string
  contract: Contract<typeof ERC721_ABI>
}
