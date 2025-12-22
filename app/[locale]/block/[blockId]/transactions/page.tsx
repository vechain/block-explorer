import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type BlockId, blockIdSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { blockExpandedQueryOptions } from '@/services/thor/block'
import { BlockTransactionList } from './components/BlockTransactionList'

export default async function BlockTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ blockId: BlockId }>
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const { blockId } = await params
  const networkName = (await searchParams).network || NetworkName.MAINNET

  if (!blockId || !blockIdSchema.safeParse(blockId).success) {
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
      <BlockTransactionList blockId={blockId} />
    </HydrationBoundary>
  )
}
