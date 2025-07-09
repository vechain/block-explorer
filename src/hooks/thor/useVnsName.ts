import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/hooks/useThorClient"
import { Address } from "@vechain/sdk-core"
import { getVnsName } from "@/actions/getVnsName"

export function useVnsName(address: Address) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getVnsName.name, address.toString(), activeNetwork.name],
    queryFn: () => getVnsName({ thorClient, networkName: activeNetwork.name, address }),
  })
}
