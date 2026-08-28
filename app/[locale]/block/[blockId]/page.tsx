import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type BlockRevision, blockRevisionSchema } from '@/lib/schemas'
import { parseNetworkFromParams } from '@/lib/utils/network'
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

  // Parse blockId - accept both numeric block numbers and hex block hashes
  const blockId = zodParse({
    data: blockIdParam,
    schema: blockRevisionSchema,
    errorMessage: 'Invalid block ID',
  }) as BlockRevision | null

  if (!blockId) {
    notFound()
  }

  const activeNetworkName = await parseNetworkFromParams(searchParams)

  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(blockExpandedQueryOptions(activeNetworkName, blockId))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlockDetails blockId={blockId} />
    </HydrationBoundary>
  )
}
