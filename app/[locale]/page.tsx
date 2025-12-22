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
import { TotalStakedChart } from './components/TotalStakedChart'
import { getTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { priceListQueryOptions } from '@/services/coin-api/price-list'
import { totalVetStakedQueryOptions } from '@/services/veworld-indexer/total-vet-staked'
import {
  totalVetStakedHistoricQueryOptions,
  TotalVetStakedRange,
} from '@/services/veworld-indexer/total-vet-staked-historic'
import { AccountTimeFrame, accountTotalsQueryOptions } from '@/services/veworld-indexer/account-totals'
import { getAllValidatorsCount, ValidatorStatus } from '@/services/veworld-indexer/validators'

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
  await queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName))
  await queryClient.prefetchQuery({
    queryKey: [getTokenDailyPrices.name, 'vechain', 'usd'],
    queryFn: () => getTokenDailyPrices('vechain', 'usd'),
  })
  await queryClient.prefetchQuery({
    queryKey: [getTokenDailyPrices.name, 'vethor-token', 'usd'],
    queryFn: () => getTokenDailyPrices('vethor-token', 'usd'),
  })
  await queryClient.prefetchQuery({
    queryKey: [getTokenDailyPrices.name, 'vebetterdao', 'usd'],
    queryFn: () => getTokenDailyPrices('vebetterdao', 'usd'),
  })
  await queryClient.prefetchQuery(priceListQueryOptions())

  await queryClient.prefetchQuery(totalVetStakedQueryOptions(activeNetworkName))
  await queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.DAY))
  await queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.MONTH))
  await queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.YEAR))

  await queryClient.prefetchQuery(accountTotalsQueryOptions(activeNetworkName, AccountTimeFrame.ALL))
  await queryClient.prefetchQuery({
    queryKey: [getAllValidatorsCount.name, activeNetworkName, ValidatorStatus.ACTIVE],
    queryFn: () => getAllValidatorsCount(activeNetworkName, ValidatorStatus.ACTIVE),
  })

  // Prefetch latest 5 expanded blocks for ActivitySection
  const bestBlock = queryClient.getQueryData<CompressedBlock>(
    bestBlockCompressedQueryOptions(activeNetworkName).queryKey,
  )
  if (bestBlock?.number) {
    const BLOCKS_TO_DISPLAY = 5
    await Promise.all(
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
      <Container p="0" mt={4} maxW={{ md: '60%' }} hideFrom={'md'}>
        <SearchBar />
      </Container>

      <Stack mt={8} gap={8}>
        <PriceCards />
        <Flex gap={4} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
          <TotalStakedChart />
          <GeneralInformationCard />
        </Flex>
        <BlockUsage />

        <ActivitySection />
      </Stack>
    </HydrationBoundary>
  )
}
