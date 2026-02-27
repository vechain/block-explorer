import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { type BlockUsageResponse, blockUsageResponseSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from './index'

const blockUsageQueryOptions = (
  networkName: NetworkName,
  startTimestamp: number,
  endTimestamp: number,
  isLiveMode: boolean = true,
) => {
  // Calculate time range in seconds
  const rangeSeconds = endTimestamp - startTimestamp

  // Adjust refetch intervals based on time range
  const getRefetchInterval = (rangeSeconds: number) => {
    if (rangeSeconds <= 3600) {
      // ≤ 1 hour
      return 1000 * 30 // 30 seconds for block-level data
    } else if (rangeSeconds <= 604800) {
      // ≤ 1 week
      return 1000 * 60 * 5 // 5 minutes for hourly data
    } else if (rangeSeconds <= 2592000) {
      // ≤ 1 month
      return 1000 * 60 * 15 // 15 minutes for daily data
    } else if (rangeSeconds <= 31536000) {
      // ≤ 1 year
      return 1000 * 60 * 30 // 30 minutes for weekly data
    } else {
      // > 1 year
      return 1000 * 60 * 60 // 1 hour for monthly data
    }
  }

  const refetchInterval: number | false = isLiveMode ? getRefetchInterval(rangeSeconds) : false

  return {
    queryKey: ['blockUsage', networkName, startTimestamp, endTimestamp, isLiveMode],
    queryFn: () => getBlockUsage({ networkName, startTimestamp, endTimestamp }),
    staleTime: isLiveMode ? getRefetchInterval(rangeSeconds) : Infinity,
    refetchInterval: refetchInterval,
    placeholderData: keepPreviousData,
  }
}

const getBlockUsage = async ({
  networkName,
  startTimestamp,
  endTimestamp,
}: {
  networkName: NetworkName
  startTimestamp: number
  endTimestamp: number
}) => {
  const baseUrl = resolveUrl(networkName)
  const { data } = await apiClient.get<BlockUsageResponse>({
    baseUrl,
    endPoint: '/explorer/block-usage',
    params: {
      startTimestamp: startTimestamp.toString(),
      endTimestamp: endTimestamp.toString(),
    },
  })

  return zodParse({
    data,
    schema: blockUsageResponseSchema,
    errorMessage: 'Failed to parse block usage response',
  })
}

export const useBlockUsage = (startTimestamp: number, endTimestamp: number, isLiveMode: boolean = true) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(blockUsageQueryOptions(activeNetwork.name, startTimestamp, endTimestamp, isLiveMode))
}
