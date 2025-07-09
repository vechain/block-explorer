import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/hooks/useThorClient"
import { getVnsAddress } from "@/actions/getVnsAddress"

export function useVnsAddress(name: string) {
  const { thorClient, activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getVnsAddress.name, name, activeNetwork.name],
    queryFn: () => getVnsAddress({ thorClient, networkName: activeNetwork.name, name }),
  })
}
