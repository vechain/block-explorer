import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

export enum AccountTimeFrame {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

export const accountTotalsQueryOptions = (networkName: NetworkName, timeFrame: AccountTimeFrame) => ({
  queryKey: [getAccountTotals.name, networkName, timeFrame],
  queryFn: () => getAccountTotals({ networkName, timeFrame }),
  refetchInterval: 5 * 1000,
})

const getAccountTotals = async ({
  networkName,
  timeFrame,
}: {
  networkName: NetworkName
  timeFrame: AccountTimeFrame
}) => {
  const { data } = await apiClient.get({
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

const accountTotalSchema = z.object({
  total: z.number(),
  timeFrame: z.nativeEnum(AccountTimeFrame),
  dayOfMonth: z.number().nullable().optional(),
  weekOfYear: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  year: z.number().nullable().optional(),
})

const accountTotalsResponseSchema = z.object({
  data: z.array(accountTotalSchema),
  pagination: z.object({
    hasNext: z.boolean(),
  }),
})

export type AccountTotal = z.infer<typeof accountTotalSchema>
export type AccountTotalsResponse = z.infer<typeof accountTotalsResponseSchema>
