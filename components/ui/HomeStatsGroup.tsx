'use client'

import { Grid, Skeleton, Text } from '@chakra-ui/react'
import { Card } from './Card'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { formatEther } from 'viem'
import { AccountTimeFrame, useAccountTotals } from '@/services/veworld-indexer/account-totals'
import { useTotalVetDelegated } from '@/services/veworld-indexer/total-vet-delegated'
import { useTotalVetStaked } from '@/services/veworld-indexer/total-vet-staked'
import { ValidatorStatus, useValidators, useValidatorsCount } from '@/services/veworld-indexer/validators'
import { useFormatNumber } from '@/hooks/useFormatting'
import { useSettingsStore } from '@/lib/stores/settings'
import { getStargateLink } from '@/lib/constants/stargate-nft'

const SCALING_FACTOR = 1200
const BASE_ISSUANCE = 64
const ISSUANCE_COEFFICIENT = SCALING_FACTOR * BASE_ISSUANCE

export const HomeStatsGroup = () => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const { activeNetwork } = useSettingsStore()
  const STARGATE_LINK = getStargateLink(activeNetwork.name, '/market')

  // General Information logic
  const { data: accountTotalsData, isLoading: isLoadingAccounts } = useAccountTotals(AccountTimeFrame.ALL)
  const { data: activeValidatorsCount, isLoading: isLoadingActiveValidators } = useValidatorsCount({
    status: ValidatorStatus.ACTIVE,
  })
  const { data: exitingValidatorsCount, isLoading: isLoadingExitingValidators } = useValidatorsCount({
    status: ValidatorStatus.EXITING,
  })

  const totalAccounts = accountTotalsData?.data?.[0]?.total ?? 0
  const activeValidators = activeValidatorsCount ?? 0
  const exitingValidators = exitingValidatorsCount ?? 0
  const validators = activeValidators + exitingValidators

  // Stargate Market Stats logic
  const { data: validatorsList, isLoading: isLoadingValidators } = useValidators()
  const { data: totalVetStakedData, isLoading: isLoadingTotalVetStaked } = useTotalVetStaked()
  const { data: totalVetDelegatedData, isLoading: isLoadingTotalVetDelegated } = useTotalVetDelegated()

  const totalValidatorStake = useMemo(() => {
    const list = validatorsList ?? []
    return list
      .filter(v => v.status === ValidatorStatus.ACTIVE || v.status === ValidatorStatus.EXITING)
      .reduce((acc, v) => acc + (v.validatorVetStaked ?? 0), 0)
  }, [validatorsList])

  const totalDelegatorStakedVet = useMemo(() => {
    try {
      return Number(formatEther(totalVetStakedData?.total ?? 0n))
    } catch {
      return 0
    }
  }, [totalVetStakedData?.total])

  const totalDelegatedVet = useMemo(() => {
    try {
      return Number(formatEther(totalVetDelegatedData?.total ?? 0n))
    } catch {
      return 0
    }
  }, [totalVetDelegatedData?.total])

  const totalTvl = totalValidatorStake + totalDelegatorStakedVet
  const activeStake = totalValidatorStake + totalDelegatedVet
  const vthoIssuance = ISSUANCE_COEFFICIENT * Math.sqrt(activeStake)

  const tvlLoading = isLoadingValidators || isLoadingTotalVetStaked
  const vthoIssuanceLoading = isLoadingValidators || isLoadingTotalVetDelegated

  const compact = useMemo(
    () => ({ notation: 'compact', maximumFractionDigits: 1 }) satisfies Intl.NumberFormatOptions,
    [],
  )

  const stats = [
    {
      title: t('Total Accounts'),
      loading: isLoadingAccounts,
      value: formatNumber(totalAccounts),
      href: STARGATE_LINK,
    },
    {
      title: t('Validators'),
      loading: isLoadingActiveValidators || isLoadingExitingValidators,
      value: formatNumber(validators),
      href: STARGATE_LINK,
    },
    {
      title: t('Total Value Locked'),
      loading: tvlLoading,
      value: <>{formatNumber(totalTvl, compact)} VET</>,
      href: STARGATE_LINK,
    },
    {
      title: t('VTHO Issuance'),
      loading: vthoIssuanceLoading,
      value: <>{formatNumber(vthoIssuance, compact)} VTHO</>,
      href: STARGATE_LINK,
    },
  ]

  return (
    <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
      {stats.map((stat, index) => (
        <Card
          key={index}
          asChild
          alignItems="flex-start"
          justifyContent="center"
          py={5}
          px={4}
          gap={1}
          cursor="pointer"
          _hover={{ borderColor: 'border-hover', transform: 'scale(1.02)' }}
          transition="border-color 0.2s, transform 0.2s"
        >
          <a href={stat.href} target="_blank" rel="noopener noreferrer">
            <Text textStyle="bodyM" color="text-secondary">
              {stat.title}
            </Text>
            {stat.loading ? (
              <Skeleton height="24px" width="70px" />
            ) : (
              <Text textStyle={{ base: 'display2Xs', md: 'displayXs' }} color="text-primary">
                {stat.value}
              </Text>
            )}
          </a>
        </Card>
      ))}
    </Grid>
  )
}
