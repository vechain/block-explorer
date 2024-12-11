import { useNetwork } from "@/hooks/network/useNetwork.tsx"
import { useQuery } from "@tanstack/react-query"
import { useBestBlock } from "@/hooks/blocks/useBestBlock.ts"
import { RewardDistributedEventSignature } from "@/constants/vebetterdao/EventSignatures.ts"

export const useLatestB3trActions = ({ numBlocks }: { numBlocks: number }) => {
  const { thorClient } = useNetwork()
  const { bestBlock } = useBestBlock()

  const { data, isLoading } = useQuery({
    queryKey: ["latestB3trActions", bestBlock?.id, numBlocks],
    queryFn: async () => {
      return await thorClient.logs.filterRawEventLogs({
        criteriaSet: [
          {
            address: "0x6Bee7DDab6c99d5B2Af0554EaEA484CE18F52631",
            topic0: RewardDistributedEventSignature,
          },
        ],
        options: {
          offset: 0,
          limit: numBlocks, // Adjust as needed
        },
        order: "desc",
      })
    },
    enabled: !!bestBlock,
  })

  return {
    data,
    isLoading,
  }
}
