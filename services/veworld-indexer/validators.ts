import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { IndexerVersion, indexerGet, resolveUrl } from '.'
import { indexerResponseSchema } from './schemas'

const ALL_VALIDATORS_COUNT_QUERY_KEY = 'getAllValidatorsCount'
const ALL_VALIDATORS_QUERY_KEY = 'getAllValidators'

/** @public */
export enum ValidatorStatus {
  NONE = 'NONE',
  QUEUED = 'QUEUED',
  ACTIVE = 'ACTIVE',
  EXITED = 'EXITED',
  EXITING = 'EXITING',
}

const validatorSchema = z.object({
  id: z.string(),
  // Mainnet returns records carrying only stats, with no status.
  status: z.nativeEnum(ValidatorStatus).optional(),
  vetStaked: z.number().optional(),
  validatorVetStaked: z.number().optional(),
  delegatorVetStaked: z.number().optional(),
})

const validatorsResponseSchema = indexerResponseSchema(validatorSchema)

const getValidators = async ({
  networkName,
  endorser,
  status,
  page = 0,
  size = 100,
}: {
  networkName: NetworkName
  endorser?: string
  status?: ValidatorStatus
  page?: number
  size?: number
}) => {
  const params: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    ...(endorser && { endorser }),
    ...(status && { status }),
  }

  const { data } = await indexerGet({
    baseUrl: resolveUrl(networkName, IndexerVersion.V2),
    endPoint: '/validators',
    params,
  })

  return zodParse({
    data,
    schema: validatorsResponseSchema,
    errorMessage: 'Invalid validators response from VeWorld Indexer',
  })
}

type ValidatorQueryOptions = {
  endorser?: string
  status?: ValidatorStatus
}

export const allValidatorsQueryOptions = (networkName: NetworkName, options?: ValidatorQueryOptions) => ({
  queryKey: [ALL_VALIDATORS_QUERY_KEY, networkName, options?.endorser, options?.status],
  queryFn: () => getAllValidators({ networkName, ...options }),
  refetchInterval: 60 * 1000,
})

const validatorsCountQueryOptions = (networkName: NetworkName, options?: ValidatorCountOptions) => ({
  queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, networkName, options?.endorser, options?.status],
  queryFn: () => getAllValidatorsCount(networkName, options),
  refetchInterval: 60 * 1000,
})

type Validator = z.infer<typeof validatorSchema>

/**
 * Fetch all validators across multiple pages with parallel batch fetching.
 * Mirrors the same pagination strategy used for counting.
 */
const getAllValidators = async ({
  networkName,
  endorser,
  status,
}: {
  networkName: NetworkName
  endorser?: string
  status?: ValidatorStatus
}): Promise<Validator[]> => {
  const PAGE_SIZE = 150
  const PARALLEL_LIMIT = 3
  const MAX_PAGES = 20

  const firstResponse = await getValidators({
    networkName,
    endorser,
    status,
    page: 0,
    size: PAGE_SIZE,
  })
  const all = [...firstResponse.data]

  if (!firstResponse.pagination.hasNext) {
    return all
  }

  let currentPage = 1
  let shouldContinue = true

  while (shouldContinue && currentPage < MAX_PAGES) {
    const batch = Array.from({ length: Math.min(PARALLEL_LIMIT, MAX_PAGES - currentPage) }, (_, i) => currentPage + i)
    const batchPromises = batch.map(page => getValidators({ networkName, endorser, status, page, size: PAGE_SIZE }))

    const batchResults = await Promise.allSettled(batchPromises)

    shouldContinue = false
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        all.push(...result.value.data)
        if (result.value.pagination.hasNext) shouldContinue = true
      } else {
        console.warn(`Failed to fetch validators page in batch starting at ${currentPage}:`, result.reason)
      }
    }

    shouldContinue =
      shouldContinue && batchResults.every(result => result.status === 'fulfilled' && result.value.pagination.hasNext)

    currentPage += batch.length
  }

  if (currentPage >= MAX_PAGES && shouldContinue) {
    console.warn(`Reached maximum page limit (${MAX_PAGES}) for validators`)
  }

  return all
}

export const useValidatorsCount = (options?: ValidatorCountOptions) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    ...validatorsCountQueryOptions(activeNetwork.name, options),
    enabled: activeNetwork.name !== NetworkName.SOLO,
  })
}

export const useValidators = (options?: ValidatorQueryOptions) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    ...allValidatorsQueryOptions(activeNetwork.name, options),
    enabled: activeNetwork.name !== NetworkName.SOLO,
  })
}

type ValidatorCountOptions = {
  endorser?: string
  status?: ValidatorStatus
}

/**
 * Fetch all validators across multiple pages with parallel batch fetching
 *
 * Optimized approach:
 * 1. First request with PAGE_SIZE=150 covers all ~101 active validators in 1 request
 * 2. If more pages exist, fetches remaining pages in parallel batches
 * 3. Handles failures gracefully with Promise.allSettled
 *
 * @param networkName - The network to fetch validators from
 * @param options - Optional filters (endorser, status)
 * @returns Total count of validators
 */
const getAllValidatorsCount = async (networkName: NetworkName, options?: ValidatorCountOptions): Promise<number> => {
  const PAGE_SIZE = 150 // Optimized for ~101 active validators
  const PARALLEL_LIMIT = 3 // Fetch 3 pages at a time if needed
  const MAX_PAGES = 20 // Safety limit (150 * 20 = 3000 validators max)

  const { endorser, status } = options ?? {}

  // First request - should get all validators in most cases
  const firstResponse = await getValidators({ networkName, endorser, status, page: 0, size: PAGE_SIZE })
  let totalCount = firstResponse.data.length

  // If no more pages, return early (common case for ~101 validators)
  if (!firstResponse.pagination.hasNext) {
    return totalCount
  }

  // Fetch remaining pages in parallel batches
  let currentPage = 1
  let shouldContinue = true

  while (shouldContinue && currentPage < MAX_PAGES) {
    // Prepare batch of pages to fetch
    const batch = Array.from({ length: Math.min(PARALLEL_LIMIT, MAX_PAGES - currentPage) }, (_, i) => currentPage + i)

    // Fetch batch in parallel
    const batchPromises = batch.map(page => getValidators({ networkName, endorser, status, page, size: PAGE_SIZE }))

    const batchResults = await Promise.allSettled(batchPromises)

    // Process results
    shouldContinue = false
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        totalCount += result.value.data.length
        // Continue if any page has more data
        if (result.value.pagination.hasNext) {
          shouldContinue = true
        }
      } else {
        console.warn(`Failed to fetch validators page in batch starting at ${currentPage}:`, result.reason)
      }
    }

    // Only continue if ALL pages in the batch have hasNext
    shouldContinue =
      shouldContinue && batchResults.every(result => result.status === 'fulfilled' && result.value.pagination.hasNext)

    currentPage += batch.length
  }

  if (currentPage >= MAX_PAGES && shouldContinue) {
    console.warn(`Reached maximum page limit (${MAX_PAGES}) for validators`)
  }

  return totalCount
}
