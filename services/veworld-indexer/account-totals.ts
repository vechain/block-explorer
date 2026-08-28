import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { IndexerVersion, indexerCachedGet } from '.'

const ACCOUNT_TOTAL_QUERY_KEY = 'getAccountTotal'
const ACCOUNT_TOTALS_QUERY_KEY = 'getAccountTotals'

const accountTotalResponseSchema = z.number()
const accountTotalsResponseSchema = z.array(
  z.object({
    blockId: z.string(),
    blockNumber: z.number(),
    blockTimestamp: z.number(),
    totalAccounts: z.number(),
  }),
)

const accountTotalQueryOptions = (networkName: NetworkName) => ({
  queryKey: [ACCOUNT_TOTAL_QUERY_KEY, networkName],
  queryFn: () => getAccountTotal(networkName),
  refetchInterval: 10 * 1000,
})

const getRefetchInterval = (rangeSeconds: number) => {
  if (rangeSeconds <= 3600) {
    return 1000 * 30
  }
  if (rangeSeconds <= 604800) {
    return 1000 * 60 * 5
  }
  if (rangeSeconds <= 2592000) {
    return 1000 * 60 * 15
  }
  if (rangeSeconds <= 31536000) {
    return 1000 * 60 * 30
  }
  return 1000 * 60 * 60
}

const accountTotalsQueryOptions = (
  networkName: NetworkName,
  startTimestamp: number,
  endTimestamp: number,
  isLiveMode: boolean = true,
) => {
  const rangeSeconds = endTimestamp - startTimestamp
  const refetchInterval: number | false = isLiveMode ? getRefetchInterval(rangeSeconds) : false

  return {
    queryKey: [ACCOUNT_TOTALS_QUERY_KEY, networkName, startTimestamp, endTimestamp, isLiveMode],
    queryFn: () => getAccountTotals({ networkName, startTimestamp, endTimestamp }),
    staleTime: isLiveMode ? getRefetchInterval(rangeSeconds) : Infinity,
    refetchInterval,
  }
}

export const useAccountTotal = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTotalQueryOptions(activeNetwork.name))
}

export const useAccountTotals = (startTimestamp: number, endTimestamp: number, isLiveMode: boolean = true) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTotalsQueryOptions(activeNetwork.name, startTimestamp, endTimestamp, isLiveMode))
}

const getAccountTotal = async (networkName: NetworkName) => {
  const { data } = await indexerCachedGet({
    networkName,
    endPoint: 'accounts/total',
    direct: { version: IndexerVersion.V2 },
  })
  return zodParse({
    data,
    schema: accountTotalResponseSchema,
    errorMessage: 'Invalid account total response from VeWorld Indexer',
  })
}

const getAccountTotals = async ({
  networkName,
  startTimestamp,
  endTimestamp,
}: {
  networkName: NetworkName
  startTimestamp: number
  endTimestamp: number
}) => {
  const { data } = await indexerCachedGet({
    networkName,
    endPoint: 'accounts/totals',
    params: {
      startTimestamp: startTimestamp.toString(),
      endTimestamp: endTimestamp.toString(),
    },
    direct: { version: IndexerVersion.V2 },
  })

  return zodParse({
    data,
    schema: accountTotalsResponseSchema,
    errorMessage: 'Invalid account totals response from VeWorld Indexer',
  })
}
