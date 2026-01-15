import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type BlockRevision, blockRevisionSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { blockExpandedQueryOptions } from '@/services/thor/block'
import { BlockDetails } from './components/BlockDetails'

export default async function BlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ blockId: string }>
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const { blockId: blockIdParam } = await params
  const networkName = (await searchParams).network || NetworkName.MAINNET

  // Parse blockId - accept both numeric block numbers and hex block hashes
  const blockId = zodParse({
    data: blockIdParam,
    schema: blockRevisionSchema,
    errorMessage: 'Invalid block ID',
    fallbackData: null,
  }) as BlockRevision | null

  if (!blockId) {
    notFound()
  }

  const activeNetworkName = zodParse({
    data: networkName,
    schema: z.enum(Object.values(NetworkName)),
    errorMessage: 'Invalid network name',
    fallbackData: NetworkName.MAINNET,
  })

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(blockExpandedQueryOptions(activeNetworkName, blockId))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlockDetails blockId={blockId} />
    </HydrationBoundary>
  )
}
