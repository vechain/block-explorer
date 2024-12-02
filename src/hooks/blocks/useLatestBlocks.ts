import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { BLOCK_CACHE_KEY, LATEST_BLOCKS_KEY } from "@/constants/QueryKeys.ts"
import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"

type UseLatestBlocks = {
  blocks: ExpandedBlockDetail[]
  loading: boolean
}

/**
 * Fetches the latest blocks starting from the best block, with caching for performance.
 * @param {number} count - Number of blocks to fetch.
 * @returns {UseLatestBlocks} - An array of blocks and the loading state.
 */
export const useLatestBlocks = ({ count }: { count: number }): UseLatestBlocks => {
  const { thorClient, selectedNetwork } = useNetwork()
  const queryClient = useQueryClient()

  const { bestBlock, isBestBlockLoading } = useBestBlock()

  const { data: latestBlocks, isLoading: isPreviousBlocksLoading } = useQuery({
    queryKey: [LATEST_BLOCKS_KEY, bestBlock?.number, count],
    queryFn: async () => {
      if (!bestBlock) return []

      const blocks: ExpandedBlockDetail[] = [bestBlock]
      queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, bestBlock.number], bestBlock)

      const blockPromises = []
      for (let i = 1; i < count; i++) {
        const blockNumber = bestBlock.number - i
        const cachedBlock = queryClient.getQueryData<ExpandedBlockDetail>([
          BLOCK_CACHE_KEY,
          selectedNetwork.name,
          blockNumber,
        ])

        if (cachedBlock) {
          blocks.push(cachedBlock)
        } else {
          blockPromises.push(thorClient.blocks.getBlockExpanded(blockNumber))
        }
      }

      const fetchedBlocks = await Promise.all(blockPromises)
      fetchedBlocks.forEach(block => {
        if (block) {
          queryClient.setQueryData([BLOCK_CACHE_KEY, selectedNetwork.name, block.number], block as ExpandedBlockDetail)
          blocks.push(block as ExpandedBlockDetail)
        }
      })

      return blocks
    },
    enabled: !!bestBlock,
  })

  return {
    blocks: latestBlocks || [],
    loading: isBestBlockLoading || isPreviousBlocksLoading,
  }
}
