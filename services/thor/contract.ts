import { VIP180_ABI, ZERO_ADDRESS } from '@vechain/sdk-core'
import type { ThorClient } from '@vechain/sdk-network'
import type { NetworkName } from '@/lib/constants/network'
import type { AddressString } from '@/lib/schemas'

export type Vip180 = {
  symbol: string
  decimals: number
}

export type Vip180List = Record<AddressString, Vip180 | null>

export const vip180QueryOptions = (thorClient: ThorClient, networkName: NetworkName, address: AddressString) => ({
  queryKey: [getVip180.name, networkName, address],
  queryFn: () => getVip180(thorClient, address),
  select: (data: Vip180 | null) => ({ address, vip180: data }),
})

const getVip180 = async (thorClient: ThorClient, address: AddressString): Promise<Vip180 | null> => {
  if (address === ZERO_ADDRESS) return null

  const vip180 = thorClient.contracts.load(address, VIP180_ABI)

  const [symbol] = await vip180.read.symbol()
  const [decimals] = await vip180.read.decimals()

  return { symbol, decimals }
}
