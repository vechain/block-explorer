import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound, redirect } from 'next/navigation'

// ISR: Cache page for 10 seconds - confirmations increase with each new block
export const revalidate = 10

import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type TransactionId, transactionIdSchema } from '@/lib/schemas'
import {
  getFallbackNetworkName,
  getHrefWithNetworkSearchParam,
  parseNetworkFromParams,
  parseNetworkName,
} from '@/lib/utils/network'
import { logPrefetchFailures } from '@/lib/utils/prefetch'
import { transactionQueryOptions, transactionReceiptQueryOptions } from '@/services/thor/transaction'
import { TransactionPageContent } from './components/TransactionPageContent'

export default async function TransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ txId: TransactionId }>
  searchParams: Promise<{ network: NetworkName | undefined; view: string | undefined }>
}) {
  const { txId: transactionId } = await params
  const resolvedSearchParams = await searchParams
  const { network, view } = resolvedSearchParams

  if (!transactionId || !transactionIdSchema.safeParse(transactionId).success) {
    notFound()
  }

  const activeNetworkName = await parseNetworkFromParams(searchParams)
  const requestedNetworkName = parseNetworkName(network)

  const queryClient = getQueryClient()
  const transaction = await queryClient.fetchQuery(transactionQueryOptions(activeNetworkName, transactionId))

  let resolvedNetworkName = activeNetworkName

  if (!transaction) {
    const fallbackNetworkName = getFallbackNetworkName(activeNetworkName)
    if (!fallbackNetworkName) {
      notFound()
    }

    const fallbackTransaction = await queryClient.fetchQuery(
      transactionQueryOptions(fallbackNetworkName, transactionId),
    )

    if (!fallbackTransaction) {
      notFound()
    }

    resolvedNetworkName = fallbackNetworkName
  }

  if (requestedNetworkName !== resolvedNetworkName) {
    const redirectSearchParams = new URLSearchParams()

    if (view) {
      redirectSearchParams.set('view', view)
    }

    redirect(
      getHrefWithNetworkSearchParam({
        pathname: `/transactions/${transactionId}`,
        searchParams: redirectSearchParams,
        networkName: resolvedNetworkName,
      }),
    )
  }

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery(transactionReceiptQueryOptions(resolvedNetworkName, transactionId)),
  ])

  logPrefetchFailures(prefetchResults, ['transactionReceipt'])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionPageContent transactionId={transactionId} view={view} />
    </HydrationBoundary>
  )
}
