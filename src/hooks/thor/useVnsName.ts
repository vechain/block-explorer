import { useQuery } from "@tanstack/react-query"
import { Address } from "@vechain/sdk-core"
import { getVnsName } from "@/actions/getVnsName"
import { useThorClient } from "./useThorClient"

export function useVnsName(address: Address) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getVnsName.name, address.toString(), activeNetwork.name],
    queryFn: () => getVnsName({ thorClient, networkName: activeNetwork.name, address }),
    staleTime: Infinity,
  })
}
