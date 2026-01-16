import { Flex, VStack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { GeneralInformationCard } from '@/components/ui/GeneralInformationCard'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'

import { parseNetworkFromParams } from '@/lib/utils/network'
import { logPrefetchFailures } from '@/lib/utils/prefetch'
import { bestBlockCompressedQueryOptions, blockExpandedQueryOptions } from '@/services/thor/block'
import type { CompressedBlock } from '@/lib/schemas'
import { ActivitySection } from './components/ActivitySection'
import { BlockUsage } from './components/BlockUsage/BlockUsage'
import { PriceCards } from './components/PriceCards'
import { TokenTransfersSection } from './components/TokenTransfersSection'
import { NFTTransfersSection } from './components/NFTTransfersSection'
import { TotalStakedChart } from './components/TotalStakedChart'
import { MarketCapChart } from './components/MarketCapChart'
import { tokenDailyPricesQueryOptions } from '@/hooks/useTokenDailyPrices'
import { marketCapQueryOptions, circulatingSupplyQueryOptions, MarketCapRange } from '@/hooks/useMarketCapData'
import { totalVetStakedQueryOptions } from '@/services/veworld-indexer/total-vet-staked'
import {
  totalVetStakedHistoricQueryOptions,
  TotalVetStakedRange,
} from '@/services/veworld-indexer/total-vet-staked-historic'
import { AccountTimeFrame, accountTotalsQueryOptions } from '@/services/veworld-indexer/account-totals'
import {
  ALL_VALIDATORS_COUNT_QUERY_KEY,
  getAllValidatorsCount,
  ValidatorStatus,
} from '@/services/veworld-indexer/validators'
import { Currency } from '@/lib/stores/settings'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const activeNetworkName = await parseNetworkFromParams(searchParams)

  const queryClient = getQueryClient()
  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(tokenDailyPricesQueryOptions('vechain', 'usd' as Currency)),
    queryClient.prefetchQuery(tokenDailyPricesQueryOptions('vethor-token', 'usd' as Currency)),
    queryClient.prefetchQuery(tokenDailyPricesQueryOptions('vebetterdao', 'usd' as Currency)),
    queryClient.prefetchQuery(totalVetStakedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.DAY)),
    queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.MONTH)),
    queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.YEAR)),
    queryClient.prefetchQuery(accountTotalsQueryOptions(activeNetworkName, AccountTimeFrame.ALL)),
    queryClient.prefetchQuery({
      queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, activeNetworkName, ValidatorStatus.ACTIVE],
      queryFn: () => getAllValidatorsCount(activeNetworkName, ValidatorStatus.ACTIVE),
    }),
    queryClient.prefetchQuery({
      queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, activeNetworkName, ValidatorStatus.EXITING],
      queryFn: () => getAllValidatorsCount(activeNetworkName, ValidatorStatus.EXITING),
    }),
    // Market cap prefetching
    queryClient.prefetchQuery(marketCapQueryOptions('vechain', Currency.USD, MarketCapRange.DAY)),
    queryClient.prefetchQuery(circulatingSupplyQueryOptions('vechain')),
  ])

  logPrefetchFailures(prefetchResults, [
    'bestBlockCompressed',
    'tokenDailyPrices:vechain',
    'tokenDailyPrices:vethor-token',
    'tokenDailyPrices:vebetterdao',
    'totalVetStaked',
    'totalVetStakedHistoric:DAY',
    'totalVetStakedHistoric:MONTH',
    'totalVetStakedHistoric:YEAR',
    'accountTotals',
    'validatorsCount:ACTIVE',
    'validatorsCount:EXITING',
    'marketCap',
    'circulatingSupply',
  ])

  // Prefetch latest 5 expanded blocks for ActivitySection
  const bestBlock = queryClient.getQueryData<CompressedBlock>(
    bestBlockCompressedQueryOptions(activeNetworkName).queryKey,
  )
  if (bestBlock?.number) {
    const BLOCKS_TO_DISPLAY = 5
    const blockRevisions = Array.from({ length: BLOCKS_TO_DISPLAY }, (_, i) => bestBlock.number - i).filter(r => r > 0)
    const blockResults = await Promise.allSettled(
      blockRevisions.map(revision => queryClient.prefetchQuery(blockExpandedQueryOptions(activeNetworkName, revision))),
    )
    logPrefetchFailures(
      blockResults,
      blockRevisions.map(r => `blockExpanded:${r}`),
    )
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VStack gap={8} alignItems="stretch">
        <VStack gap={{ base: 8, md: 4 }} alignItems="stretch">
          <PriceCards />
          <Flex gap={{ base: 8, md: 4 }} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
            <MarketCapChart />
            <TotalStakedChart />
            <GeneralInformationCard />
          </Flex>
        </VStack>
        <BlockUsage />

        <ActivitySection />
        <TokenTransfersSection />
        <NFTTransfersSection />
      </VStack>
    </HydrationBoundary>
  )
}
