import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { indexerGet, resolveUrl } from '.'
import { indexerResponseSchema } from './schemas'

const ACCOUNT_TOTALS_QUERY_KEY = 'getAccountTotals'

/** @public */
export enum AccountTimeFrame {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

const accountTotalSchema = z.object({
  total: z.number(),
  timeFrame: z.enum(AccountTimeFrame),
  dayOfMonth: z.number().nullable().optional(),
  weekOfYear: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  year: z.number().nullable().optional(),
})

const accountTotalsResponseSchema = indexerResponseSchema(accountTotalSchema)

export const accountTotalsQueryOptions = (networkName: NetworkName, timeFrame: AccountTimeFrame) => ({
  queryKey: [ACCOUNT_TOTALS_QUERY_KEY, networkName, timeFrame],
  queryFn: () => getAccountTotals({ networkName, timeFrame }),
  refetchInterval: 10 * 1000, // Refetch every 10 seconds
  placeholderData: keepPreviousData, // Prevent UI flickering during refetches
})

export const useAccountTotals = (timeFrame: AccountTimeFrame) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountTotalsQueryOptions(activeNetwork.name, timeFrame))
}

const getAccountTotals = async ({
  networkName,
  timeFrame,
}: {
  networkName: NetworkName
  timeFrame: AccountTimeFrame
}) => {
  const { data } = await indexerGet({
    baseUrl: resolveUrl(networkName),
    endPoint: '/accounts/totals',
    params: {
      timeFrame: timeFrame.toString(),
    },
  })
  return zodParse({
    data,
    schema: accountTotalsResponseSchema,
    errorMessage: 'Invalid account totals response from VeWorld Indexer',
  })
}
