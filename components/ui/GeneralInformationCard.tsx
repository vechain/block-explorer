'use client'

import { Flex, Stack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

const TOTAL_ACCOUNTS = 9096697
const VALIDATORS = 101
const USERS_STAKING = 11773

export const GeneralInformationCard = () => {
  const { t } = useTranslation()

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

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
          <Text textStyle="displayS" color="text-primary">
            {formatNumber(TOTAL_ACCOUNTS)}
          </Text>
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
