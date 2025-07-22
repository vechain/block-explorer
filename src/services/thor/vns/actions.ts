import { Address } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { VNS_FUNCTION_ABI_GET_NAMES, VNS_FUNCTION_ABI_GET_ADDRESSES, VNS_RESOLVER } from "@/constants/vns"
import { z } from "zod"
import { NetworkName } from "@/constants/network"
import { normalizeName } from "@/utils/vns"
import { isZeroAddress } from "@/utils/address"

const resultSchema = z.object({
  array: z.array(z.array(z.string())).nonempty(),
})

export async function getVnsName({
  thorClient,
  networkName,
  address,
}: {
  thorClient: ThorClient
  networkName: NetworkName
  address: Address
}): Promise<string | null> {
  const vnsContractAddress = VNS_RESOLVER[networkName]
  if (!vnsContractAddress) return null

  const { result, success } = await thorClient.contracts.executeCall(vnsContractAddress, VNS_FUNCTION_ABI_GET_NAMES, [
    [address.toString()],
  ])

  if (!success) {
    return null
  }

  const parsedResult = resultSchema.safeParse(result)
  if (!parsedResult.success) {
    return null
  }

  const vnsName = parsedResult.data.array[0][0]

  return vnsName
}

export async function getVnsAddress({
  thorClient,
  networkName,
  name,
}: {
  thorClient: ThorClient
  networkName: NetworkName
  name: string
}): Promise<Address | null> {
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
