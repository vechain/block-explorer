import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/services/thor/thor-client"
import { getNftHolders } from "./actions"

export function useNftHolders() {
  const { activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getNftHolders.name, activeNetwork.name],
    queryFn: () => getNftHolders({ network: activeNetwork.name }),
    refetchInterval: 5 * 1000,
  })
}
