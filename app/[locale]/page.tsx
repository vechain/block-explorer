import { Container, Heading, Stack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import z from 'zod'
import { SearchBar } from '@/components/navigation/SearchBar'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { zodParse } from '@/lib/utils/zod'
import { latestBlocksQueryOptions } from '@/services/thor/block'
import { BlockUsage } from './components/BlockUsage'
import { LatestBlocksSection } from './components/LatestBlocksSection'

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
  await queryClient.prefetchQuery(latestBlocksQueryOptions(activeNetworkName, 10))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Heading
        as="h2"
        textStyle="displayM"
        textAlign="center"
        mt={{ base: '16', md: '12' }}
        mb={{ base: '8', md: '10' }}>
        Insights & Metrics
      </Heading>

      <Container p="0" maxW={{ md: '60%' }}>
        <SearchBar />
      </Container>

      <Stack mt={{ base: 10, md: 16 }} gap={8}>
        <BlockUsage />

        <LatestBlocksSection />
      </Stack>
    </HydrationBoundary>
  )
}
