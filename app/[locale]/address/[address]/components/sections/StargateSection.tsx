'use client'

import { Heading, HStack, Skeleton, Stack, Text } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { useAccountStakedVet } from '@/services/thor/hooks'
import { useTotalVthoClaimed } from '@/services/veworld-indexer/hooks'
import { useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import type { AddressString } from '@/lib/schemas'

export const StargateSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const formatNumber = useFormatNumber()
  const { currency } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol

  const { data: stakedVet, isPending: isStakedVetPending } = useAccountStakedVet(address)
  const { data: totalEarned, isPending: isTotalEarnedPending } = useTotalVthoClaimed(address)
  const { price: vetPrice, isLoading: isVetPriceLoading } = useTokenDailyPrices('vechain')
  const { price: vthoPrice, isLoading: isVthoPriceLoading } = useTokenDailyPrices('vethor-token')

  const [formattedVetStaked, fullVetStaked] = formatAmount({ amount: stakedVet ?? 0n, decimals: 18 })
  const [formattedTotalEarned, fullTotalEarned] = formatAmount({ amount: totalEarned ?? 0n, decimals: 18 })

  const vetFiatValue = useMemo(() => {
    if (!vetPrice || !fullVetStaked) return null
    const value = Number(fullVetStaked) * vetPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vetPrice, fullVetStaked, currencySymbol, formatNumber])

  const vthoFiatValue = useMemo(() => {
    if (!vthoPrice || !fullTotalEarned) return null
    const value = Number(fullTotalEarned) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, fullTotalEarned, currencySymbol, formatNumber])

  const items: DataCardGroupItem[] = [
    {
      title: t('VET Staked'),
      children: (
        <Stack gap={0}>
          <HStack gap={2}>
            {isStakedVetPending ? (
              <Skeleton height="20px" width="100px" />
            ) : (
              <Text textStyle="bodyM" color="text-primary">
                {formattedVetStaked}
              </Text>
            )}
            <Image src="/tokens/vet.svg" alt="VET" width={16} height={16} />
          </HStack>
          {isVetPriceLoading ? (
            <Skeleton height="16px" width="60px" />
          ) : (
            vetFiatValue && (
              <Text textStyle="bodyS" color="text-secondary">
                {vetFiatValue}
              </Text>
            )
          )}
        </Stack>
      ),
    },
    {
      title: t('VTHO Earned'),
      children: (
        <Stack gap={0}>
          <HStack gap={2}>
            {isTotalEarnedPending ? (
              <Skeleton height="20px" width="100px" />
            ) : (
              <Text textStyle="bodyM" color="text-primary">
                {formattedTotalEarned}
              </Text>
            )}
            <Image src="/tokens/vtho.svg" alt="VTHO" width={16} height={16} />
          </HStack>
          {isVthoPriceLoading ? (
            <Skeleton height="16px" width="60px" />
          ) : (
            vthoFiatValue && (
              <Text textStyle="bodyS" color="text-secondary">
                {vthoFiatValue}
              </Text>
            )
          )}
        </Stack>
      ),
    },
  ]

  return (
    <Stack gap={4}>
      <Heading as="h3" textStyle="bodyL" color="text-primary">
        {t('Stargate')}
      </Heading>
      <DataCardGroup variant="outline" items={items} desktopColumns={2} />
    </Stack>
  )
}
