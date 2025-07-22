import { useQuery } from "@tanstack/react-query"
import { getVnsAddress, getVnsName } from "./actions"
import { useThorClient } from "../thor-client"
import { Address } from "@vechain/sdk-core"
import { parseAddress } from "@/utils/address"

export function useVnsAddress(name: string) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getVnsAddress.name, name, activeNetwork.name],
    queryFn: () => getVnsAddress({ thorClient, networkName: activeNetwork.name, name }),
    staleTime: Infinity,
  })
}

export function useVnsName(address: Address | string) {
  const { thorClient, activeNetwork } = useThorClient()

  const parsedAddress = parseAddress(address)

  return useQuery({
    queryKey: [getVnsName.name, address.toString(), activeNetwork.name],
    queryFn: () => getVnsName({ thorClient, networkName: activeNetwork.name, address: parsedAddress! }),
    staleTime: Infinity,
    enabled: !!parsedAddress,
  })
}
