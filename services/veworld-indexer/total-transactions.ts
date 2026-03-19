import { useQuery } from '@tanstack/react-query'
import { getUnixTime } from 'date-fns'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { blockUsageResponseSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

const TOTAL_TRANSACTIONS_QUERY_KEY = 'getTotalTransactions'
const GENESIS_TIMESTAMP = 1530316800

const totalTransactionsQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_TRANSACTIONS_QUERY_KEY, networkName],
  queryFn: () => getTotalTransactions({ networkName }),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 1000,
})

const getTotalTransactions = async ({ networkName }: { networkName: NetworkName }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/explorer/block-usage',
    params: {
      startTimestamp: GENESIS_TIMESTAMP.toString(),
      endTimestamp: getUnixTime(new Date()).toString(),
    },
  })

  const parsedData = zodParse({
    data,
    schema: blockUsageResponseSchema,
    errorMessage: 'Invalid total transactions response from VeWorld Indexer',
  })

  if (parsedData.length === 0) return 0
  if (parsedData.length === 1) return Number(parsedData[0].cumulativeNumTransactions)

  const firstPoint = parsedData[0]
  const lastPoint = parsedData[parsedData.length - 1]

  return Math.max(0, Number(lastPoint.cumulativeNumTransactions) - Number(firstPoint.cumulativeNumTransactions))
}

export const useTotalTransactions = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalTransactionsQueryOptions(activeNetwork.name))
}
