import { useQuery } from "@tanstack/react-query"
import { getB3trRewardDistributedEvents } from "./actions"
import { useThorClient } from "../thor-client"
import { useBestBlock } from "../block/hooks"

export const useB3trRewardDistributedEvents = ({ numBlocks }: { numBlocks: number }) => {
  const { thorClient, activeNetwork } = useThorClient()
  const { data: bestBlock } = useBestBlock()

  const bestBlockNumber = bestBlock?.number ?? 0
  const fromBlock = bestBlockNumber - numBlocks
  const toBlock = bestBlockNumber

  return useQuery({
    queryKey: [getB3trRewardDistributedEvents.name, activeNetwork.name, numBlocks, fromBlock, toBlock],
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
