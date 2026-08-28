import { useQuery } from '@tanstack/react-query'
import { getUnixTime } from 'date-fns'
import { BLOCK_TIME_SECONDS, getNetworkGenesisTimestamp, type NetworkName } from '@/lib/constants/network'
import { blockUsageResponseSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerCachedGet } from '.'

const TOTAL_TRANSACTIONS_QUERY_KEY = 'getTotalTransactions'
const BLOCK_USAGE_ENDPOINT = 'explorer/block-usage'

// A floor, not a knob: under a day the indexer switches to per-block buckets and grows again.
const WINDOW_SECONDS = 24 * 60 * 60

export const totalTransactionsQueryOptions = (networkName: NetworkName) => ({
  queryKey: [TOTAL_TRANSACTIONS_QUERY_KEY, networkName],
  queryFn: () => getTotalTransactions({ networkName }),
  refetchInterval: 10 * 1000,
})

const cumulativeTotalSince = async ({
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
    endPoint: BLOCK_USAGE_ENDPOINT,
    params: { startTimestamp: startTimestamp.toString(), endTimestamp: endTimestamp.toString() },
  })

  const parsedData = zodParse({
    data,
    schema: blockUsageResponseSchema,
    errorMessage: 'Invalid total transactions response from VeWorld Indexer',
  })

  return parsedData.length === 0 ? undefined : Number(parsedData[parsedData.length - 1].cumulativeNumTransactions)
}

const getTotalTransactions = async ({ networkName }: { networkName: NetworkName }) => {
  // Anchored to a block boundary so concurrent viewers share one cache entry rather than
  // minting one each — the series is cumulative, so any window carries the all-time total.
  const now = getUnixTime(new Date())
  const endTimestamp = now - (now % BLOCK_TIME_SECONDS)

  const recent = await cumulativeTotalSince({
    networkName,
    startTimestamp: endTimestamp - WINDOW_SECONDS,
    endTimestamp,
  })
  if (recent !== undefined) return recent

  // A chain idle longer than the window would otherwise read as zero transactions.
  const fromGenesis = await cumulativeTotalSince({
    networkName,
    startTimestamp: getNetworkGenesisTimestamp(networkName) ?? 0,
    endTimestamp,
  })
  return fromGenesis ?? 0
}

export const useTotalTransactions = () => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(totalTransactionsQueryOptions(activeNetwork.name))
}
