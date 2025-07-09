import { useQueries } from "@tanstack/react-query"
import { getBlock } from "@/actions/getBlock"
import { Revision } from "@vechain/sdk-core"
import { useThorClient } from "./useThorClient"
import { useBestBlock } from "./useBestBlock"

export function useLatestBlocks({ count }: { count: number }) {
  const { thorClient } = useThorClient()
  const { data: bestBlock } = useBestBlock()

  const bestBlockNumber = bestBlock?.number ?? count
  const blockIds = []

  for (let i = 1; i < count; i++) {
    blockIds.push(bestBlockNumber - i)
  }

  return useQueries({
    queries: blockIds.map(blockId => ({
      queryKey: [getBlock.name, blockId],
      queryFn: () => getBlock({ thorClient, revision: Revision.of(blockId) }),
      staleTime: Infinity,
    })),
  })
}
