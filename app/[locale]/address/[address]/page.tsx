import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'

// Force dynamic rendering - ensures SSR data prefetching works in production
export const dynamic = 'force-dynamic'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import type { AddressString } from '@/lib/schemas'
import { zodParse } from '@/lib/utils/zod'
import { accountQueryOptions } from '@/services/thor/account'
import { vnsNameQueryOptions } from '@/services/thor/vns'
import { AddressPageContent } from './components/AddressPageContent'

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ address: AddressString }>
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const { address } = await params
  const networkName = (await searchParams).network || NetworkName.MAINNET

  if (!address) {
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
    queryClient.prefetchQuery(accountQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(vnsNameQueryOptions(activeNetworkName, address)),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AddressPageContent address={address} />
    </HydrationBoundary>
  )
}
