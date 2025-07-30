import { RewardDistributedEventSignature } from "@/constants/vebetterdao"
import { EventLogs, ThorClient } from "@vechain/sdk-network"
import { Network } from "@/constants/network"

type GetB3trRewardDistributedEventsReturnType = EventLogs[]

export async function getB3trRewardDistributedEvents({
  thorClient,
  network,
  fromBlock,
  toBlock,
}: {
  thorClient: ThorClient
  network: Network
  fromBlock: number
  toBlock: number
}): Promise<GetB3trRewardDistributedEventsReturnType> {
  const X2EarnRewardsPoolAddress = network.contracts.X2EarnRewardsPool

  if (!X2EarnRewardsPoolAddress) {
    throw new Error("X2EarnRewardsPool address is not set")
  }

  if (!fromBlock || !toBlock) {
    return []
  }

  const result = await thorClient.logs.filterRawEventLogs({
    range: {
      unit: "block",
      from: fromBlock,
      to: toBlock,
    },
    criteriaSet: [
      {
        address: X2EarnRewardsPoolAddress,
        topic0: RewardDistributedEventSignature,
      },
    ],
    order: "desc",
  })

  return result
}
