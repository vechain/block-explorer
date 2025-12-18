import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'
import { NetworkName } from '@/lib/constants/network'
import { type TransactionId, transactionIdSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { transactionQueryOptions } from '@/services/thor/transaction'
import { TransactionClauseList } from './components/TransactionClauseList'

export default async function TransactionClausesPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: TransactionId }>
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const { transactionId } = await params
  const networkName = (await searchParams).network || NetworkName.MAINNET

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success) {
    notFound()
  }

  const activeNetworkName = zodParse({
    data: networkName,
    schema: z.enum(Object.values(NetworkName)),
    errorMessage: 'Invalid network name',
    fallbackData: NetworkName.MAINNET,
  })

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery(transactionQueryOptions(activeNetworkName, transactionId))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionClauseList transactionId={transactionId} />
    </HydrationBoundary>
  )
}
