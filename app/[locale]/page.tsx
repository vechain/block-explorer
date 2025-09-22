import { Flex, Stack } from '@chakra-ui/react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import z from 'zod'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { zodParse } from '@/lib/utils/zod'
import { latestBlocksQueryOptions } from '@/services/thor/block'
import { BlockUsage } from './components/BlockUsage'
import { LatestBlocksSection } from './components/LatestBlocksSection'
import { Stats } from './components/Stats'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const activeNetworkName = zodParse({
    data: (await searchParams).network,
    schema: z.enum(Object.values(NetworkName)),
    errorMessage: 'Invalid network name',
    fallbackData: NetworkName.MAINNET,
  })

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(latestBlocksQueryOptions(activeNetworkName, 10))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Stack direction="column" gap={12}>
        <Flex gap={4}>
          <BlockUsage />
          <Stats />
        </Flex>

        <LatestBlocksSection />
      </Stack>
    </HydrationBoundary>
  )
}
