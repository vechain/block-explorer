import { BlockDetail, MAINNET_URL, ThorClient } from "@vechain/sdk-network"
import { useQuery } from "@tanstack/react-query"
import { useRef } from "react"

type UseLatestBlocks = {
  blocks: BlockDetail[]
  loading: boolean
}

export const useLatestBlocks = ({ count }: { count: number }): UseLatestBlocks => {
  const thorClient = ThorClient.at(MAINNET_URL)
  const blockCache = useRef<Map<number, BlockDetail>>(new Map())

  const manageCacheSize = () => {
    while (blockCache.current.size > count * 2) {
      const oldestKey = blockCache.current.keys().next().value
      if (typeof oldestKey === "number") {
        blockCache.current.delete(oldestKey)
      }
    }
  }

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
      blockCache.current.set(bestBlock.number, bestBlock)
      manageCacheSize()

      for (let i = 1; i < count; i++) {
        const blockNumber = bestBlock.number - i
        if (blockCache.current.has(blockNumber)) {
          blocks.push(blockCache.current.get(blockNumber)!)
        } else {
          const block = await thorClient.blocks.getBlockCompressed(blockNumber)
          if (block) {
            blockCache.current.set(blockNumber, block as BlockDetail)
            blocks.push(block as BlockDetail)
            manageCacheSize()
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
