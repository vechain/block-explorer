import { useQuery } from "@tanstack/react-query"
import { BEST_BLOCK_KEY } from "@/constants/QueryKeys.ts"
import { CompressedBlockDetail } from "@vechain/sdk-network"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"

export const useBestBlock = () => {
  const { thorClient, selectedNetwork } = useNetwork()

  const { data: bestBlock, isLoading: isBestBlockLoading } = useQuery({
    queryKey: [BEST_BLOCK_KEY, selectedNetwork.name],
    queryFn: async () => {
      const response = await thorClient.blocks.getBestBlockCompressed()
      return response ? (response as CompressedBlockDetail) : null
    },
    refetchInterval: 3000, // Poll every 3 seconds
  })

  return {
    bestBlock: bestBlock || null,
    isBestBlockLoading,
  }
}
