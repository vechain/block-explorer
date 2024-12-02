import { useQuery } from "@tanstack/react-query"
import { BEST_BLOCK_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useBlockQuery } from "@/hooks/blocks/useBlockQuery.ts"

export const useBestBlock = () => {
  const { selectedNetwork } = useNetwork()
  const { getBlock } = useBlockQuery()

  const { data: bestBlock, isLoading: isBestBlockLoading } = useQuery({
    queryKey: [BEST_BLOCK_KEY, selectedNetwork.name],
    queryFn: async () => getBlock("best"),
    refetchInterval: 3000, // Poll every 3 seconds
  })

  return {
    bestBlock: bestBlock || null,
    isBestBlockLoading,
  }
}
