import { useQuery } from '@tanstack/react-query'
import { getUnixTime } from 'date-fns'
import { getNetworkGenesisTimestamp, type NetworkName } from '@/lib/constants/network'
import { blockUsageResponseSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerGet, resolveUrl } from '.'

const TOTAL_TRANSACTIONS_QUERY_KEY = 'getTotalTransactions'

export const totalTransactionsQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_TRANSACTIONS_QUERY_KEY, networkName],
  queryFn: () => getTotalTransactions({ networkName }),
  refetchInterval: 10 * 1000,
})

const getTotalTransactions = async ({ networkName }: { networkName: NetworkName }) => {
  const genesisTimestamp = getNetworkGenesisTimestamp(networkName) ?? 0

  const { data } = await indexerGet({
    baseUrl: resolveUrl(networkName),
    endPoint: '/explorer/block-usage',
    params: {
      startTimestamp: genesisTimestamp.toString(),
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
