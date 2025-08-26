import { useQuery } from "@tanstack/react-query"
import { getVnsName } from "./actions"
import { useThorClient } from "../thor-client"
import { Address } from "@vechain/sdk-core"
import { parseAddress } from "@/utils/address"

export const useVnsName = (address: Address | string) => {
  const { thorClient, activeNetwork } = useThorClient()

  const parsedAddress = parseAddress(address)

  return useQuery({
    queryKey: [getVnsName.name, address.toString(), activeNetwork.name],
    queryFn: () => getVnsName({ thorClient, networkName: activeNetwork.name, address: parsedAddress! }),
    staleTime: Infinity,
    enabled: !!parsedAddress,
  })
}
