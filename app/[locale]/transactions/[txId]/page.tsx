import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound, redirect } from 'next/navigation'
import type { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { type Transaction, type TransactionId, transactionIdSchema } from '@/lib/schemas'
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

  // Try to resolve the tx server-side. prefetchQuery (vs fetchQuery) swallows network errors,
  // so an unreachable node — including a solo node the server can't see — leaves the cache empty
  // rather than crashing the page. Anything that doesn't resolve here falls through to the client,
  // where the user's actual active network and node URL are available.
  const tryResolveTransaction = async (networkName: NetworkName): Promise<NetworkName | null> => {
    const options = transactionQueryOptions(networkName, transactionId)
    await queryClient.prefetchQuery(options)
    return queryClient.getQueryData<Transaction | null>(options.queryKey) ? networkName : null
  }

  let resolvedNetworkName = await tryResolveTransaction(activeNetworkName)
  if (!resolvedNetworkName) {
    const fallbackNetworkName = getFallbackNetworkName(activeNetworkName)
    if (fallbackNetworkName) {
      resolvedNetworkName = await tryResolveTransaction(fallbackNetworkName)
    }
  }

  if (resolvedNetworkName && requestedNetworkName !== resolvedNetworkName) {
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

  // If the tx wasn't resolved (unreachable node or genuinely missing), render anyway and let
  // TransactionPageContent + useRedirectOnNotFound handle it on the client.
  const prefetchNetworkName = resolvedNetworkName ?? activeNetworkName
  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery(transactionReceiptQueryOptions(prefetchNetworkName, transactionId)),
  ])

  logPrefetchFailures(prefetchResults, ['transactionReceipt'])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransactionPageContent transactionId={transactionId} view={view} />
    </HydrationBoundary>
  )
}
