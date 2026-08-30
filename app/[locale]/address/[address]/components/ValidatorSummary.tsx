'use client'

import { Badge, Box, Flex, Grid, Heading, HStack, Link, Stack, Text, VStack } from '@chakra-ui/react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuExternalLink, LuGlobe, LuMapPin } from 'react-icons/lu'
import { Card } from '@/components/ui/Card'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { IDChip } from '@/components/ui/IDChip'
import { CopyableAddressLink } from '@/components/ui/Links'
import type { AddressString } from '@/lib/schemas'
import { LevelName, type ValidatorDetails, ValidatorStatus } from '@/services/veworld-indexer/validator-details'
import { useVnsName } from '@/services/thor/vns'
import { getStargateLink } from '@/lib/constants/stargate-nft'
import { useSettingsStore } from '@/lib/stores/settings'
import { countdownTickMs, cycleEndsAtMs } from './cycle-countdown'

// Block time on VeChain is 10 seconds
const BLOCK_TIME_IN_SECONDS = 10

// NFT tier order for display
const NFT_TIER_ORDER: LevelName[] = [
  LevelName.DAWN,
  LevelName.LIGHTNING,
  LevelName.FLASH,
  LevelName.STRENGTH,
  LevelName.THUNDER,
  LevelName.MJOLNIR,
  LevelName.VE_THOR_X,
  LevelName.STRENGTH_X,
  LevelName.THUNDER_X,
  LevelName.MJOLNIR_X,
]

// Convert blocks to duration string
const blocksToSeconds = (blocks: number): number => blocks * BLOCK_TIME_IN_SECONDS

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0 days'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days >= 1) return `${days} day${days === 1 ? '' : 's'}`
  if (hours >= 1) return `${hours} hour${hours === 1 ? '' : 's'}`
  if (minutes >= 1) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  return `${seconds} second${seconds === 1 ? '' : 's'}`
}

// Drives the countdown now that nothing polls the chain for it, speeding up for the
// final minute the label counts out in seconds.
const useCountdownNow = (endsAt: number | null) => {
  const [now, setNow] = useState(() => Date.now())
  const tickMs = countdownTickMs(endsAt === null ? null : endsAt - now)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs)
    return () => clearInterval(id)
  }, [tickMs])

  return now
}

// Abbreviate large numbers (e.g., 1000000 -> "1M")
const abbreviateAmount = (amount: number, decimals = 1): string => {
  if (isNaN(amount) || amount === 0) return '0'

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount)
}

// Status badge configuration type
type StatusBadgeConfig = {
  bg: string
  color: string
  labelKey: 'Active' | 'In Queue' | 'Exiting' | 'Exited' | 'Inactive'
}

// Get status badge color
const getStatusBadgeProps = (status: ValidatorStatus): StatusBadgeConfig => {
  switch (status) {
    case ValidatorStatus.ACTIVE:
      return { bg: 'green.600', color: 'white', labelKey: 'Active' }
    case ValidatorStatus.QUEUED:
      return { bg: 'blue.600', color: 'white', labelKey: 'In Queue' }
    case ValidatorStatus.EXITING:
      return { bg: 'red.800', color: 'white', labelKey: 'Exiting' }
    case ValidatorStatus.EXITED:
      return { bg: 'gray.600', color: 'white', labelKey: 'Exited' }
    default:
      return { bg: 'gray.600', color: 'white', labelKey: 'Inactive' }
  }
}

// NFT Tier APY item component
interface NftTierApyItemProps {
  tier: string
  apy: string
}

const NftTierApyItem = ({ tier, apy }: NftTierApyItemProps) => (
  <HStack justify="space-between" bg="bg-alt-primary" px={3} py={2} borderRadius="md">
    <Text textStyle="bodyS" color="text-secondary">
      {tier}
    </Text>
    <Text textStyle="bodyS" color="text-primary" fontWeight="medium">
      {apy}
    </Text>
  </HStack>
)

export const ValidatorSummary = ({ address, validator }: { address: AddressString; validator: ValidatorDetails }) => {
  const { t } = useTranslation()
  const { data: vnsName } = useVnsName(address)
  const { activeNetwork } = useSettingsStore()
  const stargateValidatorLink = getStargateLink(activeNetwork.name, `/validator/${address}`)

  // The cycle end is a fixed moment, so it is projected once from the anchored block at the
  // chain's 10s cadence and then counted down locally, rather than re-read every block.
  const endsAt = cycleEndsAtMs(validator)
  const now = useCountdownNow(endsAt)

  const timeUntilNextCycle = useMemo(() => {
    if (endsAt === null) return '-'

    const remainingMs = endsAt - now
    return remainingMs <= 0 ? '-' : formatDuration(remainingMs)
  }, [endsAt, now])

  // Calculate cycle duration
  const cycleDuration = useMemo(() => {
    if (!validator || validator.cyclePeriodLength === 0) return '-'
    const timeMs = blocksToSeconds(validator.cyclePeriodLength) * 1000
    return formatDuration(timeMs)
  }, [validator])

  // Calculate stake percentages
  const stakePercentages = useMemo(() => {
    if (!validator || validator.vetStaked === 0) {
      return { validatorPercent: 0, delegatedPercent: 0 }
    }

    const total = validator.vetStaked
    const validatorPercent = (validator.validatorVetStaked / total) * 100
    const delegatedPercent = (validator.delegatorVetStaked / total) * 100

    return { validatorPercent, delegatedPercent }
  }, [validator])

  // NFT tier APYs — omit tiers the validator has no value for, matching Stargate's behavior
  const nftTierApys = useMemo(() => {
    if (!validator) return []

    return NFT_TIER_ORDER.flatMap(tier => {
      const value = validator.nftYieldsNextCycle[tier]
      return value === undefined ? [] : [{ tier, apy: `${abbreviateAmount(value)}%` }]
    })
  }, [validator])

  const statusBadge = getStatusBadgeProps(validator.status)
  const isActive = validator.status === ValidatorStatus.ACTIVE
  const isActiveOrPending = isActive || validator.status === ValidatorStatus.QUEUED

  // Stats cards for DataCardGroup
  const statsCards: DataCardGroupItem[] = useMemo(() => {
    const showNextCycleApy = isActiveOrPending && validator.nextCycleValidatorApy !== validator.validatorApy

    return [
      {
        title: t('Endorser'),
        children: <CopyableAddressLink truncate address={validator.endorser as AddressString} />,
      },
      {
        title: t('Beneficiary'),
        children: (
          <CopyableAddressLink truncate address={(validator.beneficiary ?? validator.endorser) as AddressString} />
        ),
      },
      {
        title: t('Reliability'),
        children: (
          <Text textStyle="bodyM" color="text-primary">
            {isActive ? `${validator.reliability.toFixed(0)}%` : '-'}
          </Text>
        ),
      },
      {
        title: t('Validator APY'),
        children: (
          <VStack gap={0} alignItems={{ base: 'flex-end', md: 'flex-start' }}>
            <Text textStyle="bodyM" color="text-primary">
              {isActiveOrPending ? `${abbreviateAmount(validator.validatorApy)}%` : '-'}
            </Text>
            {showNextCycleApy && (
              <HStack gap={1}>
                <Text
                  textStyle="bodyS"
                  color={validator.nextCycleValidatorApy > validator.validatorApy ? 'green.400' : 'red.400'}
                >
                  {abbreviateAmount(validator.nextCycleValidatorApy)}%
                </Text>
                <Text textStyle="bodyS" color="text-secondary">
                  {t('next cycle')}
                </Text>
              </HStack>
            )}
          </VStack>
        ),
      },
      {
        title: t('Cycle left'),
        children: (
          <Text textStyle="bodyM" color="text-primary">
            {isActive ? timeUntilNextCycle : '-'}
          </Text>
        ),
      },
      {
        title: t('Cycle duration'),
        children: (
          <Text textStyle="bodyM" color="text-primary">
            {cycleDuration}
          </Text>
        ),
      },
    ]
  }, [
    t,
    isActive,
    isActiveOrPending,
    validator.endorser,
    validator.beneficiary,
    validator.reliability,
    validator.validatorApy,
    validator.nextCycleValidatorApy,
    timeUntilNextCycle,
    cycleDuration,
  ])

  return (
    <Stack gap="8">
      <Card>
        <Flex>
          <HStack gap={3} alignItems="flex-start" flex={1} minW={0}>
            <VStack align="start" gap={2} flex={1} minW={0}>
              <Flex justifyContent="space-between" alignItems="flex-start" gap={4} w="full">
                <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap">
                  {t('Validator')}
                </Heading>
                <Badge
                  bg={statusBadge.bg}
                  color={statusBadge.color}
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  fontSize="xs"
                  flexShrink={0}
                >
                  {t(statusBadge.labelKey)}
                </Badge>
              </Flex>
              {validator.metadata?.name && (
                <Text
                  textStyle="bodyS"
                  color="text-secondary"
                  maxW="full"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {validator.metadata.name}
                </Text>
              )}
              <IDChip
                value={address}
                vnsName={vnsName}
                maxW="full"
                avatarSrc={validator.metadata?.logo}
                avatarAlt={validator.metadata?.name ?? 'Validator'}
                showPicasso
              />
              <Link
                href={stargateValidatorLink}
                target="_blank"
                rel="noopener noreferrer"
                color="accent-primary"
                textStyle="bodyS"
                display="flex"
                alignItems="center"
                gap={1}
                _hover={{ textDecoration: 'underline' }}
              >
                {t('View it on Stargate')}
                <LuExternalLink size={12} />
              </Link>
            </VStack>
          </HStack>
        </Flex>
        {(validator.metadata?.location || validator.metadata?.website) && (
          <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            <HStack gap={3}>
              <VStack align="start" gap={1}>
                {validator.metadata?.location && (
                  <HStack gap={1} color="text-secondary">
                    <LuMapPin size={14} />
                    <Text textStyle="bodyS">{validator.metadata.location}</Text>
                  </HStack>
                )}

                {validator.metadata?.website && (
                  <HStack gap={1}>
                    <LuGlobe size={14} color="var(--chakra-colors-text-secondary)" />
                    <Link
                      href={validator.metadata.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="text-link"
                      textStyle="bodyS"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {t('Visit website')}
                      <LuExternalLink size={12} />
                    </Link>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </HStack>
        )}

        {/* Description */}
        {validator.metadata?.desc && (
          <Text textStyle="bodyS" color="text-primary">
            {validator.metadata.desc}
          </Text>
        )}

        {/* Stats Grid */}
        <DataCardGroup items={statsCards} variant="outline" desktopColumns={3} desktopGap={3} />

        <Flex flexDirection={{ base: 'column', md: 'row' }} gap={4}>
          {/* APY Section */}
          {isActiveOrPending && (
            <Card variant="outline" gap={4} flex={1}>
              {/* Avg Delegator APY */}
              <VStack align="start" gap={1}>
                <Text textStyle="bodyS" color="text-secondary">
                  {t('Avg. Delegator APY')}
                </Text>
                <HStack gap={2}>
                  <Text textStyle="bodyM" color="text-primary" fontWeight="medium">
                    {abbreviateAmount(validator.delegatorApy)}%
                  </Text>
                  {validator.nextCycleDelegatorApy !== validator.delegatorApy && (
                    <HStack gap={1}>
                      <Text
                        textStyle="bodyS"
                        color={validator.nextCycleDelegatorApy > validator.delegatorApy ? 'green.400' : 'red.400'}
                      >
                        {abbreviateAmount(validator.nextCycleDelegatorApy)}%
                      </Text>
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('next cycle')}
                      </Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>

              {/* NFT Tier APYs */}
              <VStack align="start" gap={2} width="full">
                <Text textStyle="bodyS" color="text-secondary">
                  {t('NFT Tier Next Cycle APYs')}
                </Text>
                <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' }} gap={2} width="full">
                  {nftTierApys.map(({ tier, apy }) => (
                    <NftTierApyItem key={tier} tier={tier} apy={apy} />
                  ))}
                </Grid>
              </VStack>
            </Card>
          )}

          {/* Total Staked Section */}
          <Card variant="outline" gap={4} flex={1} height="fit-content">
            <VStack align="start" gap={1}>
              <Text textStyle="bodyS" color="text-secondary">
                {t('Total staked')}
              </Text>
              <HStack gap={2}>
                <Image src="/tokens/VET.svg" alt="VET" width={24} height={24} />
                <Text textStyle="displayXs" color="text-primary" fontWeight="bold">
                  {abbreviateAmount(validator.vetStaked)}
                </Text>
                <Text textStyle="bodyM" color="text-secondary">
                  VET
                </Text>
              </HStack>
            </VStack>

            {/* Progress Bar */}
            <Box width="full" height="12px" bg="bg-alt-primary" borderRadius="full" overflow="hidden">
              <Flex height="full">
                <Box
                  width={`${stakePercentages.validatorPercent}%`}
                  bg="purple.400"
                  height="full"
                  transition="width 0.3s ease"
                />
                <Box
                  width={`${stakePercentages.delegatedPercent}%`}
                  bg="purple.700"
                  height="full"
                  transition="width 0.3s ease"
                />
              </Flex>
            </Box>

            {/* Stake Breakdown */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <Box width="12px" height="12px" borderRadius="full" bg="purple.400" />
                  <Text textStyle="bodyS" color="text-secondary">
                    {t('Validator stake')}
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <Text textStyle="bodyM" color="text-primary" fontWeight="medium">
                    {abbreviateAmount(validator.validatorVetStaked)}
                  </Text>
                  <Text textStyle="bodyS" color="text-secondary">
                    VET
                  </Text>
                </HStack>
                <Text textStyle="bodyS" color="text-secondary">
                  {stakePercentages.validatorPercent.toFixed(1)}%
                </Text>
              </VStack>

              <VStack align="start" gap={1}>
                <HStack gap={2}>
                  <Box width="12px" height="12px" borderRadius="full" bg="purple.700" />
                  <Text textStyle="bodyS" color="text-secondary">
                    {t('Delegated Stake')}
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <Text textStyle="bodyM" color="text-primary" fontWeight="medium">
                    {abbreviateAmount(validator.delegatorVetStaked)}
                  </Text>
                  <Text textStyle="bodyS" color="text-secondary">
                    VET
                  </Text>
                </HStack>
                <Text textStyle="bodyS" color="text-secondary">
                  {stakePercentages.delegatedPercent.toFixed(1)}%
                </Text>
              </VStack>
            </Grid>
          </Card>
        </Flex>
      </Card>
    </Stack>
  )
}
