import { keepPreviousData } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { indexerResponseSchema } from './schemas'

const ACCOUNT_TOTALS_QUERY_KEY = 'getAccountTotals'

export enum AccountTimeFrame {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
}

const accountTotalSchema = z.object({
  total: z.number(),
  timeFrame: z.nativeEnum(AccountTimeFrame),
  dayOfMonth: z.number().nullable().optional(),
  weekOfYear: z.number().nullable().optional(),
  month: z.number().nullable().optional(),
  year: z.number().nullable().optional(),
})

const accountTotalsResponseSchema = indexerResponseSchema(accountTotalSchema)

export type AccountTotal = z.infer<typeof accountTotalSchema>
export type AccountTotalsResponse = z.infer<typeof accountTotalsResponseSchema>

export const accountTotalsQueryOptions = (networkName: NetworkName, timeFrame: AccountTimeFrame) => ({
  queryKey: [ACCOUNT_TOTALS_QUERY_KEY, networkName, timeFrame],
  queryFn: () => getAccountTotals({ networkName, timeFrame }),
  refetchInterval: 5 * 1000, // Refetch every 5 seconds
  placeholderData: keepPreviousData, // Prevent UI flickering during refetches
  retry: (failureCount: number, error: Error) => {
    if (failureCount < 3 && (error as Error)?.message?.includes('fetch')) {
      return true
    }
    return false
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
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
