'use client'

import { Flex, Heading, HStack, Link, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'
import { IDChip } from '@/components/ui/IDChip'
import { Card } from '@/components/ui/Card'
import { CURRENCIES } from '@/lib/constants/currencies'
import { getStargateLink } from '@/lib/constants/stargate-nft'
import { useSettingsStore } from '@/lib/stores/settings'
import { getTokenIconPath } from '@/lib/utils/tokens'
import type { AddressString } from '@/lib/schemas'
import { useAccountTokens } from '@/hooks/useAccountTokens'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { useAccountStakedVet } from '@/services/veworld-indexer/account-staked-vet'
import { useVnsName } from '@/services/thor/vns'
import { EarnedRewardsSection } from './sections/EarnedRewardsSection'
import { TokensSection } from './sections/TokensSection'

export const AccountSummary = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const formatNumber = useFormatNumber()
  const { data: vnsName } = useVnsName(address)
  const { currency, activeNetwork } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol
  const stargateLink = getStargateLink(activeNetwork.name)
  const vetIconPath = getTokenIconPath('VET')
  const {
    tokenBalanceRows,
    tokenValueRows,
    totalValue,
    totalValueNumber,
    isPendingAll: isPendingAllTokens,
  } = useAccountTokens(address)
  const {
    data: stakedVet,
    delegationStake,
    validatorStake,
    isPending: isStakedVetPending,
  } = useAccountStakedVet(address)
  const { price: vetPrice, isLoading: isVetPriceLoading } = useTokenDailyPrices('vechain')
  const [, fullVetStaked] = formatAmount({ amount: stakedVet, decimals: 18 })
  const [formattedValidatorStake, fullValidatorStake] = formatAmount({ amount: validatorStake, decimals: 18 })
  const [formattedDelegationStake, fullDelegationStake] = formatAmount({ amount: delegationStake, decimals: 18 })

  const vetStakedValueNumber = useMemo(() => {
    if (isStakedVetPending || vetPrice === undefined || !fullVetStaked) return null
    return Number(fullVetStaked) * vetPrice
  }, [fullVetStaked, isStakedVetPending, vetPrice])

  const validatorStakeValueNumber = useMemo(() => {
    if (isStakedVetPending || vetPrice === undefined || !fullValidatorStake) return null
    return Number(fullValidatorStake) * vetPrice
  }, [fullValidatorStake, isStakedVetPending, vetPrice])

  const delegationStakeValueNumber = useMemo(() => {
    if (isStakedVetPending || vetPrice === undefined || !fullDelegationStake) return null
    return Number(fullDelegationStake) * vetPrice
  }, [fullDelegationStake, isStakedVetPending, vetPrice])

  const validatorStakeFiatValue = useMemo(() => {
    if (validatorStakeValueNumber === null) return null
    return `${currencySymbol}${formatNumber(validatorStakeValueNumber, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }, [currencySymbol, formatNumber, validatorStakeValueNumber])

  const delegationStakeFiatValue = useMemo(() => {
    if (delegationStakeValueNumber === null) return null
    return `${currencySymbol}${formatNumber(delegationStakeValueNumber, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }, [currencySymbol, formatNumber, delegationStakeValueNumber])

  const displayTotalValue = useMemo(() => {
    if (totalValueNumber === null || vetStakedValueNumber === null) {
      return totalValue
    }

    return `${currencySymbol}${formatNumber(totalValueNumber + vetStakedValueNumber, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }, [currencySymbol, formatNumber, totalValue, totalValueNumber, vetStakedValueNumber])

  const isTotalValuePending = isPendingAllTokens || isStakedVetPending || isVetPriceLoading

  const createStargateLinkedTitle = (
    translationKey: 'Validator stake on Stargate' | 'Delegation stake on Stargate',
  ) => {
    return (
      <Trans
        i18nKey={translationKey}
        components={{
          stargate: (
            <Link
              href={stargateLink}
              target="_blank"
              rel="noopener noreferrer"
              color="text-link"
              textDecoration="underline"
              textUnderlineOffset="2px"
              _hover={{ opacity: 0.8 }}
              _focus={{ outline: 'none', boxShadow: 'none' }}
              _focusVisible={{ outline: 'none', boxShadow: 'none' }}
            />
          ),
        }}
      />
    )
  }

  const stargateStakeItems = [
    {
      amount: validatorStake,
      title: createStargateLinkedTitle('Validator stake on Stargate'),
      formattedAmount: formattedValidatorStake,
      fiatValue: validatorStakeFiatValue,
    },
    {
      amount: delegationStake,
      title: createStargateLinkedTitle('Delegation stake on Stargate'),
      formattedAmount: formattedDelegationStake,
      fiatValue: delegationStakeFiatValue,
    },
  ]

  const visibleStargateStakeItems = isStakedVetPending
    ? stargateStakeItems
    : stargateStakeItems.filter(item => item.amount > 0n)

  const prependItems: DataCardGroupItem[] = visibleStargateStakeItems.map(item => ({
    title: item.title,
    children: (
      <HStack gap={2} alignItems="flex-start">
        <Stack gap={0} alignItems="flex-end">
          {isStakedVetPending ? (
            <Skeleton height="20px" width="100px" />
          ) : (
            <Text textStyle="bodyM" color="text-primary">
              {item.formattedAmount}
            </Text>
          )}
          {isStakedVetPending || isVetPriceLoading ? (
            <Skeleton height="16px" width="60px" />
          ) : (
            item.fiatValue && (
              <Text textStyle="bodyS" color="text-secondary">
                {item.fiatValue}
              </Text>
            )
          )}
        </Stack>
        {vetIconPath && <Image src={vetIconPath} alt="VET" width={20} height={20} />}
      </HStack>
    ),
  }))

  return (
    <Stack gap="8">
      <Card>
        <Flex alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Heading as="h2" textStyle="displayXs" whiteSpace="nowrap" mb={{ base: '6', md: '0' }}>
            {t('Account')}
          </Heading>
          <IDChip value={address} vnsName={vnsName} />
        </Flex>

        <TokensSection
          tokenBalanceRows={tokenBalanceRows}
          tokenValueRows={tokenValueRows}
          totalValue={displayTotalValue}
          isPending={isPendingAllTokens}
          isTotalValuePending={isTotalValuePending}
          prependItems={prependItems}
        />

        <EarnedRewardsSection address={address} />
      </Card>
    </Stack>
  )
}
