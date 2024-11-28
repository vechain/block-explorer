import { CompressedBlockDetail } from "@vechain/sdk-network"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BLOCK_CACHE_KEY, LATEST_BLOCKS_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"

type UseLatestBlocks = {
  blocks: CompressedBlockDetail[]
  loading: boolean
}

export const useLatestBlocks = ({ count }: { count: number }): UseLatestBlocks => {
  const { thorClient, selectedNetwork } = useNetwork()
  const queryClient = useQueryClient()

  const { bestBlock, isBestBlockLoading } = useBestBlock()

  const { data: latestBlocks, isLoading: isPreviousBlocksLoading } = useQuery({
    queryKey: [LATEST_BLOCKS_KEY, bestBlock?.number, count],
    queryFn: async () => {
      if (!bestBlock) return []

      const blocks: CompressedBlockDetail[] = [bestBlock]
      queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, bestBlock.number], bestBlock)

      for (let i = 1; i < count; i++) {
        const blockNumber = bestBlock.number - i
        const cachedBlock = queryClient.getQueryData<CompressedBlockDetail>([
          BLOCK_CACHE_KEY,
          selectedNetwork.name,
          blockNumber,
        ])
        if (cachedBlock) {
          blocks.push(cachedBlock)
        } else {
          const block = await thorClient.blocks.getBlockCompressed(blockNumber)
          if (block) {
            queryClient.setQueryData(
              [BLOCK_CACHE_KEY, selectedNetwork.name, blockNumber],
              block as CompressedBlockDetail,
            )
            blocks.push(block as CompressedBlockDetail)
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
