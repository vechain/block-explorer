import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { type AFPUResponse, afpuResponseSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from './index'

const afpuQueryOptions = (
  networkName: NetworkName,
  startTimestamp: number,
  endTimestamp: number,
  isLiveMode: boolean = true,
) => {
  const rangeSeconds = endTimestamp - startTimestamp

  const getRefetchInterval = (rangeSeconds: number) => {
    if (rangeSeconds <= 604800) {
      return 1000 * 60 * 5
    } else if (rangeSeconds <= 2592000) {
      return 1000 * 60 * 15
    } else if (rangeSeconds <= 31536000) {
      return 1000 * 60 * 30
    } else {
      return 1000 * 60 * 60
    }
  }

  const refetchInterval: number | false = isLiveMode ? getRefetchInterval(rangeSeconds) : false

  return {
    queryKey: ['averageFeesPerUser', networkName, startTimestamp, endTimestamp, isLiveMode],
    queryFn: () => getAverageFeesPerUser({ networkName, startTimestamp, endTimestamp }),
    staleTime: isLiveMode ? getRefetchInterval(rangeSeconds) : Infinity,
    refetchInterval,
    placeholderData: keepPreviousData,
  }
}

const getAverageFeesPerUser = async ({
  networkName,
  startTimestamp,
  endTimestamp,
}: {
  networkName: NetworkName
  startTimestamp: number
  endTimestamp: number
}) => {
  const baseUrl = resolveUrl(networkName)
  const { data } = await apiClient.get<AFPUResponse>({
    baseUrl,
    endPoint: '/explorer/average-fees-per-user',
    params: {
      startTimestamp: startTimestamp.toString(),
      endTimestamp: endTimestamp.toString(),
    },
  })

  return zodParse({
    data,
    schema: afpuResponseSchema,
    errorMessage: 'Failed to parse average fees per user response',
  })
}

export const useAverageFeesPerUser = (startTimestamp: number, endTimestamp: number, isLiveMode: boolean = true) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(afpuQueryOptions(activeNetwork.name, startTimestamp, endTimestamp, isLiveMode))
}
