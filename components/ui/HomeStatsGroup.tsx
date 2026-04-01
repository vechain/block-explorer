'use client'

import { Box, Grid, Skeleton, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatEther } from 'viem'
import { getStargateLink } from '@/lib/constants/stargate-nft'
import { useSettingsStore } from '@/lib/stores/settings'
import { useAccountTotal } from '@/services/veworld-indexer/account-totals'
import { useTotalTransactions } from '@/services/veworld-indexer/total-transactions'
import { useTotalVetStaked } from '@/services/veworld-indexer/total-vet-staked'
import { ValidatorStatus, useValidators, useValidatorsCount } from '@/services/veworld-indexer/validators'
import { FiArrowUpRight } from 'react-icons/fi'
import { Card } from './Card'
import { MotionText } from './MotionText'
import { useFormatNumber } from '@/hooks/useFormatting'

type Stat = {
  title: string
  loading: boolean
  value: React.ReactNode
  href: string
  external: boolean
  animate?: boolean
  animationKey?: string | number
}

export const HomeStatsGroup = () => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()

  const { activeNetwork } = useSettingsStore()
  const STARGATE_LINK = getStargateLink(activeNetwork.name, '/market')
  const STATS_PAGE_HREF = '/stats'

  const { data: totalAccounts, isLoading: isLoadingAccounts } = useAccountTotal()
  const { data: totalTransactions, isLoading: isLoadingTransactions } = useTotalTransactions()
  const { data: activeValidatorsCount, isLoading: isLoadingActiveValidators } = useValidatorsCount({
    status: ValidatorStatus.ACTIVE,
  })
  const { data: exitingValidatorsCount, isLoading: isLoadingExitingValidators } = useValidatorsCount({
    status: ValidatorStatus.EXITING,
  })

  const accounts = totalAccounts ?? 0
  const activeValidators = activeValidatorsCount ?? 0
  const exitingValidators = exitingValidatorsCount ?? 0
  const validators = activeValidators + exitingValidators

  const { data: validatorsList, isLoading: isLoadingValidators } = useValidators()
  const { data: totalVetStakedData, isLoading: isLoadingTotalVetStaked } = useTotalVetStaked()

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

  const totalTvl = totalValidatorStake + totalDelegatorStakedVet

  const tvlLoading = isLoadingValidators || isLoadingTotalVetStaked

  const compact = useMemo(
    () => ({ notation: 'compact', maximumFractionDigits: 1 }) satisfies Intl.NumberFormatOptions,
    [],
  )

  const stats: Stat[] = [
    {
      title: t('Total Accounts'),
      loading: isLoadingAccounts,
      value: formatNumber(accounts),
      href: STATS_PAGE_HREF,
      external: false,
      animate: true,
      animationKey: accounts,
    },
    {
      title: t('Total Transactions'),
      loading: isLoadingTransactions,
      value: formatNumber(totalTransactions ?? 0),
      href: STATS_PAGE_HREF,
      external: false,
      animate: true,
      animationKey: totalTransactions ?? 0,
    },
    {
      title: t('Validators'),
      loading: isLoadingActiveValidators || isLoadingExitingValidators,
      value: formatNumber(validators),
      href: STARGATE_LINK,
      external: true,
    },
    {
      title: t('Total Value Locked'),
      loading: tvlLoading,
      value: <>{formatNumber(totalTvl, compact)} VET</>,
      href: STARGATE_LINK,
      external: true,
    },
  ]

  return (
    <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }} gap={4}>
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
          {stat.external ? (
            <a href={stat.href} target="_blank" rel="noopener noreferrer">
              <Box position="absolute" top={3} right={3} color="text-secondary">
                <FiArrowUpRight size={14} />
              </Box>
              <Text textStyle="bodyM" color="text-secondary">
                {stat.title}
              </Text>
              {stat.loading ? <Skeleton height="24px" width="70px" /> : <StatValue stat={stat} />}
            </a>
          ) : (
            <Link href={stat.href}>
              <Box position="absolute" top={3} right={3} color="text-secondary">
                <FiArrowUpRight size={14} />
              </Box>
              <Text textStyle="bodyM" color="text-secondary">
                {stat.title}
              </Text>
              {stat.loading ? <Skeleton height="24px" width="70px" /> : <StatValue stat={stat} />}
            </Link>
          )}
        </Card>
      ))}
    </Grid>
  )
}

const StatValue = ({ stat }: { stat: Pick<Stat, 'value' | 'animate' | 'animationKey'> }) => {
  if (!stat.animate) {
    return (
      <Text textStyle={{ base: 'display2Xs', md: 'displayXs' }} color="text-primary">
        {stat.value}
      </Text>
    )
  }

  return (
    <MotionText
      key={stat.animationKey}
      textStyle={{ base: 'display2Xs', md: 'displayXs' }}
      color="text-primary"
      display="inline-block"
      transformOrigin="left center"
      initial={{ scale: 1 }}
      animate={{
        scale: [1, 1.1, 1],
        filter: ['brightness(1)', 'brightness(1.65)', 'brightness(1.2)', 'brightness(1)'],
        textShadow: [
          '0 0 0px rgba(231,130,255,0), 0 0 0px rgba(231,130,255,0)',
          '0 0 22px rgba(231,130,255,0.42), 0 0 6px rgba(231,130,255,0.34)',
          '0 0 12px rgba(231,130,255,0.22), 0 0 4px rgba(231,130,255,0.18)',
          '0 0 0px rgba(231,130,255,0), 0 0 0px rgba(231,130,255,0)',
        ],
      }}
      transition={{ duration: 1, times: [0, 0.3, 0.72, 1], ease: 'easeInOut' }}
    >
      {stat.value}
    </MotionText>
  )
}
