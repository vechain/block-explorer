import { useQuery } from "@tanstack/react-query"
import { BEST_BLOCK_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"

export const useBestBlock = () => {
  const { thorClient, selectedNetwork } = useNetwork()

  const { data: bestBlock, isLoading: isBestBlockLoading } = useQuery({
    queryKey: [BEST_BLOCK_KEY, selectedNetwork.name],
    queryFn: async () => thorClient.blocks.getBestBlockExpanded(),

    refetchInterval: 3000, // Poll every 3 seconds
  })

  return {
    bestBlock: bestBlock || null,
    isBestBlockLoading,
  }
}
