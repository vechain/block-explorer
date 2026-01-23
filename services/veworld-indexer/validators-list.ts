import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { indexerResponseSchema } from './schemas'
import { ValidatorStatus, type ValidatorMetadata } from './validator-details'

const VALIDATORS_LIST_QUERY_KEY = 'validatorsList'
const VALIDATORS_METADATA_QUERY_KEY = 'validatorsMetadata'
const VALIDATORS_DELEGATIONS_COUNT_QUERY_KEY = 'validatorsDelegationsCount'
const VALIDATORS_MISSED_BLOCKS_QUERY_KEY = 'validatorsMissedBlocks'

const nftYieldsSchema = z.record(z.string(), z.number()).default({})

const validatorListItemSchema = z.object({
  id: z.string(),
  avgDelegatorYield: z.number().default(0),
  beneficiary: z.string().optional(),
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  completedPeriods: z.number().default(0),
  cycleEndBlock: z.number().default(0),
  cyclePeriodLength: z.number().default(0),
  delegatorVetStaked: z.number().default(0),
  endorser: z.string().optional(),
  nextCycleAvgDelegatorYield: z.number().default(0),
  nextCycleValidatorYield: z.number().default(0),
  nftYieldsNextCycle: nftYieldsSchema,
  online: z.boolean().optional(),
  percentageOffline: z.number().default(0),
  startBlock: z.number().default(0),
  status: z.nativeEnum(ValidatorStatus),
  validatorVetStaked: z.number().default(0),
  validatorYield: z.number().default(0),
  vetStaked: z.number().default(0),
  queuePosition: z.number().optional(),
})

export type ValidatorListItem = z.infer<typeof validatorListItemSchema>

const validatorsListResponseSchema = indexerResponseSchema(validatorListItemSchema)

const delegationsCountSchema = z.object({
  validator: z.string(),
  queued: z.number(),
  exiting: z.number(),
  active: z.number(),
})

export type ValidatorDelegationsCount = z.infer<typeof delegationsCountSchema>

const delegationsCountResponseSchema = z.object({
  data: z.array(delegationsCountSchema),
})

const missedBlocksSchema = z.object({
  validator: z.string(),
  missedPercentage: z.number(),
})

const missedBlocksResponseSchema = z.object({
  timeframe: z.string(),
  startBlock: z.number(),
  endBlock: z.number(),
  validators: z.array(missedBlocksSchema),
})

export type ValidatorMissedBlocks = z.infer<typeof missedBlocksSchema>

const validatorMetadataSchema = z.object({
  address: z.string(),
  name: z.string(),
  location: z.string(),
  desc: z.string(),
  website: z.string().optional(),
  logo: z.string(),
})

const validatorMetadataArraySchema = z.array(validatorMetadataSchema)

const VALIDATOR_HUB_BASE_URL = 'https://vechain.github.io/validator-hub'

const networkNameToValidatorHubId = (networkName: NetworkName): string => {
  return networkName === 'mainnet' ? 'main' : 'test'
}

export interface ValidatorForList {
  address: string
  status: ValidatorStatus
  online: boolean
  vetStaked: number
  validatorVetStaked: number
  delegatorVetStaked: number
  delegatorApy: number
  nextCycleDelegatorApy: number
  validatorApy: number
  nextCycleValidatorApy: number
  nftYieldsNextCycle: Record<string, number>
  reliability: number
  percentageOffline: number
  cyclePeriodLength: number
  startBlock: number
  completedPeriods: number
  activeDelegations: number
  queuedDelegations: number
  exitingDelegations: number
  queuePosition?: number
  metadata?: ValidatorMetadata
}

const getValidatorsList = async ({
  networkName,
  page = 0,
  size = 150,
}: {
  networkName: NetworkName
  page?: number
  size?: number
}) => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators',
    params: {
      page: page.toString(),
      size: size.toString(),
    },
  })

  return zodParse({
    data,
    schema: validatorsListResponseSchema,
    errorMessage: 'Invalid validators list response from VeWorld Indexer',
  })
}

const getAllValidatorsList = async (networkName: NetworkName): Promise<ValidatorListItem[]> => {
  const PAGE_SIZE = 150
  const allValidators: ValidatorListItem[] = []

  const firstResponse = await getValidatorsList({ networkName, page: 0, size: PAGE_SIZE })
  allValidators.push(...firstResponse.data)

  if (!firstResponse.pagination.hasNext) {
    return allValidators
  }

  let currentPage = 1
  let hasMore = true

  while (hasMore && currentPage < 20) {
    const response = await getValidatorsList({ networkName, page: currentPage, size: PAGE_SIZE })
    allValidators.push(...response.data)
    hasMore = response.pagination.hasNext
    currentPage++
  }

  return allValidators
}

const getAllValidatorsDelegationsCount = async (networkName: NetworkName): Promise<ValidatorDelegationsCount[]> => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators/delegations/count',
    params: {},
  })

  const parsed = zodParse({
    data,
    schema: delegationsCountResponseSchema,
    errorMessage: 'Invalid delegations count response from VeWorld Indexer',
  })

  return parsed.data
}

const getAllValidatorsMissedBlocks = async (networkName: NetworkName): Promise<ValidatorMissedBlocks[]> => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators/blocks/missed',
    params: { timeframe: 'WEEK' },
  })

  const parsed = zodParse({
    data,
    schema: missedBlocksResponseSchema,
    errorMessage: 'Invalid missed blocks response from VeWorld Indexer',
  })

  return parsed.validators
}

const getAllValidatorsMetadata = async (networkName: NetworkName): Promise<ValidatorMetadata[]> => {
  const validatorHubNetworkId = networkNameToValidatorHubId(networkName)
  const url = `${VALIDATOR_HUB_BASE_URL}/${validatorHubNetworkId}.json`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    console.warn('Failed to fetch validators metadata from validator-hub')
    return []
  }

  const data = await response.json()

  const parsed = zodParse({
    data,
    schema: validatorMetadataArraySchema,
    errorMessage: 'Invalid validators metadata response from validator-hub',
  })

  return parsed.map(meta => ({
    ...meta,
    logo: `${VALIDATOR_HUB_BASE_URL}/${meta.logo}`,
  }))
}

export const validatorsListQueryOptions = (networkName: NetworkName) => ({
  queryKey: [VALIDATORS_LIST_QUERY_KEY, networkName],
  queryFn: () => getAllValidatorsList(networkName),
  staleTime: 60000,
  refetchInterval: 60000,
})

export const validatorsDelegationsCountQueryOptions = (networkName: NetworkName) => ({
  queryKey: [VALIDATORS_DELEGATIONS_COUNT_QUERY_KEY, networkName],
  queryFn: () => getAllValidatorsDelegationsCount(networkName),
  staleTime: 60000,
  refetchInterval: 60000,
})

export const validatorsMissedBlocksQueryOptions = (networkName: NetworkName) => ({
  queryKey: [VALIDATORS_MISSED_BLOCKS_QUERY_KEY, networkName],
  queryFn: () => getAllValidatorsMissedBlocks(networkName),
  staleTime: 60000,
  refetchInterval: 60000,
})

export const validatorsMetadataQueryOptions = (networkName: NetworkName) => ({
  queryKey: [VALIDATORS_METADATA_QUERY_KEY, networkName],
  queryFn: () => getAllValidatorsMetadata(networkName),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
})
