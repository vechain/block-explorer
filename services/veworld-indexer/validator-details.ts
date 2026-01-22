import { z } from 'zod'
import { apiClient } from '@/lib/api'
import type { NetworkName } from '@/lib/constants/network'
import { zodParse } from '@/lib/utils/zod'
import { resolveUrl } from '.'
import { indexerResponseSchema } from './schemas'

// NFT Level Names for APY tiers
export const LevelName = {
  DAWN: 'Dawn',
  LIGHTNING: 'Lightning',
  FLASH: 'Flash',
  STRENGTH: 'Strength',
  THUNDER: 'Thunder',
  MJOLNIR: 'Mjolnir',
  VE_THOR_X: 'VeThorX',
  STRENGTH_X: 'StrengthX',
  THUNDER_X: 'ThunderX',
  MJOLNIR_X: 'MjolnirX',
} as const

export type LevelName = (typeof LevelName)[keyof typeof LevelName]

// NftYields can have any string key from the API, but we know the expected level names
type NftYields = Record<string, number>

export enum ValidatorStatus {
  NONE = 'NONE',
  QUEUED = 'QUEUED',
  ACTIVE = 'ACTIVE',
  EXITED = 'EXITED',
  EXITING = 'EXITING',
}

export interface ValidatorMetadata {
  address: string
  name: string
  location: string
  desc: string
  website?: string
  logo: string
}

// Schema for NFT yields - record of level names to numbers
const nftYieldsSchema = z.record(z.string(), z.number()).default({})

// Validator indexer data schema
const validatorIndexerDataSchema = z.object({
  id: z.string(),
  avgDelegatorYield: z.number().default(0),
  beneficiary: z.string().optional(),
  blockNumber: z.number(),
  blockTimestamp: z.number(),
  completedPeriods: z.number().default(0),
  cycleEndBlock: z.number().default(0),
  cyclePeriodLength: z.number().default(0),
  delegatorExitingVetStaked: z.number().default(0),
  delegatorQueuedVetStaked: z.number().default(0),
  delegatorTvl: z.number().default(0),
  delegatorVetStaked: z.number().default(0),
  endorser: z.string().optional(),
  exitingVetStaked: z.number().default(0),
  nextCycleAvgDelegatorYield: z.number().default(0),
  nextCycleValidatorYield: z.number().default(0),
  nftYieldsNextCycle: nftYieldsSchema,
  online: z.boolean().optional(),
  percentageOffline: z.number().default(0),
  queuedVetStaked: z.number().default(0),
  startBlock: z.number().default(0),
  status: z.nativeEnum(ValidatorStatus),
  validatorExitingVetStaked: z.number().default(0),
  validatorQueuedVetStaked: z.number().default(0),
  validatorVetStaked: z.number().default(0),
  validatorYield: z.number().default(0),
  vetStaked: z.number().default(0),
  queuePosition: z.number().optional(),
})

export type ValidatorIndexerData = z.infer<typeof validatorIndexerDataSchema>

const validatorDetailsResponseSchema = indexerResponseSchema(validatorIndexerDataSchema)

// Delegations count schema
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

// Missed blocks schema
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

// Delegation schema for fetching individual delegations
const delegationSchema = z.object({
  id: z.string(),
  validator: z.string(),
  tokenId: z.string(),
  owner: z.string(),
  status: z.string(),
  tokenLevel: z.string(),
  stakedAmount: z.string(),
  totalRewardsClaimed: z.string(),
})

type ValidatorDelegation = z.infer<typeof delegationSchema>

const delegationsResponseSchema = z.object({
  data: z.array(delegationSchema),
  meta: z.object({
    total: z.number(),
  }),
})

// Combined validator details with computed fields
export interface ValidatorDetails {
  address: string
  status: ValidatorStatus
  online: boolean

  // Stake amounts
  vetStaked: number // Total active VET staked
  validatorVetStaked: number // Validator's own stake
  delegatorVetStaked: number // Delegated stake
  queuedStake: number // Total queued stake
  exitingVET: number // Total exiting stake

  // Delegations counts
  activeDelegations: number
  queuedDelegations: number
  exitingDelegations: number
  totalDelegations: number
  uniqueWallets: number
  totalNfts: number

  // APY/Yields
  delegatorApy: number
  nextCycleDelegatorApy: number
  validatorApy: number
  nextCycleValidatorApy: number
  nftYieldsNextCycle: NftYields

  // Performance
  reliability: number
  percentageOffline: number

  // Cycle info
  cyclePeriodLength: number
  cycleEndBlock: number
  startBlock: number
  completedPeriods: number
  currentBlockNumber: number

  // Metadata
  metadata?: ValidatorMetadata
}

/**
 * Fetch validator details from the indexer
 */
const getValidatorDetails = async ({
  networkName,
  validatorAddress,
}: {
  networkName: NetworkName
  validatorAddress: string
}): Promise<ValidatorIndexerData | null> => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators',
    params: { validatorId: validatorAddress },
  })

  const parsed = zodParse({
    data,
    schema: validatorDetailsResponseSchema,
    errorMessage: 'Invalid validator details response from VeWorld Indexer',
  })

  return parsed.data.length > 0 ? parsed.data[0] : null
}

/**
 * Fetch delegations count for a validator
 */
const getValidatorDelegationsCount = async ({
  networkName,
  validatorAddress,
}: {
  networkName: NetworkName
  validatorAddress: string
}): Promise<ValidatorDelegationsCount | null> => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators/delegations/count',
    params: { validator: validatorAddress },
  })

  const parsed = zodParse({
    data,
    schema: delegationsCountResponseSchema,
    errorMessage: 'Invalid delegations count response from VeWorld Indexer',
  })

  return parsed.data.length > 0 ? parsed.data[0] : null
}

/**
 * Fetch missed blocks percentage for a validator
 */
const getValidatorMissedBlocks = async ({
  networkName,
  validatorAddress,
}: {
  networkName: NetworkName
  validatorAddress: string
}): Promise<number> => {
  const { data } = await apiClient.get({
    baseUrl: resolveUrl(networkName),
    endPoint: '/validators/blocks/missed',
    params: { timeframe: 'WEEK', validator: validatorAddress },
  })

  const parsed = zodParse({
    data,
    schema: missedBlocksResponseSchema,
    errorMessage: 'Invalid missed blocks response from VeWorld Indexer',
  })

  const validatorData = parsed.validators.find(v => v.validator.toLowerCase() === validatorAddress.toLowerCase())

  return validatorData?.missedPercentage ?? 0
}

/**
 * Fetch all delegations for a validator (with pagination)
 * Returns unique wallet count and total NFTs count
 */
const getValidatorDelegations = async ({
  networkName,
  validatorAddress,
}: {
  networkName: NetworkName
  validatorAddress: string
}): Promise<{ uniqueWallets: number; totalNfts: number }> => {
  const allDelegations: ValidatorDelegation[] = []
  let page = 0
  const pageSize = 100
  let hasMore = true

  // Fetch all pages
  while (hasMore) {
    const { data } = await apiClient.get({
      baseUrl: resolveUrl(networkName),
      endPoint: '/validators/delegations',
      params: { validator: validatorAddress, page: String(page), size: String(pageSize) },
    })

    const parsed = zodParse({
      data,
      schema: delegationsResponseSchema,
      errorMessage: 'Invalid delegations response from VeWorld Indexer',
    })

    allDelegations.push(...parsed.data)

    // Check if there are more pages
    hasMore = parsed.data.length === pageSize && allDelegations.length < parsed.meta.total
    page++

    // Safety limit to prevent infinite loops
    if (page > 50) break
  }

  // Calculate unique wallets
  const uniqueOwners = new Set(allDelegations.map(d => d.owner.toLowerCase()))

  return {
    uniqueWallets: uniqueOwners.size,
    totalNfts: allDelegations.length,
  }
}

// Query options for validator details
export const validatorDetailsQueryOptions = (networkName: NetworkName, address: string | undefined) => ({
  queryKey: ['validatorDetails', networkName, address],
  queryFn: () => getValidatorDetails({ networkName, validatorAddress: address! }),
  enabled: !!address,
  refetchInterval: 60000,
})

// Query options for delegations count
export const validatorDelegationsCountQueryOptions = (networkName: NetworkName, address: string | undefined) => ({
  queryKey: ['validatorDelegationsCount', networkName, address],
  queryFn: () => getValidatorDelegationsCount({ networkName, validatorAddress: address! }),
  enabled: !!address,
  refetchInterval: 60000,
})

// Query options for missed blocks
export const validatorMissedBlocksQueryOptions = (networkName: NetworkName, address: string | undefined) => ({
  queryKey: ['validatorMissedBlocks', networkName, address],
  queryFn: () => getValidatorMissedBlocks({ networkName, validatorAddress: address! }),
  enabled: !!address,
  refetchInterval: 60000,
})

// Query options for delegations (unique wallets and total NFTs)
export const validatorDelegationsQueryOptions = (networkName: NetworkName, address: string | undefined) => ({
  queryKey: ['validatorDelegations', networkName, address],
  queryFn: () => getValidatorDelegations({ networkName, validatorAddress: address! }),
  enabled: !!address,
  staleTime: 60000,
  refetchInterval: 60000,
})
