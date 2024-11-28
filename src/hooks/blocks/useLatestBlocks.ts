import { BlockDetail } from "@vechain/sdk-network"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BEST_BLOCK_KEY, BLOCK_CACHE_KEY, LATEST_BLOCKS_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"

type UseLatestBlocks = {
  blocks: BlockDetail[]
  loading: boolean
}

export const useLatestBlocks = ({ count }: { count: number }): UseLatestBlocks => {
  const { thorClient, selectedNetwork } = useNetwork()
  const queryClient = useQueryClient()

  const { data: bestBlock, isLoading: isBestBlockLoading } = useQuery({
    queryKey: [BEST_BLOCK_KEY],
    queryFn: async () => {
      const response = await thorClient.blocks.getBestBlockCompressed()
      return response ? (response as BlockDetail) : null
    },
    refetchInterval: 3000, // Poll every 3 seconds
  })

  const { data: latestBlocks, isLoading: isPreviousBlocksLoading } = useQuery({
    queryKey: [LATEST_BLOCKS_KEY, bestBlock?.number, count],
    queryFn: async () => {
      if (!bestBlock) return []

      const blocks: BlockDetail[] = [bestBlock]
      queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, bestBlock.number], bestBlock)

      for (let i = 1; i < count; i++) {
        const blockNumber = bestBlock.number - i
        const cachedBlock = queryClient.getQueryData<BlockDetail>([BLOCK_CACHE_KEY, selectedNetwork.name, blockNumber])
        if (cachedBlock) {
          blocks.push(cachedBlock)
        } else {
          const block = await thorClient.blocks.getBlockCompressed(blockNumber)
          if (block) {
            queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, blockNumber], block as BlockDetail)
            blocks.push(block as BlockDetail)
          }
        }
      }

      return blocks
    },
    enabled: !!bestBlock, // Only run this query if bestBlock is available
  })

  return {
    blocks: latestBlocks || [],
    loading: isBestBlockLoading || isPreviousBlocksLoading,
  }
}
