import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound } from 'next/navigation'

// ISR: Cache page for 60 seconds, then revalidate in background
// Account data changes less frequently than homepage stats
export const revalidate = 60
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import type { AddressString } from '@/lib/schemas'
import { parseNetworkFromParams } from '@/lib/utils/network'
import { logPrefetchFailures } from '@/lib/utils/prefetch'
import { accountQueryOptions } from '@/services/thor/account'
import { bestBlockCompressedQueryOptions } from '@/services/thor/block'
import { vnsNameQueryOptions } from '@/services/thor/vns'
import { accountOverviewQueryOptions } from '@/services/veworld-indexer/account-overview'
import { allValidatorsQueryOptions } from '@/services/veworld-indexer/validators'
import {
  validatorDetailsQueryOptions,
  validatorDelegationsCountQueryOptions,
  validatorMissedBlocksQueryOptions,
  validatorDelegationsQueryOptions,
} from '@/services/veworld-indexer/validator-details'
import { validatorMetadataQueryOptions } from '@/services/veworld-indexer/validator-metadata'
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
  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery(accountQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(vnsNameQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(accountOverviewQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(allValidatorsQueryOptions(activeNetworkName, { endorser: address })),
    queryClient.prefetchQuery(bestBlockCompressedQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(validatorDetailsQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(validatorDelegationsCountQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(validatorMissedBlocksQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(validatorMetadataQueryOptions(activeNetworkName, address)),
    queryClient.prefetchQuery(validatorDelegationsQueryOptions(activeNetworkName, address)),
  ])

  logPrefetchFailures(prefetchResults, [
    'account',
    'vnsName',
    'accountOverview',
    'endorsedValidators',
    'bestBlock',
    'validatorDetails',
    'validatorDelegationsCount',
    'validatorMissedBlocks',
    'validatorMetadata',
    'validatorDelegations',
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AddressPageContent address={address} />
    </HydrationBoundary>
  )
}
