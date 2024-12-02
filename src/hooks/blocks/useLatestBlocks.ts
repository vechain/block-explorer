import { useQuery } from "@tanstack/react-query"
import { ExpandedBlockDetail } from "@vechain/sdk-network"
import { LATEST_BLOCKS_KEY } from "@/constants/QueryKeys.ts"
import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"
import { useBlockQuery } from "@/hooks/blocks/useBlockQuery.ts"

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
  const { getBlock } = useBlockQuery()

  const { bestBlock, isBestBlockLoading } = useBestBlock()

  const { data: latestBlocks, isLoading: isPreviousBlocksLoading } = useQuery({
    queryKey: [LATEST_BLOCKS_KEY, bestBlock?.number, count],
    queryFn: async () => {
      if (!bestBlock) return []

      const blocks: ExpandedBlockDetail[] = [bestBlock]

      const blockPromises = []
      for (let i = 1; i < count; i++) {
        const blockNumber = bestBlock.number - i

        blockPromises.push(getBlock(blockNumber))
      }

      const fetchedBlocks = await Promise.all(blockPromises)
      fetchedBlocks.forEach(block => {
        if (block) {
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
