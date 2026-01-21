import { useQuery } from '@tanstack/react-query'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { getThorClient } from '@/services/thor/client'
import { isStargateNftContract, STARGATE_NFT_CONTRACT_ADDRESS, STARGATE_NFTS } from '@/lib/constants/stargate-nft'

const STARGATE_NFT_INFO_QUERY_KEY = 'getStargateNftInfo'

// ABI fragment for Stargate NFT getToken function
const STARGATE_NFT_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getToken',
    outputs: [
      {
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'levelId', type: 'uint256' },
          { name: 'mintedAtBlock', type: 'uint256' },
          { name: 'vetAmountStaked', type: 'uint256' },
          { name: 'lastVetGeneratedVthoClaimTimestamp_deprecated', type: 'uint256' },
        ],
        name: 'token',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface StargateNftInfo {
  vetAmountStaked: bigint
  levelId: number
  levelName: string
}

const getStargateNftInfo = async (networkName: NetworkName, tokenId: bigint): Promise<StargateNftInfo | null> => {
  try {
    const thorClient = getThorClient(networkName)

    // Get token data from Stargate NFT contract
    const nftContract = thorClient.contracts.load(STARGATE_NFT_CONTRACT_ADDRESS, STARGATE_NFT_ABI)
    const [tokenData] = await nftContract.read.getToken(tokenId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = tokenData as any
    const levelId = Number(token.levelId ?? token[1])
    const vetAmountStaked = BigInt(token.vetAmountStaked ?? token[3])

    // Find level name from levelId
    const level = STARGATE_NFTS.find(nft => nft.id === String(levelId))
    const levelName = level?.name ?? 'Unknown'

    return {
      vetAmountStaked,
      levelId,
      levelName,
    }
  } catch (error) {
    console.error('Error fetching Stargate NFT info:', error)
    return null
  }
}

const stargateNftInfoQueryOptions = (networkName: NetworkName, tokenId: bigint, enabled: boolean) => ({
  queryKey: [STARGATE_NFT_INFO_QUERY_KEY, networkName, tokenId.toString()],
  queryFn: () => getStargateNftInfo(networkName, tokenId),
  enabled,
  staleTime: 60_000,
})

export const useStargateNftInfo = ({
  contractAddress,
  tokenId,
}: {
  contractAddress: AddressString
  tokenId: bigint
}) => {
  const { activeNetwork } = useSettingsStore()
  const isStargate = isStargateNftContract(contractAddress, activeNetwork.name)

  return useQuery(stargateNftInfoQueryOptions(activeNetwork.name, tokenId, isStargate))
}
