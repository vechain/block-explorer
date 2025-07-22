import { useQuery } from "@tanstack/react-query"
import { useThorClient } from "@/services/thor/thor-client"
import { getTotalVetStaked } from "./actions"

export function useTotalVetStaked() {
  const { activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getTotalVetStaked.name, activeNetwork.name],
    queryFn: () => getTotalVetStaked({ network: activeNetwork.name }),
    refetchInterval: 5 * 1000,
  })
}
