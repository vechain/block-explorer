import { keepPreviousData } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { addressStringSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'

const ACCOUNT_OVERVIEW_QUERY_KEY = 'getAccountOverview'

const accountOverviewSchema = z.object({
  address: addressStringSchema,
  firstSeen: z.number(),
  lastSeen: z.number(),
  transactionsSent: z.number(),
  clausesSent: z.number(),
  vthoBurned: z.string(),
  vthoDelegated: z.string(),
  gasUsed: z.string(),
  vetSent: z.string(),
  vetReceived: z.string(),
})

export const accountOverviewQueryOptions = (networkName: NetworkName, address: string) => ({
  queryKey: [ACCOUNT_OVERVIEW_QUERY_KEY, networkName, address],
  queryFn: () => getAccountOverview({ networkName, address }),
  staleTime: 3 * 1000, // Consider data fresh for 3 seconds
  refetchInterval: 60 * 1000, // Refetch every minute
  placeholderData: keepPreviousData, // Prevent UI flickering during refetches
  retry: (failureCount: number, error: Error) => {
    if (failureCount < 3 && (error as Error)?.message?.includes('fetch')) {
      return true
    }
    return false
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
})

const getAccountOverview = async ({ networkName, address }: { networkName: NetworkName; address: string }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: `/accounts/overview/${address}`,
  })
  return zodParse({
    data,
    schema: accountOverviewSchema,
    errorMessage: 'Invalid account overview response from VeWorld Indexer',
    fallbackData: {
      address,
      firstSeen: 0,
      lastSeen: 0,
      transactionsSent: 0,
      clausesSent: 0,
      vthoBurned: '0',
      vthoDelegated: '0',
      gasUsed: '0',
      vetSent: '0',
      vetReceived: '0',
    },
  })
}
