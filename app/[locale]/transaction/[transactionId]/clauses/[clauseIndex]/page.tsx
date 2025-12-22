import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type TransactionId, transactionIdSchema } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { transactionQueryOptions, transactionReceiptQueryOptions } from '@/services/thor/transaction'
import { ClauseDetailsPageContent } from './components/ClauseDetailsPageContent'

export default async function ClauseDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: TransactionId; clauseIndex: string }>
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const { transactionId, clauseIndex } = await params
  const networkName = (await searchParams).network || NetworkName.MAINNET

  const clauseIndexNumber = Number(clauseIndex)

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success || Number.isNaN(clauseIndexNumber)) {
    notFound()
  }

  const activeNetworkName = zodParse({
    data: networkName,
    schema: z.enum(Object.values(NetworkName)),
    errorMessage: 'Invalid network name',
    fallbackData: NetworkName.MAINNET,
  })

  const queryClient = getQueryClient()
  await Promise.all([
    queryClient.prefetchQuery(transactionQueryOptions(activeNetworkName, transactionId)),
    queryClient.prefetchQuery(transactionReceiptQueryOptions(activeNetworkName, transactionId)),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClauseDetailsPageContent transactionId={transactionId} clauseIndex={clauseIndexNumber} />
    </HydrationBoundary>
  )
}
