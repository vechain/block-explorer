'use client'

import { Skeleton, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import {
  AccountTimeFrame,
  useAccountTotals,
  useValidatorsCount,
  ValidatorStatus,
} from '@/services/veworld-indexer/hooks'
import { Surface } from './Surface'

const USERS_STAKING = 0 // TODO: Implement hook to fetch users staking count

export const GeneralInformationCard = () => {
  const { t } = useTranslation()
  const { data: accountTotalsData, isLoading: isLoadingAccounts } = useAccountTotals(AccountTimeFrame.ALL)
  const { data: validatorsCount, isLoading: isLoadingValidators } = useValidatorsCount(ValidatorStatus.ACTIVE)

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  const totalAccounts = accountTotalsData?.data?.[0]?.total ?? 0
  const validators = validatorsCount ?? 0

  return (
    <Surface width="208px" height="274px">
      <Stack gap={2} flex="1" justifyContent="space-between">
        <Stack>
          <Text textStyle="bodyM" color="text-secondary">
            {t('Total Accounts')}
          </Text>
          {isLoadingAccounts ? (
            <Skeleton height="24px" width="120px" />
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
          {isLoadingValidators ? (
            <Skeleton height="24px" width="120px" />
          ) : (
            <Text textStyle="displayS" color="text-primary">
              {formatNumber(validators)}
            </Text>
          )}
        </Stack>

        <Stack>
          <Text textStyle="bodyM" color="text-secondary">
            {t('Users Staking')}
          </Text>
          <Text textStyle="displayS" color="text-primary">
            {formatNumber(USERS_STAKING)}
          </Text>
        </Stack>
      </Stack>
    </Surface>
  )
}
