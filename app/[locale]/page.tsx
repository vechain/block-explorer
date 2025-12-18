import { Container, Flex, Stack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import z from 'zod'
import { GeneralInformationCard } from '@/components/ui/GeneralInformationCard'
import { SearchBar } from '@/components/navigation/SearchBar'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { zodParse } from '@/lib/utils/zod'
import { bestBlockCompressedQueryOptions } from '@/services/thor/block'
import { priceListQueryOptions } from '@/services/coin-api/price-list'
import { PriceCards } from './components/PriceCards'

// Lazy load below-the-fold components to reduce initial bundle size
const BlockUsage = dynamic(
  () => import('./components/BlockUsage/BlockUsage').then(mod => ({ default: mod.BlockUsage })),
  {
    ssr: true,
  },
)

const TotalStakedChart = dynamic(
  () => import('./components/TotalStakedChart').then(mod => ({ default: mod.TotalStakedChart })),
  {
    ssr: true,
  },
)

const ActivitySection = dynamic(
  () => import('./components/ActivitySection').then(mod => ({ default: mod.ActivitySection })),
  {
    ssr: true,
  },
)

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

  // Prefetch critical data server-side
  await Promise.all([
    queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(priceListQueryOptions()),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container p="0" mt={4} maxW={{ md: '60%' }} hideFrom={'md'}>
        <SearchBar />
      </Container>

      <Stack mt={8} gap={8}>
        <PriceCards />

        <Suspense>
          <BlockUsage />
        </Suspense>

        <Flex gap={4} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
          <Suspense>
            <TotalStakedChart />
          </Suspense>
          <GeneralInformationCard />
        </Flex>

        <Suspense>
          <ActivitySection />
        </Suspense>
      </Stack>
    </HydrationBoundary>
  )
}
