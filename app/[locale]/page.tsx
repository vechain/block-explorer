import { Flex, VStack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { Suspense } from 'react'

// ISR: Cache page for 10 seconds, then revalidate in background
// React Query's refetchInterval keeps client-side data fresh after hydration
export const revalidate = 10
import { HomeStatsGroup } from '@/components/ui/HomeStatsGroup'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'

import { parseNetworkFromParams } from '@/lib/utils/network'
import { logPrefetchFailures } from '@/lib/utils/prefetch'
import { bestBlockCompressedQueryOptions } from '@/services/thor/block'
import { ActivitySection } from './components/ActivitySection'
import { BlockUsage } from './components/BlockUsage/BlockUsage'
import { PriceCards } from './components/PriceCards'
import { TokenTransfersSection } from './components/TokenTransfersSection'
import { NFTTransfersSection } from './components/NFTTransfersSection'
import { MarketCapChart } from './components/MarketCapChart'
import { totalVetDelegatedQueryOptions } from '@/services/veworld-indexer/total-vet-delegated'
import { totalVetStakedQueryOptions } from '@/services/veworld-indexer/total-vet-staked'
import { AccountTimeFrame, accountTotalsQueryOptions } from '@/services/veworld-indexer/account-totals'
import {
  ALL_VALIDATORS_COUNT_QUERY_KEY,
  allValidatorsQueryOptions,
  getAllValidatorsCount,
  ValidatorStatus,
} from '@/services/veworld-indexer/validators'
import { TableSkeleton } from '@/components/ui/Table'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const activeNetworkName = await parseNetworkFromParams(searchParams)

  const queryClient = getQueryClient()

  // Prefetch only critical above-the-fold data
  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(totalVetStakedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(totalVetDelegatedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(accountTotalsQueryOptions(activeNetworkName, AccountTimeFrame.ALL)),
    queryClient.prefetchQuery(allValidatorsQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery({
      queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, activeNetworkName, ValidatorStatus.ACTIVE],
      queryFn: () => getAllValidatorsCount(activeNetworkName, ValidatorStatus.ACTIVE),
    }),
    queryClient.prefetchQuery({
      queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, activeNetworkName, ValidatorStatus.EXITING],
      queryFn: () => getAllValidatorsCount(activeNetworkName, ValidatorStatus.EXITING),
    }),
  ])

  logPrefetchFailures(prefetchResults, [
    'bestBlockCompressed',
    'totalVetStaked',
    'accountTotals',
    'allValidators',
    'validatorsCount:ACTIVE',
    'validatorsCount:EXITING',
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VStack gap={8} alignItems="stretch">
        <VStack gap={{ base: 8, md: 4 }} alignItems="stretch">
          <PriceCards />
          <Flex gap={{ base: 8, md: 4 }} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
            <Suspense fallback={<TableSkeleton />}>
              <MarketCapChart />
            </Suspense>
            <Suspense fallback={<TableSkeleton />}>
              <HomeStatsGroup />
            </Suspense>
          </Flex>
        </VStack>
        <Suspense fallback={<TableSkeleton />}>
          <BlockUsage />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <ActivitySection />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <TokenTransfersSection />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <NFTTransfersSection />
        </Suspense>
      </VStack>
    </HydrationBoundary>
  )
}
