'use client'

import { Flex, Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { CURRENCIES } from '@/lib/constants/currencies'
import type { AddressString } from '@/lib/schemas'
import { useSettingsStore } from '@/lib/stores/settings'
import { useAccountOverview } from '@/services/veworld-indexer/account-overview'

const sectionTotalPaddingEnd = { base: 4, md: 5 }

export const EarnedRewardsSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const formatNumber = useFormatNumber()
  const { currency } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol

  const { data: accountOverview, isPending: isAccountOverviewPending } = useAccountOverview(address)
  const { price: vthoPrice, isLoading: isVthoPriceLoading } = useTokenDailyPrices('vethor-token')

  const vthoBlockRewards = accountOverview?.vthoBlockRewards ?? 0
  const [formattedVthoBlockRewards] = formatAmount({ amount: BigInt(vthoBlockRewards), decimals: 18 })
  const fiatVthoBlockRewards = useMemo(() => {
    if (!vthoPrice && vthoPrice !== 0) return null
    const value = Number(formatUnits(BigInt(vthoBlockRewards), 18)) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [currencySymbol, formatNumber, vthoBlockRewards, vthoPrice])

  const vthoPassiveGeneration = accountOverview?.vthoPassiveGeneration ?? 0
  const [formattedVthoPassiveGeneration] = formatAmount({ amount: BigInt(vthoPassiveGeneration), decimals: 18 })
  const fiatVthoPassiveGeneration = useMemo(() => {
    if (!vthoPrice && vthoPrice !== 0) return null
    const value = Number(formatUnits(BigInt(vthoPassiveGeneration), 18)) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [currencySymbol, formatNumber, vthoPassiveGeneration, vthoPrice])

  const vthoClaimedStargate = accountOverview?.vthoClaimedStargate ?? 0
  const [formattedVthoClaimedStargate] = formatAmount({ amount: BigInt(vthoClaimedStargate), decimals: 18 })
  const fiatVthoClaimedStargate = useMemo(() => {
    if (!vthoPrice && vthoPrice !== 0) return null
    const value = Number(formatUnits(BigInt(vthoClaimedStargate), 18)) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [currencySymbol, formatNumber, vthoClaimedStargate, vthoPrice])

  const vthoEarnedTotal = accountOverview?.vthoEarnedTotal ?? 0
  const [formattedTotalEarned, fullTotalEarned] = formatAmount({ amount: BigInt(vthoEarnedTotal), decimals: 18 })
  const totalEarnedFiatValue = useMemo(() => {
    if (!vthoPrice && vthoPrice !== 0) return null
    const value = Number(fullTotalEarned) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [currencySymbol, formatNumber, fullTotalEarned, vthoPrice])

  const rewardItems: DataCardGroupItem[] = useMemo(
    () =>
      [
        {
          amount: BigInt(vthoBlockRewards),
          title: t('Validator rewards'),
          formattedAmount: formattedVthoBlockRewards,
          fiatValue: fiatVthoBlockRewards,
        },
        {
          amount: BigInt(vthoClaimedStargate),
          title: t('Delegation rewards'),
          formattedAmount: formattedVthoClaimedStargate,
          fiatValue: fiatVthoClaimedStargate,
        },
        {
          amount: BigInt(vthoPassiveGeneration),
          title: t('Passive generation'),
          formattedAmount: formattedVthoPassiveGeneration,
          fiatValue: fiatVthoPassiveGeneration,
        },
      ]
        .filter(item => item.amount > 0n)
        .map(item => ({
          title: item.title,
          children: (
            <HStack gap={2} alignItems="flex-start">
              <Stack gap={0} alignItems="flex-end">
                <Text textStyle="bodyM" color="text-primary">
                  {item.formattedAmount}
                </Text>
                {item.fiatValue && (
                  <Text textStyle="bodyS" color="text-secondary">
                    {item.fiatValue}
                  </Text>
                )}
              </Stack>
              <Image src="/tokens/VTHO.svg" alt="VTHO" width={20} height={20} />
            </HStack>
          ),
        })),
    [
      fiatVthoBlockRewards,
      fiatVthoClaimedStargate,
      fiatVthoPassiveGeneration,
      formattedVthoBlockRewards,
      formattedVthoClaimedStargate,
      formattedVthoPassiveGeneration,
      t,
      vthoBlockRewards,
      vthoClaimedStargate,
      vthoPassiveGeneration,
    ],
  )

  if (!isAccountOverviewPending && rewardItems.length === 0) {
    return null
  }

  return (
    <Stack gap={4}>
      <Flex alignItems="flex-start" justifyContent="space-between" gap={4} flexWrap="wrap">
        <Heading as="h3" textStyle="bodyL" color="text-primary">
          {t('Earned Rewards')}
        </Heading>
        {isAccountOverviewPending ? (
          <Stack gap={1} alignItems="flex-end" pe={sectionTotalPaddingEnd}>
            <Skeleton height="20px" width="100px" />
            <Skeleton height="16px" width="60px" />
          </Stack>
        ) : (
          <HStack gap={2} alignItems="flex-start" pe={sectionTotalPaddingEnd}>
            <Stack gap={0} alignItems="flex-end">
              <Text textStyle="bodyM" color="text-primary">
                {formattedTotalEarned}
              </Text>
              {isVthoPriceLoading ? (
                <Skeleton height="16px" width="60px" />
              ) : (
                totalEarnedFiatValue && (
                  <Text textStyle="bodyS" color="text-secondary">
                    {totalEarnedFiatValue}
                  </Text>
                )
              )}
            </Stack>
            <Image src="/tokens/VTHO.svg" alt="VTHO" width={20} height={20} />
          </HStack>
        )}
      </Flex>

      {isAccountOverviewPending ? (
        <Skeleton height="120px" borderRadius="md" />
      ) : (
        <DataCardGroup singleCard variant="outline" items={rewardItems} />
      )}
    </Stack>
  )
}
