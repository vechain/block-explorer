import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { NetworkName } from '@/lib/constants/network'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { IndexerVersion, indexerFetch } from '.'
import { indexerResponseSchema } from './schemas'

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

  const { data } = await indexerFetch({
    networkName,
    endPoint: 'validators',
    params,
    version: IndexerVersion.V2,
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

const allValidatorsQueryOptions = (networkName: NetworkName, options?: ValidatorQueryOptions) => ({
  queryKey: [ALL_VALIDATORS_QUERY_KEY, networkName, options?.endorser, options?.status],
  queryFn: () => getAllValidators({ networkName, ...options }),
  refetchInterval: 60 * 1000,
})

type Validator = z.infer<typeof validatorSchema>

/** Pages the full set in parallel batches; 150 covers the current validator set in one call. */
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

export const useValidators = (options?: ValidatorQueryOptions) => {
  const { activeNetwork } = useSettingsStore()
  return useQuery({
    ...allValidatorsQueryOptions(activeNetwork.name, options),
    enabled: activeNetwork.name !== NetworkName.SOLO,
  })
}
