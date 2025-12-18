import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'
import { NetworkName } from '@/lib/constants/network'
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

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(blockExpandedQueryOptions(activeNetworkName, blockId))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BlockTransactionList blockId={blockId} />
    </HydrationBoundary>
  )
}
