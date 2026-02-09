'use client'

import { Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { formatEther } from 'viem'
import {
  AccountTimeFrame,
  useAccountTotals,
  useValidatorsCount,
  ValidatorStatus,
  useTotalVetDelegated,
  useTotalVetStaked,
  useValidators,
} from '@/services/veworld-indexer/hooks'
import { useFormatNumber } from '@/hooks/useFormatting'
import { DataCardGroup, type DataCardGroupItem } from './DataCardGroup'
import { BaseLink } from './Links'
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
      .reduce((acc, v) => acc + v.validatorVetStaked, 0)
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

  const items: DataCardGroupItem[] = [
    {
      title: t('Total Accounts'),
      children: isLoadingAccounts ? (
        <Skeleton height="24px" width="50px" />
      ) : (
        <Text textStyle={{ base: 'display2Xs', md: 'displayS' }} color="text-primary">
          {formatNumber(totalAccounts)}
        </Text>
      ),
    },
    {
      title: t('Validators'),
      children:
        isLoadingActiveValidators || isLoadingExitingValidators ? (
          <Skeleton height="24px" width="50px" />
        ) : (
          <Text textStyle={{ base: 'display2Xs', md: 'displayS' }} color="text-primary">
            <BaseLink href={STARGATE_LINK} target="_blank">
              {' '}
              {formatNumber(validators)}{' '}
            </BaseLink>
          </Text>
        ),
    },
    {
      title: t('Total Value Locked'),
      children: tvlLoading ? (
        <Skeleton height="24px" width="90px" />
      ) : (
        <Text textStyle={{ base: 'display2Xs', md: 'displayS' }} color="text-primary">
          <BaseLink href={STARGATE_LINK} target="_blank">
            {' '}
            {formatNumber(totalTvl, compact)} VET{' '}
          </BaseLink>
        </Text>
      ),
    },
    {
      title: t('VTHO Issuance'),
      children: vthoIssuanceLoading ? (
        <Skeleton height="24px" width="90px" />
      ) : (
        <Text textStyle={{ base: 'display2Xs', md: 'displayS' }} color="text-primary">
          {formatNumber(vthoIssuance, compact)} VTHO
        </Text>
      ),
    },
  ]

  return <DataCardGroup items={items} desktopColumns={2} variant="primary" />
}
