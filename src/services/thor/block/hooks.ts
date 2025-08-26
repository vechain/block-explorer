import { useQueries, useQuery } from "@tanstack/react-query"
import { getBlock, GetBlockReturnType } from "./actions"
import { Revision } from "@vechain/sdk-core"
import { useThorClient } from "../thor-client"
import { ExpandedBlockDetail } from "@vechain/sdk-network"

const BLOCK_TIME = 10 * 1000 // 10 seconds

export const useBlock = (revision: Revision) => {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getBlock.name, revision.toString()],
    queryFn: () => getBlock({ thorClient, revision }),
    staleTime: Infinity,
  })
}

export const useBestBlock = () => {
  const { thorClient } = useThorClient()

  return useQuery({
    queryKey: [getBlock.name, Revision.BEST.toString()],
    queryFn: () => getBlock({ thorClient, revision: Revision.BEST }),
    refetchInterval: BLOCK_TIME,
    staleTime: BLOCK_TIME,
  })
}

export const useLatestBlocks = ({ count }: { count: number }) => {
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

const isExpandedBlockDetail = (block: GetBlockReturnType | undefined): block is ExpandedBlockDetail => {
  return Boolean(block)
}
