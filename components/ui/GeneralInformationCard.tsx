'use client'

import { Skeleton, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import {
  AccountTimeFrame,
  useAccountTotals,
  useTotalVetStaked,
  useValidatorsCount,
  ValidatorStatus,
} from '@/services/veworld-indexer/hooks'
import { Card } from './Card'
import { useFormatNumber } from '@/hooks/useFormatting'

export const GeneralInformationCard = () => {
  const { t } = useTranslation()
  const formatNumber = useFormatNumber()
  const { data: accountTotalsData, isLoading: isLoadingAccounts } = useAccountTotals(AccountTimeFrame.ALL)
  const { data: activeValidatorsCount, isLoading: isLoadingActiveValidators } = useValidatorsCount(
    ValidatorStatus.ACTIVE,
  )
  const { data: exitingValidatorsCount, isLoading: isLoadingExitingValidators } = useValidatorsCount(
    ValidatorStatus.EXITING,
  )
  const { data: totalVetStakedData, isLoading: isLoadingTotalVetStaked } = useTotalVetStaked()
  const totalNftCount = totalVetStakedData?.totalNftCount ?? 0

  const totalAccounts = accountTotalsData?.data?.[0]?.total ?? 0
  const activeValidators = activeValidatorsCount ?? 0
  const exitingValidators = exitingValidatorsCount ?? 0
  const validators = activeValidators + exitingValidators

  return (
    <Card width={{ base: '100%', md: '208px' }}>
      <Stack gap={{ base: 8, md: 2 }} flex="1" justifyContent="space-between">
        <Stack>
          <Text textStyle="bodyM" color="text-secondary">
            {t('Total Accounts')}
          </Text>
          {isLoadingAccounts ? (
            <Skeleton height="24px" width="50px" />
          ) : (
            <Text textStyle="displayS" color="text-primary">
              {formatNumber(totalAccounts)}
            </Text>
          )}
        </Stack>

        <Stack>
          <Text textStyle="bodyM" color="text-secondary">
            {t('Validators')}
          </Text>
          {isLoadingActiveValidators || isLoadingExitingValidators ? (
            <Skeleton height="24px" width="50px" />
          ) : (
            <Text textStyle="displayS" color="text-primary">
              {formatNumber(validators)}
            </Text>
          )}
        </Stack>

        <Stack>
          <Text textStyle="bodyM" color="text-secondary">
            {t('Staking NFTs')}
          </Text>
          {isLoadingTotalVetStaked ? (
            <Skeleton height="24px" width="50px" />
          ) : (
            <Text textStyle="displayS" color="text-primary">
              {formatNumber(totalNftCount)}
            </Text>
          )}
        </Stack>
      </Stack>
    </Card>
  )
}
