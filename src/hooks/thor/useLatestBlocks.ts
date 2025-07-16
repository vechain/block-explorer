import { useQueries } from "@tanstack/react-query"
import { getBlock } from "@/actions/getBlock"
import { Revision } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"
import { useBestBlock } from "./useBestBlock"
import { isExpandedBlockDetail } from "@/utils/block"

export function useLatestBlocks({ count }: { count: number }) {
  const { thorClient } = useThorClient()
  const { data: bestBlock } = useBestBlock()

  const bestBlockNumber = bestBlock?.number ?? count
  const blockIds = []

  for (let i = 0; i < count; i++) {
    const currentBlockId = bestBlockNumber - i
    if (currentBlockId > 0) {
      blockIds.push(currentBlockId)
    }
  }

  return useQueries({
    queries: blockIds.map(blockId => ({
      queryKey: [getBlock.name, blockId],
      queryFn: () => getBlock({ thorClient, revision: Revision.of(blockId) }),
      staleTime: Infinity,
    })),
    combine: queries => {
      return {
        data: queries.map(query => query.data).filter(isExpandedBlockDetail),
        isPending: queries.some(query => query.isPending),
      }
    },
  })
}
