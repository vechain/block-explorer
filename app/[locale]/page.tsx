import { Container, Flex, Stack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import z from 'zod'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { GeneralInformationCard } from '@/components/ui/GeneralInformationCard'
import { SearchBar } from '@/components/navigation/SearchBar'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'

import { zodParse } from '@/lib/utils/zod'
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
  const networkName = (await searchParams).network || NetworkName.MAINNET

  const activeNetworkName = zodParse({
    data: networkName,
    schema: z.enum(Object.values(NetworkName)),
    errorMessage: 'Invalid network name',
    fallbackData: NetworkName.MAINNET,
  })

  const queryClient = getQueryClient()
  await Promise.allSettled([
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
    // Market cap prefetching
    queryClient.prefetchQuery(marketCapQueryOptions('vechain', Currency.USD, MarketCapRange.DAY)),
    queryClient.prefetchQuery(circulatingSupplyQueryOptions('vechain')),
  ])

  // Prefetch latest 5 expanded blocks for ActivitySection
  const bestBlock = queryClient.getQueryData<CompressedBlock>(
    bestBlockCompressedQueryOptions(activeNetworkName).queryKey,
  )
  if (bestBlock?.number) {
    const BLOCKS_TO_DISPLAY = 5
    await Promise.allSettled(
      Array.from({ length: BLOCKS_TO_DISPLAY }, (_, i) => {
        const revision = bestBlock.number - i
        if (revision > 0) {
          return queryClient.prefetchQuery(blockExpandedQueryOptions(activeNetworkName, revision))
        }
        return Promise.resolve()
      }),
    )
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container p="0" mt={4} hideFrom="md">
        <SearchBar />
      </Container>

      <Stack mt={8} gap={8}>
        <PriceCards />
        <Flex gap={4} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
          <MarketCapChart />
          <TotalStakedChart />
          <GeneralInformationCard />
        </Flex>
        <BlockUsage />

        <ActivitySection />
        <TokenTransfersSection />
        <NFTTransfersSection />
      </Stack>
    </HydrationBoundary>
  )
}
