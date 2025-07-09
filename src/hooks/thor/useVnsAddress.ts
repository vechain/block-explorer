import { useQuery } from "@tanstack/react-query"
import { getVnsAddress } from "@/actions/getVnsAddress"
import { useThorClient } from "./useThorClient"

export function useVnsAddress(name: string) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getVnsAddress.name, name, activeNetwork.name],
    queryFn: () => getVnsAddress({ thorClient, networkName: activeNetwork.name, name }),
  })
}
