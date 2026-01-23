import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { NetworkName } from '@/lib/constants/network'
import { getQueryClient } from '@/lib/query-client/query-client'
import { parseNetworkFromParams } from '@/lib/utils/network'
import { logPrefetchFailures } from '@/lib/utils/prefetch'
import {
  validatorsListQueryOptions,
  validatorsDelegationsCountQueryOptions,
  validatorsMissedBlocksQueryOptions,
  validatorsMetadataQueryOptions,
} from '@/services/veworld-indexer/validators-list'
import { ValidatorsPageContent } from './components/ValidatorsPageContent'

export const dynamic = 'force-dynamic'

export default async function ValidatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ network: NetworkName | undefined }>
}) {
  const activeNetworkName = await parseNetworkFromParams(searchParams)
  const queryClient = getQueryClient()

  const prefetchResults = await Promise.allSettled([
    queryClient.prefetchQuery(validatorsListQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(validatorsDelegationsCountQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(validatorsMissedBlocksQueryOptions(activeNetworkName)),
    queryClient.prefetchQuery(validatorsMetadataQueryOptions(activeNetworkName)),
  ])

  logPrefetchFailures(prefetchResults, [
    'validatorsList',
    'validatorsDelegationsCount',
    'validatorsMissedBlocks',
    'validatorsMetadata',
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ValidatorsPageContent />
    </HydrationBoundary>
  )
}
