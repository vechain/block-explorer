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
import { TransactionPageContent } from './components/TransactionPageContent'

export default async function TransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: TransactionId }>
  searchParams: Promise<{ network: NetworkName | undefined; view: string | undefined }>
}) {
  const { transactionId } = await params
  const { network: networkName, view } = await searchParams

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success) {
    notFound()
  }

  const activeNetworkName = zodParse({
    data: networkName || NetworkName.MAINNET,
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
      <TransactionPageContent transactionId={transactionId} view={view} />
    </HydrationBoundary>
  )
}
