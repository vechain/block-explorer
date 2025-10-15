import { useQuery } from '@tanstack/react-query'
import { type BlockUsageResponse, blockUsageResponseSchema } from '@/lib/schemas'
import { apiClient } from '@/lib/api'
import { zodParse } from '@/lib/utils/zod'
import { useSettingsStore } from '@/lib/stores/settings'
import type { NetworkName } from '@/lib/constants/network'
import { resolveUrl } from './index'

export const blockUsageQueryOptions = (
  networkName: NetworkName,
  startBlock: number,
  endBlock: number,
  granularity: string = 'block',
) => {
  // Adjust refetch intervals based on granularity to reduce flickering
  const getRefetchInterval = (granularity: string) => {
    switch (granularity) {
      case 'block':
        return 1000 * 30 // 30 seconds for block-level data
      case 'hourly':
        return 1000 * 60 * 5 // 5 minutes for hourly data
      case 'daily':
        return 1000 * 60 * 15 // 15 minutes for daily data
      case 'weekly':
        return 1000 * 60 * 30 // 30 minutes for weekly data
      case 'monthly':
        return 1000 * 60 * 60 // 1 hour for monthly data
      default:
        return 1000 * 60 * 5 // 5 minutes default
    }
  }

  const refetchInterval = getRefetchInterval(granularity)

  return {
    queryKey: ['blockUsage', networkName, startBlock, endBlock, granularity],
    queryFn: () => getBlockUsage({ networkName, startBlock, endBlock }),
    staleTime: refetchInterval,
    refetchInterval,
  }
}

const getBlockUsage = async ({
  networkName,
  startBlock,
  endBlock,
}: {
  networkName: NetworkName
  startBlock: number
  endBlock: number
}) => {
  const baseUrl = resolveUrl(networkName)
  const { data } = await apiClient.get<BlockUsageResponse>({
    baseUrl,
    endPoint: '/explorer/block-usage',
    params: {
      startBlock: startBlock.toString(),
      endBlock: endBlock.toString(),
    },
  })

  return zodParse({
    data,
    schema: blockUsageResponseSchema,
    errorMessage: 'Failed to parse block usage response',
    fallbackData: [],
  })
}

export const useBlockUsage = (startBlock: number, endBlock: number, granularity: string = 'block') => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockUsageQueryOptions(activeNetwork.name, startBlock, endBlock, granularity))
}
