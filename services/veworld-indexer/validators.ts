import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
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

/** @public */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

/** @public */
export enum ValidatorSortBy {
  VALIDATOR_TVL = 'validatorTvl',
  TOTAL_TVL = 'totalTvl',
  BLOCK_PROBABILITY = 'blockProbability',
  DELEGATOR_TVL = 'delegatorTvl',
  NFT_STRENGTH = 'nft:Strength',
  NFT_THUNDER = 'nft:Thunder',
  NFT_MJOLNIR = 'nft:Mjolnir',
  NFT_VETHORX = 'nft:VeThorX',
  NFT_STRENGTHX = 'nft:StrengthX',
  NFT_THUNDERX = 'nft:ThunderX',
  NFT_MJOLNIRX = 'nft:MjolnirX',
  NFT_DAWN = 'nft:Dawn',
  NFT_LIGHTNING = 'nft:Lightning',
  NFT_FLASH = 'nft:Flash',
}

const validatorSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(ValidatorStatus),
  vetStaked: z.number().optional(),
  validatorVetStaked: z.number().optional(),
  delegatorVetStaked: z.number().optional(),
  online: z.boolean().optional(),
})

const validatorsResponseSchema = indexerResponseSchema(validatorSchema)

const getValidators = async ({
  networkName,
  endorser,
  validatorId,
  status,
  page = 0,
  size = 100,
  direction,
  sortBy,
}: {
  networkName: NetworkName
  endorser?: string
  validatorId?: string
  status?: ValidatorStatus
  page?: number
  size?: number
  direction?: SortDirection
  sortBy?: ValidatorSortBy
}) => {
  const params: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
    ...(endorser && { endorser }),
    ...(validatorId && { validatorId }),
    ...(status && { status }),
    ...(direction && { direction }),
    ...(sortBy && { sortBy }),
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

export type ValidatorQueryOptions = {
  endorser?: string
  validatorId?: string
  status?: ValidatorStatus
  direction?: SortDirection
  sortBy?: ValidatorSortBy
}

export const allValidatorsQueryOptions = (networkName: NetworkName, options?: ValidatorQueryOptions) => ({
  queryKey: [
    ALL_VALIDATORS_QUERY_KEY,
    networkName,
    options?.endorser,
    options?.validatorId,
    options?.status,
    options?.direction,
    options?.sortBy,
  ],
  queryFn: () => getAllValidators({ networkName, ...options }),
  refetchInterval: 60 * 1000,
})

export const validatorsCountQueryOptions = (networkName: NetworkName, options?: ValidatorCountOptions) => ({
  queryKey: [ALL_VALIDATORS_COUNT_QUERY_KEY, networkName, options?.endorser, options?.validatorId, options?.status],
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
  validatorId,
  status,
  direction,
  sortBy,
}: {
  networkName: NetworkName
  endorser?: string
  validatorId?: string
  status?: ValidatorStatus
  direction?: SortDirection
  sortBy?: ValidatorSortBy
}): Promise<Validator[]> => {
  const PAGE_SIZE = 150
  const PARALLEL_LIMIT = 3
  const MAX_PAGES = 20

  const firstResponse = await getValidators({
    networkName,
    endorser,
    validatorId,
    status,
    direction,
    sortBy,
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
    const batchPromises = batch.map(page =>
      getValidators({ networkName, endorser, validatorId, status, direction, sortBy, page, size: PAGE_SIZE }),
    )

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

export type ValidatorCountOptions = {
  endorser?: string
  validatorId?: string
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
 * @param options - Optional filters (endorser, validatorId, status)
 * @returns Total count of validators
 */
const getAllValidatorsCount = async (networkName: NetworkName, options?: ValidatorCountOptions): Promise<number> => {
  const PAGE_SIZE = 150 // Optimized for ~101 active validators
  const PARALLEL_LIMIT = 3 // Fetch 3 pages at a time if needed
  const MAX_PAGES = 20 // Safety limit (150 * 20 = 3000 validators max)

  const { endorser, validatorId, status } = options ?? {}

  // First request - should get all validators in most cases
  const firstResponse = await getValidators({ networkName, endorser, validatorId, status, page: 0, size: PAGE_SIZE })
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
    const batchPromises = batch.map(page =>
      getValidators({ networkName, endorser, validatorId, status, page, size: PAGE_SIZE }),
    )

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
