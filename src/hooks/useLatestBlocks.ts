import { BlockDetail, MAINNET_URL, ThorClient } from "@vechain/sdk-network"
import { useQuery, useQueryClient } from "@tanstack/react-query"

type UseLatestBlocks = {
  blocks: BlockDetail[]
  loading: boolean
}

export const useLatestBlocks = ({ count }: { count: number }): UseLatestBlocks => {
  const thorClient = ThorClient.at(MAINNET_URL)
  const queryClient = useQueryClient()

  const { data: bestBlock, isLoading: isBestBlockLoading } = useQuery({
    queryKey: ["bestBlock"],
    queryFn: async () => {
      const response = await thorClient.blocks.getBestBlockCompressed()
      return response ? (response as BlockDetail) : null
    },
    refetchInterval: 3000, // Poll every 3 seconds
  })

  const { data: latestBlocks, isLoading: isPreviousBlocksLoading } = useQuery({
    queryKey: ["previousBlocks", bestBlock?.number, count],
    queryFn: async () => {
      if (!bestBlock) return []

      const blocks: BlockDetail[] = [bestBlock]
      queryClient.setQueryData(["block", bestBlock.number], bestBlock)

      for (let i = 1; i < count; i++) {
        const blockNumber = bestBlock.number - i
        const cachedBlock = queryClient.getQueryData<BlockDetail>(["block", blockNumber])
        if (cachedBlock) {
          blocks.push(cachedBlock)
        } else {
          const block = await thorClient.blocks.getBlockCompressed(blockNumber)
          if (block) {
            queryClient.setQueryData(["block", blockNumber], block as BlockDetail)
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
