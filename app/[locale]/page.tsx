import { Container, Flex, Stack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { endOfHour, getUnixTime, startOfHour } from 'date-fns'
import z from 'zod'
import { GeneralInformationCard } from '@/components/ui/GeneralInformationCard'
import { SearchBar } from '@/components/navigation/SearchBar'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { zodParse } from '@/lib/utils/zod'
import { priceListQueryOptions } from '@/services/coin-api/price-list'
import { tokenDailyPricesQueryOptions } from '@/services/coin-api/token-daily-prices'
import { blockUsageQueryOptions } from '@/services/veworld-indexer/block-usage'
import { accountTotalsQueryOptions, AccountTimeFrame } from '@/services/veworld-indexer/account-totals'
import { totalVetStakedQueryOptions } from '@/services/veworld-indexer/total-vet-staked'
import {
  TotalVetStakedRange,
  totalVetStakedHistoricQueryOptions,
} from '@/services/veworld-indexer/total-vet-staked-historic'
import { validatorsCountQueryOptions, ValidatorStatus } from '@/services/veworld-indexer/validators'
import { bestBlockCompressedQueryOptions, blockExpandedQueryOptions } from '@/services/thor/block'
import { ActivitySection } from './components/ActivitySection'
import { BlockUsage } from './components/BlockUsage/BlockUsage'
import { PriceCards } from './components/PriceCards'
import { TotalStakedChart } from './components/TotalStakedChart'

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

  // Calculate block usage timestamps for default hourly view
  const now = new Date()
  const hourlyStart = startOfHour(now)
  const hourlyEnd = endOfHour(now)
  const startTimestamp = getUnixTime(hourlyStart)
  const endTimestamp = getUnixTime(hourlyEnd)
  // Add buffer for baseline record (10 seconds for hourly range)
  const adjustedStartTimestamp = startTimestamp - 10

  // Prefetch best block first (needed for ActivitySection blocks)
  await queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName))

  // Get best block number for prefetching expanded blocks
  const bestBlock = queryClient.getQueryData<{ number: number } | null>(
    bestBlockCompressedQueryOptions(activeNetworkName).queryKey,
  )

  // Prepare block queries for ActivitySection
  const BLOCKS_TO_DISPLAY = 5
  const blockQueries = []
  if (bestBlock?.number) {
    for (let i = 0; i < BLOCKS_TO_DISPLAY; i++) {
      const revision = bestBlock.number - i
      if (revision > 0) {
        blockQueries.push(queryClient.prefetchQuery(blockExpandedQueryOptions(activeNetworkName, revision)))
      }
    }
  }

  // Prefetch all critical data in parallel (including blocks)
  // Use Promise.allSettled to continue even if some queries fail
  await Promise.allSettled([
    // Price data
    queryClient.prefetchQuery(priceListQueryOptions()),
    queryClient.prefetchQuery(tokenDailyPricesQueryOptions('vechain', 'usd')),
    queryClient.prefetchQuery(tokenDailyPricesQueryOptions('vethor-token', 'usd')),
    queryClient.prefetchQuery(tokenDailyPricesQueryOptions('vebetterdao', 'usd')),

    // General information
    queryClient.prefetchQuery(accountTotalsQueryOptions(activeNetworkName, AccountTimeFrame.ALL)),
    queryClient.prefetchQuery(validatorsCountQueryOptions(activeNetworkName, ValidatorStatus.ACTIVE)),

    // Total staked chart
    queryClient.prefetchQuery(totalVetStakedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(totalVetStakedHistoricQueryOptions(activeNetworkName, TotalVetStakedRange.DAY)),

    // Block usage (default hourly view)
    queryClient.prefetchQuery(blockUsageQueryOptions(activeNetworkName, adjustedStartTimestamp, endTimestamp, true)),

    // Latest blocks for ActivitySection
    ...blockQueries,
  ])

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
