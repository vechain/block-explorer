import { Address } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { VNS_FUNCTION_ABI_GET_NAMES, VNS_RESOLVER } from "@/constants/vns"
import { NetworkName } from "@/constants/network"

export type GetEnsNameReturnType = string | null

export async function getVnsName({
  thorClient,
  networkName,
  address,
}: {
  thorClient: ThorClient
  networkName: NetworkName
  address: Address
}): Promise<GetEnsNameReturnType> {
  const vnsContractAddress = VNS_RESOLVER[networkName]
  if (!vnsContractAddress) return null

  const { result, success } = await thorClient.contracts.executeCall(vnsContractAddress, VNS_FUNCTION_ABI_GET_NAMES, [
    [address.toString()],
  ])

  if (!success || !result.array || result.array.length === 0) {
    return null
  }

  const vnsName: string = result.array[0] as string

  return vnsName
}
