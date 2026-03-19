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

export const totalTransactionsQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_TRANSACTIONS_QUERY_KEY, networkName],
  queryFn: () => getTotalTransactions({ networkName }),
  refetchInterval: 10 * 1000,
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

  const lastPoint = parsedData[parsedData.length - 1]

  return Number(lastPoint.cumulativeNumTransactions)
}

export const useTotalTransactions = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalTransactionsQueryOptions(activeNetwork.name))
}
