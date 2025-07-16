import { Address } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { VNS_FUNCTION_ABI_GET_ADDRESSES, VNS_RESOLVER } from "@/constants/vns"
import { NetworkName } from "@/constants/network"
import { normalizeName } from "@/utils/vns"
import { isZeroAddress } from "@/utils/address"

type GetVnsAddressReturnType = Address

export async function getVnsAddress({
  thorClient,
  networkName,
  name,
}: {
  thorClient: ThorClient
  networkName: NetworkName
  name: string
}): Promise<GetVnsAddressReturnType | null> {
  const vnsContractAddress = VNS_RESOLVER[networkName]
  if (!vnsContractAddress) return null

  const { result, success } = await thorClient.contracts.executeCall(
    vnsContractAddress,
    VNS_FUNCTION_ABI_GET_ADDRESSES,
    [[normalizeName(name)]],
  )

  if (!success || !result.array || result.array.length === 0) {
    return null
  }

  const address = result.array[0] as Address

  if (isZeroAddress(address)) return null

  return address
}
