import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import type { AddressString } from '@/lib/schemas'
import { parseNetworkFromParams } from '@/lib/utils/network'
import { accountQueryOptions } from '@/services/thor/account'
import { vnsNameQueryOptions } from '@/services/thor/vns'
import { accountOverviewQueryOptions } from '@/services/veworld-indexer/account-overview'
import { AddressPageContent } from './components/AddressPageContent'

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: AddressString }>
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const { address } = await params

  if (!address) {
    notFound()
  }

  const activeNetworkName = await parseNetworkFromParams(searchParams)

  const queryClient = getQueryClient()
  await Promise.allSettled([
    queryClient.prefetchQuery(accountQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(vnsNameQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(accountOverviewQueryOptions(activeNetworkName, address)),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AddressPageContent address={address} />
    </HydrationBoundary>
  )
}
