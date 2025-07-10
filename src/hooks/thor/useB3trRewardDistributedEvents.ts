import { useQuery } from "@tanstack/react-query"
import { getB3trRewardDistributedEvents } from "@/actions/getB3trRewardDistributedEvents"
import { useThorClient } from "./useThorClient"
import { useBestBlock } from "./useBestBlock"

export function useB3trRewardDistributedEvents({ numBlocks }: { numBlocks: number }) {
  const { thorClient, activeNetwork } = useThorClient()
  const { data: bestBlock } = useBestBlock()

  const bestBlockNumber = bestBlock?.number ?? 0
  const fromBlock = bestBlockNumber - numBlocks
  const toBlock = bestBlockNumber

  return useQuery({
    queryKey: [getB3trRewardDistributedEvents.name, numBlocks, fromBlock, toBlock],
    queryFn: () =>
      getB3trRewardDistributedEvents({
        thorClient,
        network: activeNetwork,
        fromBlock,
        toBlock,
      }),
    enabled: !!bestBlockNumber,
  })
}
