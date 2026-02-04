import { useQueries, useQuery } from '@tanstack/react-query'
import { ERC721_ABI, ZERO_ADDRESS } from '@vechain/sdk-core'
import type { Contract } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'

const ERC721_CONTRACT_QUERY_KEY = 'getErc721Contract'
const ERC721_TOKEN_QUERY_KEY = 'getErc721Token'
const ERC721_OWNER_QUERY_KEY = 'getErc721Owner'

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

const getErc721Owner = async (
  networkName: NetworkName,
  contractAddress: AddressString,
  tokenId: bigint,
): Promise<AddressString | null> => {
  if (contractAddress === ZERO_ADDRESS) return null

  try {
    const thorClient = getThorClient(networkName)
    const contract = thorClient.contracts.load(contractAddress, ERC721_ABI)
    const [owner] = await contract.read.ownerOf(tokenId)
    return owner as AddressString
  } catch {
    return null
  }
}

const erc721OwnerQueryOptions = (networkName: NetworkName, contractAddress: AddressString, tokenId: bigint) => ({
  queryKey: [ERC721_OWNER_QUERY_KEY, networkName, contractAddress, tokenId.toString()],
  queryFn: () => getErc721Owner(networkName, contractAddress, tokenId),
  staleTime: 60_000,
})

export const useErc721Owner = ({ contractAddress, tokenId }: { contractAddress: AddressString; tokenId: bigint }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(erc721OwnerQueryOptions(activeNetwork.name, contractAddress, tokenId))
}

export const useErc721Contract = ({ contractAddress }: { contractAddress: AddressString }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    queryKey: [ERC721_CONTRACT_QUERY_KEY, activeNetwork.name, contractAddress],
    queryFn: () => getErc721Contract(activeNetwork.name, contractAddress),
  })
}

export const useErc721Token = ({
  contract,
  tokenId,
}: {
  contract: Erc721['contract'] | null | undefined
  tokenId: bigint
}) => {
  return useQuery({
    queryKey: [ERC721_TOKEN_QUERY_KEY, contract?.address ?? '', tokenId.toString()],
    queryFn: () => getErc721Token(contract!, tokenId),
    enabled: !!contract,
  })
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

type Erc721CollectionStats = {
  totalSupply: bigint | null
}

const ERC721_ENUMERABLE_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ERC721_COLLECTION_STATS_QUERY_KEY = 'getErc721CollectionStats'

const getErc721CollectionStats = async (
  networkName: NetworkName,
  contractAddress: AddressString,
): Promise<Erc721CollectionStats> => {
  if (contractAddress === ZERO_ADDRESS) return { totalSupply: null }

  try {
    const thorClient = getThorClient(networkName)
    const contract = thorClient.contracts.load(contractAddress, ERC721_ENUMERABLE_ABI)
    const [totalSupply] = await contract.read.totalSupply()
    return { totalSupply: totalSupply as bigint }
  } catch {
    return { totalSupply: null }
  }
}

export const useErc721CollectionStats = ({ contractAddress }: { contractAddress: AddressString }) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    queryKey: [ERC721_COLLECTION_STATS_QUERY_KEY, activeNetwork.name, contractAddress],
    queryFn: () => getErc721CollectionStats(activeNetwork.name, contractAddress),
    staleTime: 5 * 60_000,
  })
}
