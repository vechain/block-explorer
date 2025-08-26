import { useQuery } from "@tanstack/react-query"
import { getTotalVthoClaimed } from "./actions"
import { useThorClient } from "@/services/thor/thor-client"

export const useTotalVthoClaimed = () => {
  const { activeNetwork } = useThorClient()

  return useQuery({
    queryKey: [getTotalVthoClaimed.name, activeNetwork.name],
    queryFn: () => getTotalVthoClaimed({ network: activeNetwork.name }),
    refetchInterval: 5 * 1000,
  })
}
