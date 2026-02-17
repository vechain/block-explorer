import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'
import { getThorClient } from './client'

// StargateNFT contract addresses per network
const STARGATE_NFT_CONTRACT: Partial<Record<NetworkName, AddressString>> = {
  mainnet: '0x1856c533ac2d94340aaa8544d35a5c1d4a21dee7',
  testnet: '0x887d9102f0003f1724d8fd5d4fe95a11572fcd77',
}

// Minimal ABI for the ownerTotalVetStaked function
const STARGATE_NFT_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'ownerTotalVetStaked',
    outputs: [{ internalType: 'uint256', name: 'totalVetStaked', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ACCOUNT_STAKED_VET_QUERY_KEY = 'getAccountStakedVet'

export const accountStakedVetQueryOptions = (networkName: NetworkName, address: AddressString | undefined) => ({
  queryKey: [ACCOUNT_STAKED_VET_QUERY_KEY, networkName, address],
  queryFn: () => getAccountStakedVet(networkName, address!),
  enabled: !!address && !!STARGATE_NFT_CONTRACT[networkName],
})

const getAccountStakedVet = async (networkName: NetworkName, address: AddressString): Promise<bigint> => {
  const thorClient = getThorClient(networkName)
  const contractAddress = STARGATE_NFT_CONTRACT[networkName]
  if (!contractAddress) return 0n
  const contract = thorClient.contracts.load(contractAddress, STARGATE_NFT_ABI)

  const [stakedVet] = await contract.read.ownerTotalVetStaked(address)

  return stakedVet
}
