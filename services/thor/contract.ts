import { VIP180_ABI, ZERO_ADDRESS } from '@vechain/sdk-core'
import { ThorClient } from '@vechain/sdk-network'
import { NETWORKS, type NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'

export type Vip180 = {
  address: AddressString
  symbol: string
  decimals: number
  balance: bigint
  name: string
}

export type Vip180List = Record<AddressString, Vip180 | null>

export const vip180QueryOptions = (
  networkName: NetworkName,
  address: AddressString,
  accountAddress: AddressString,
) => ({
  queryKey: [getVip180.name, networkName, address, accountAddress],
  queryFn: () => getVip180(networkName, address, accountAddress),
  select: (data: Vip180 | null) => ({ address, vip180: data }),
})

const getVip180 = async (
  networkName: NetworkName,
  address: AddressString,
  accountAddress: AddressString,
): Promise<Vip180 | null> => {
  if (address === ZERO_ADDRESS) return null

  const thorClient = ThorClient.at(NETWORKS[networkName].url)
  const vip180 = thorClient.contracts.load(address, VIP180_ABI)

  const [name] = await vip180.read.name()
  const [symbol] = await vip180.read.symbol()
  const [decimals] = await vip180.read.decimals()
  const [balance] = await vip180.read.balanceOf(accountAddress)

  return { address, symbol, decimals, balance, name }
}
