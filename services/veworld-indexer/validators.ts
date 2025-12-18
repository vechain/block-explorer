import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { indexerResponseSchema } from './schemas'

export enum ValidatorStatus {
  NONE = 'NONE',
  QUEUED = 'QUEUED',
  ACTIVE = 'ACTIVE',
  EXITED = 'EXITED',
  EXITING = 'EXITING',
}

const validatorSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(ValidatorStatus),
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  vetStaked: z.number(),
  validatorVetStaked: z.number(),
  delegatorVetStaked: z.number(),
  online: z.boolean().optional(),
})

const validatorsResponseSchema = indexerResponseSchema(validatorSchema)

export type Validator = z.infer<typeof validatorSchema>
export type ValidatorsResponse = z.infer<typeof validatorsResponseSchema>

export const validatorsQueryOptions = (
  networkName: NetworkName,
  status?: ValidatorStatus,
  page: number = 0,
  size: number = 100,
) => ({
  queryKey: [getValidators.name, networkName, status, page, size],
  queryFn: () => getValidators({ networkName, status, page, size }),
  refetchInterval: 60 * 1000, // Refetch every 60 seconds
})

const getValidators = async ({
  networkName,
  status,
  page = 0,
  size = 100,
}: {
  networkName: NetworkName
  status?: ValidatorStatus
  page?: number
  size?: number
}) => {
  const params: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
  }

  if (status) {
    params.status = status
  }

  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators',
    params,
  })

  return zodParse({
    data,
    schema: validatorsResponseSchema,
    errorMessage: 'Invalid validators response from VeWorld Indexer',
  })
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
 * @param status - Optional filter by validator status
 * @returns Total count of validators
 */
export const getAllValidatorsCount = async (networkName: NetworkName, status?: ValidatorStatus): Promise<number> => {
  const PAGE_SIZE = 150 // Optimized for ~101 active validators
  const PARALLEL_LIMIT = 3 // Fetch 3 pages at a time if needed
  const MAX_PAGES = 20 // Safety limit (150 * 20 = 3000 validators max)

  // First request - should get all validators in most cases
  const firstResponse = await getValidators({ networkName, status, page: 0, size: PAGE_SIZE })
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
    const batchPromises = batch.map(page => getValidators({ networkName, status, page, size: PAGE_SIZE }))

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

/**
 * Query options for validators count
 * Can be used for server-side prefetching
 */
export const validatorsCountQueryOptions = (networkName: NetworkName, status?: ValidatorStatus) => ({
  queryKey: ['validatorsCount', networkName, status],
  queryFn: () => getAllValidatorsCount(networkName, status),
  refetchInterval: 60 * 1000, // Refetch every 60 seconds
  retry: (failureCount: number, error: Error) => {
    // Retry up to 3 times for network errors
    if (failureCount < 3 && error?.message?.includes('fetch')) {
      return true
    }
    return false
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with 30s max
})
