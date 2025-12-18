import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import z from 'zod'
import { NetworkName } from '@/lib/constants/network'
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

  const queryClient = new QueryClient()
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
