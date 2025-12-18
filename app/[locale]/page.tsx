import { Container, Flex, Stack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import z from 'zod'
import { GeneralInformationCard } from '@/components/ui/GeneralInformationCard'
import { SearchBar } from '@/components/navigation/SearchBar'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { zodParse } from '@/lib/utils/zod'
import { bestBlockCompressedQueryOptions } from '@/services/thor/block'
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
  await queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName))

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
