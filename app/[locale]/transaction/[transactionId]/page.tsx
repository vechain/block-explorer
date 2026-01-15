import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'

import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type TransactionId, transactionIdSchema } from '@/lib/schemas'
import { parseNetworkFromParams } from '@/lib/utils/network'
import { transactionQueryOptions, transactionReceiptQueryOptions } from '@/services/thor/transaction'
import { TransactionPageContent } from './components/TransactionPageContent'

export default async function TransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: TransactionId }>
  searchParams: Promise<{ network: NetworkName | undefined; view: string | undefined }>
}) {
  const { transactionId } = await params
  const { view } = await searchParams

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success) {
    notFound()
  }

  const activeNetworkName = await parseNetworkFromParams(searchParams)

  const queryClient = getQueryClient()

  await Promise.allSettled([
    queryClient.prefetchQuery(transactionQueryOptions(activeNetworkName, transactionId)),
    queryClient.prefetchQuery(transactionReceiptQueryOptions(activeNetworkName, transactionId)),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionPageContent transactionId={transactionId} view={view} />
    </HydrationBoundary>
  )
}
