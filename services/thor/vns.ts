import { queryOptions } from '@tanstack/react-query'
import { ABIFunction } from '@vechain/sdk-core'
import { ThorClient } from '@vechain/sdk-network'
import { z } from 'zod'
import { NETWORKS, NetworkName } from '@/lib/constants/network'
import { type AddressString, addressStringSchema } from '@/lib/schemas'
import { isZeroAddress } from '@/lib/utils/address'
import { normalizeName } from '@/lib/utils/vns'
import { zodParse } from '@/lib/utils/zod'

const VNS_RESOLVER: Partial<{ [key in NetworkName]: string }> = {
  [NetworkName.MAINNET]: '0xA11413086e163e41901bb81fdc5617c975Fa5a1A',
  [NetworkName.TESTNET]: '0xc403b8EA53F707d7d4de095f0A20bC491Cf2bc94',
}

const VNS_FUNCTION_ABI_GET_ADDRESSES = new ABIFunction(
  'function getAddresses(string[] names) returns (address[] addresses)',
)

const VNS_FUNCTION_ABI_GET_NAMES = new ABIFunction('function getNames(address[] addresses) returns (string[] names)')

export const vnsNameQueryOptions = (networkName: NetworkName, address: AddressString | undefined) =>
  queryOptions({
    queryKey: [getVnsName.name, networkName, address],
    queryFn: () => getVnsName({ networkName, address: address ?? '0x' }),
    staleTime: Infinity,
  })

const getVnsName = async ({
  networkName,
  address,
}: {
  networkName: NetworkName
  address: AddressString
}): Promise<string | null> => {
  const vnsContractAddress = VNS_RESOLVER[networkName]
  if (!vnsContractAddress) return null

  const thorClient = ThorClient.at(NETWORKS[networkName].url)
  const { result: vnsResult, success } = await thorClient.contracts.executeCall(
    vnsContractAddress,
    VNS_FUNCTION_ABI_GET_NAMES,
    [[address]],
  )

  if (!success) {
    return null
  }

  const result = zodParse({
    data: vnsResult,
    schema: vnsResultSchema,
    errorMessage: 'Failed to parse VNS result',
  })

  const vnsName = result.array[0][0]

  return vnsName
}

const vnsResultSchema = z.object({
  array: z.array(z.array(z.string())).nonempty(),
})

export const getVnsAddress = async ({
  networkName,
  name,
}: {
  networkName: NetworkName
  name: string
}): Promise<AddressString | null> => {
  const vnsContractAddress = VNS_RESOLVER[networkName]
  if (!vnsContractAddress) return null

  const thorClient = ThorClient.at(NETWORKS[networkName].url)
  const { result, success } = await thorClient.contracts.executeCall(
    vnsContractAddress,
    VNS_FUNCTION_ABI_GET_ADDRESSES,
    [[normalizeName(name)]],
  )

  if (!success || !result.array || result.array.length === 0) {
    return null
  }

  const [address] = zodParse({
    data: result.array[0],
    schema: z.array(addressStringSchema),
    errorMessage: 'Failed to parse VNS address',
  })

  if (isZeroAddress(address)) return null

  return address
}
