import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { addressStringSchema } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
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
  vetBalance: z.string(),
  vetSent: z.string(),
  vetReceived: z.string(),
  vthoBlockRewards: z.string(),
  vthoPassiveGeneration: z.string(),
  vthoClaimedStargate: z.string(),
  vthoEarnedTotal: z.string(),
})

export const accountOverviewQueryOptions = (networkName: NetworkName, address: string) => ({
  queryKey: [ACCOUNT_OVERVIEW_QUERY_KEY, networkName, address],
  queryFn: () => getAccountOverview({ networkName, address }),
  staleTime: 3 * 1000, // Consider data fresh for 3 seconds
  refetchInterval: 60 * 1000, // Refetch every minute
  placeholderData: keepPreviousData, // Prevent UI flickering during refetches
})

export const useAccountOverview = (address: string) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery(accountOverviewQueryOptions(activeNetwork.name, address))
}

const getAccountOverview = async ({ networkName, address }: { networkName: NetworkName; address: string }) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: `/accounts/overview/${address}`,
  })
  return zodParse({
    data,
    schema: accountOverviewSchema,
    errorMessage: 'Invalid account overview response from VeWorld Indexer',
  })
}
