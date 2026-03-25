import { VStack } from '@chakra-ui/react'
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
import { PriceCards } from './components/PriceCards'
import { TokenTransfersSection } from './components/TokenTransfersSection'
import { NFTTransfersSection } from './components/NFTTransfersSection'
import { totalVetStakedQueryOptions } from '@/services/veworld-indexer/total-vet-staked'
import { accountTotalQueryOptions } from '@/services/veworld-indexer/account-totals'
import {
  allValidatorsQueryOptions,
  validatorsCountQueryOptions,
  ValidatorStatus,
} from '@/services/veworld-indexer/validators'
import { TableSkeleton } from '@/components/ui/Table'
import { totalTransactionsQueryOptions } from '@/services/veworld-indexer/total-transactions'

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
    queryClient.prefetchQuery(totalTransactionsQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(accountTotalQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(allValidatorsQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(validatorsCountQueryOptions(activeNetworkName, { status: ValidatorStatus.ACTIVE })),
    queryClient.prefetchQuery(validatorsCountQueryOptions(activeNetworkName, { status: ValidatorStatus.EXITING })),
  ])

  logPrefetchFailures(prefetchResults, [
    'bestBlockCompressed',
    'totalVetStaked',
    'totalTransactions',
    'accountTotal',
    'allValidators',
    'validatorsCount:ACTIVE',
    'validatorsCount:EXITING',
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VStack gap={8} alignItems="stretch">
        <Suspense fallback={<TableSkeleton />}>
          <HomeStatsGroup />
        </Suspense>
        <PriceCards />
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
