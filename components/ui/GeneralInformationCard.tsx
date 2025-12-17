'use client'

import { Flex, Skeleton, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { AccountTimeFrame, useAccountTotals } from '@/services/veworld-indexer/hooks'

const VALIDATORS = 101
const USERS_STAKING = 11773

export const GeneralInformationCard = () => {
  const { t } = useTranslation()
  const { data: accountTotalsData, isLoading: isLoadingAccounts } = useAccountTotals(AccountTimeFrame.ALL)

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  const totalAccounts = accountTotalsData?.data?.[0]?.total ?? 0

  return (
    <Flex
      flexDirection="column"
      width="208px"
      height="274px"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border-surface"
      bg="bg-card-surface"
      backdropFilter="blur(32px)"
      p={5}
    >
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
          <Text textStyle="displayS" color="text-primary">
            {formatNumber(VALIDATORS)}
          </Text>
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
    </Flex>
  )
}
