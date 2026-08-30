import { useQueries, useQuery } from '@tanstack/react-query'
import { getUnixTime } from 'date-fns'
import { z } from 'zod'
import { useMemo } from 'react'
import { type NetworkName } from '@/lib/constants/network'
import { VALIDATOR_SLOTS_ANCHOR_SECONDS } from '@/lib/indexer-proxy'
import { useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'
import { bestBlockCompressedQueryOptions } from '@/services/thor/block'
import { IndexerVersion, indexerCachedGet, indexerCachedGetOrNull } from '.'
import { indexerResponseSchema } from './schemas'
import { validatorMetadataQueryOptions } from './validator-metadata'

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
  completedPeriods: z.number().default(0),
  cycleEndBlock: z.number().default(0),
  cyclePeriodLength: z.number().default(0),
  delegatorExitingVetStaked: z.number().default(0),
  delegatorQueuedVetStaked: z.number().default(0),
  delegatorTvl: z.number().default(0),
  delegatorVetStaked: z.number().default(0),
  endorser: z.string().optional(),
  exitingVetStaked: z.number().default(0),
  missedSlotsPercentage: z.number().default(0),
  nextCycleAvgDelegatorYield: z.number().default(0),
  nextCycleValidatorYield: z.number().default(0),
  nftYields: nftYieldsSchema,
  nftYieldsIfDelegatedNextCycle: nftYieldsSchema,
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

type ValidatorIndexerData = z.infer<typeof validatorIndexerDataSchema>

// Delegations count schema
const delegationsCountSchema = z.object({
  validator: z.string(),
  queued: z.number(),
  exiting: z.number(),
  active: z.number(),
})

type ValidatorDelegationsCount = z.infer<typeof delegationsCountSchema>

const delegationsCountResponseSchema = z.object({
  data: z.array(delegationsCountSchema),
})

// Validator slot stats schema (v2: /validators/{id}/slots)
const validatorSlotStatsSchema = z.object({
  validator: z.string(),
  proposedBlocks: z.number(),
  missedSlots: z.number(),
  missedSlotRatio: z.number(),
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

const delegationsResponseSchema = indexerResponseSchema(delegationSchema)

// Combined validator details with computed fields
export interface ValidatorDetails {
  beneficiary?: string
  endorser?: string
  address: string
  status: ValidatorStatus

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
  // Block the cycle countdown projects from, with the chain timestamp it was produced at.
  chainHead?: { number: number; timestamp: number }

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
  const data = await indexerCachedGetOrNull({
    networkName,
    endPoint: 'validators/details',
    params: { address: validatorAddress },
    direct: { endPoint: `/validators/${validatorAddress}`, params: {}, version: IndexerVersion.V2 },
  })

  if (data === null) return null

  const parsed = zodParse({
    data,
    schema: validatorIndexerDataSchema,
    errorMessage: 'Invalid validator details response from VeWorld Indexer',
  })

  return parsed
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
  const result = await indexerCachedGet({
    networkName,
    endPoint: 'validators/delegations/count',
    params: { validator: validatorAddress },
  })

  const parsed = zodParse({
    data: result,
    schema: delegationsCountResponseSchema,
    errorMessage: 'Invalid delegations count response from VeWorld Indexer',
  })

  return parsed.data.length > 0 ? parsed.data[0] : null
}

/**
 * Fetch missed blocks percentage for a validator over the last 7 days
 */
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60

const getValidatorMissedBlocks = async ({
  networkName,
  validatorAddress,
}: {
  networkName: NetworkName
  validatorAddress: string
}): Promise<number> => {
  // Anchored to the proxy's cache window, not a block: a faster-moving key is never reused.
  const now = getUnixTime(new Date())
  const endTimestamp = now - (now % VALIDATOR_SLOTS_ANCHOR_SECONDS)
  const startTimestamp = endTimestamp - WEEK_IN_SECONDS

  const { data } = await indexerCachedGet({
    networkName,
    endPoint: 'validators/slots',
    params: { address: validatorAddress, startTimestamp: String(startTimestamp), endTimestamp: String(endTimestamp) },
    direct: {
      endPoint: `/validators/${validatorAddress}/slots`,
      params: { startTimestamp: String(startTimestamp), endTimestamp: String(endTimestamp) },
      version: IndexerVersion.V2,
    },
  })

  const parsed = zodParse({
    data,
    schema: validatorSlotStatsSchema,
    errorMessage: 'Invalid validator slots response from VeWorld Indexer',
  })

  return Number.isFinite(parsed.missedSlotRatio) ? parsed.missedSlotRatio * 100 : 0
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
    const { data } = await indexerCachedGet({
      networkName,
      endPoint: 'validators/delegations',
      params: { validator: validatorAddress, page: String(page), size: String(pageSize) },
    })

    const parsed = zodParse({
      data,
      schema: delegationsResponseSchema,
      errorMessage: 'Invalid delegations response from VeWorld Indexer',
    })

    allDelegations.push(...parsed.data)

    // Check if there are more pages
    hasMore = parsed.data.length === pageSize && allDelegations.length < (parsed.pagination.totalElements ?? Infinity)
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
  refetchInterval: 60000,
})

export const useValidatorDetails = (address: string | undefined) => {
  const { activeNetwork } = useSettingsStore()

  const results = useQueries({
    queries: [
      validatorDetailsQueryOptions(activeNetwork.name, address),
      validatorDelegationsCountQueryOptions(activeNetwork.name, address),
      validatorMissedBlocksQueryOptions(activeNetwork.name, address),
      validatorMetadataQueryOptions(activeNetwork.name, address),
      validatorDelegationsQueryOptions(activeNetwork.name, address),
    ],
  })

  const [validatorQuery, delegationsCountQuery, missedBlocksQuery, metadataQuery, delegationsQuery] = results

  // Only the cycle countdown reads this, so it stays off the address pages that turn out
  // not to be validators, which is nearly all of them.
  const { data: bestBlock } = useQuery({
    ...bestBlockCompressedQueryOptions(activeNetwork.name),
    enabled: Boolean(validatorQuery.data),
    // One anchor is enough — the countdown projects forward at the chain's own cadence.
    refetchInterval: false,
  })
  const chainHead = useMemo(
    () => (bestBlock ? { number: bestBlock.number, timestamp: bestBlock.timestamp } : undefined),
    [bestBlock],
  )

  const validator = useMemo<ValidatorDetails | null>(() => {
    const validatorData = validatorQuery.data as ValidatorIndexerData | null | undefined
    if (!validatorData) return null

    const delegationsCount = delegationsCountQuery.data as ValidatorDelegationsCount | null | undefined
    const missedPercentage = (missedBlocksQuery.data as number | undefined) ?? validatorData.missedSlotsPercentage ?? 0
    const metadata = metadataQuery.data
    const delegationsData = delegationsQuery.data as { uniqueWallets: number; totalNfts: number } | undefined

    const activeDelegations = delegationsCount?.active ?? 0
    const queuedDelegations = delegationsCount?.queued ?? 0
    const exitingDelegations = delegationsCount?.exiting ?? 0

    return {
      beneficiary: validatorData.beneficiary,
      endorser: validatorData.endorser,
      address: validatorData.id,
      status: validatorData.status,

      vetStaked: validatorData.vetStaked ?? 0,
      validatorVetStaked: validatorData.validatorVetStaked ?? 0,
      delegatorVetStaked: validatorData.delegatorVetStaked ?? 0,
      queuedStake: validatorData.queuedVetStaked ?? 0,
      exitingVET: validatorData.exitingVetStaked ?? 0,

      activeDelegations,
      queuedDelegations,
      exitingDelegations,
      totalDelegations: activeDelegations + queuedDelegations + exitingDelegations,
      uniqueWallets: delegationsData?.uniqueWallets ?? 0,
      totalNfts: delegationsData?.totalNfts ?? 0,

      delegatorApy: validatorData.avgDelegatorYield ?? 0,
      nextCycleDelegatorApy: validatorData.nextCycleAvgDelegatorYield ?? 0,
      validatorApy: validatorData.validatorYield ?? 0,
      nextCycleValidatorApy: validatorData.nextCycleValidatorYield ?? 0,
      nftYieldsNextCycle: { ...validatorData.nftYields, ...validatorData.nftYieldsIfDelegatedNextCycle },

      reliability: 100 - missedPercentage,
      percentageOffline: missedPercentage,

      cyclePeriodLength: validatorData.cyclePeriodLength ?? 0,
      cycleEndBlock: validatorData.cycleEndBlock ?? 0,
      startBlock: validatorData.startBlock ?? 0,
      completedPeriods: validatorData.completedPeriods ?? 0,
      chainHead,

      metadata: metadata ?? undefined,
    }
  }, [
    validatorQuery.data,
    delegationsCountQuery.data,
    missedBlocksQuery.data,
    metadataQuery.data,
    delegationsQuery.data,
    chainHead,
  ])

  const isPending = validatorQuery.isPending || delegationsCountQuery.isPending || metadataQuery.isPending
  const isFetched = validatorQuery.isFetched || delegationsCountQuery.isFetched || metadataQuery.isFetched
  const isError = validatorQuery.isError || delegationsCountQuery.isError || missedBlocksQuery.isError

  return {
    data: validator,
    isPending,
    isError,
    isFetched,
    isValidator: validator !== null && isFetched,
  }
}
