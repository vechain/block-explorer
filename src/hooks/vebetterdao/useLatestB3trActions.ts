import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useQuery } from "@tanstack/react-query"
import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"
import { RewardDistributedEventSignature } from "@/constants/vebetterdao/EventSignatures.ts"

export const useLatestB3trActions = ({ numBlocks }: { numBlocks: number }) => {
  const { thorClient, selectedNetwork } = useNetwork()
  const { bestBlock } = useBestBlock()

  const { data, isLoading } = useQuery({
    queryKey: ["latestB3trActions", bestBlock?.id, numBlocks],
    queryFn: async () => {
      if (!bestBlock || !selectedNetwork.contracts.X2EarnRewardsPool) {
        return []
      }
      return await thorClient.logs.filterRawEventLogs({
        range: {
          unit: "block",
          to: bestBlock.number,
          from: bestBlock.number - numBlocks,
        },
        criteriaSet: [
          {
            address: selectedNetwork.contracts.X2EarnRewardsPool,
            topic0: RewardDistributedEventSignature,
          },
        ],
        order: "desc",
      })
    },
    enabled: !!bestBlock && !!selectedNetwork.contracts.X2EarnRewardsPool,
  })

  return {
    data,
    isLoading,
  }
}
