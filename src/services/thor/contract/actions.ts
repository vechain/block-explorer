import { AddressString } from "@/schemas"
import { VIP180_ABI, ZERO_ADDRESS } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"

export type Vip180 = {
  symbol: string
  decimals: number
}

export const getVip180 = async (thorClient: ThorClient, address: AddressString): Promise<Vip180 | null> => {
  if (address === ZERO_ADDRESS) return null

  const vip180 = thorClient.contracts.load(address, VIP180_ABI)

  const [symbol] = await vip180.read.symbol()
  const [decimals] = await vip180.read.decimals()

  return { symbol, decimals }
}
