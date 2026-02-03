'use client'

import { Accordion, HStack, Skeleton, Stack, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { useAccountOverview, useAccountStakedVet } from '@/services/veworld-indexer/hooks'
import { useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import type { AddressString } from '@/lib/schemas'

export const StargateSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const formatNumber = useFormatNumber()
  const { currency } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol

  const { data: accountOverview, isPending: isAccountOverviewPending } = useAccountOverview(address)
  const { data: stakedVet, isPending: isStakedVetPending } = useAccountStakedVet(address)
  const { price: vetPrice, isLoading: isVetPriceLoading } = useTokenDailyPrices('vechain')
  const { price: vthoPrice, isLoading: isVthoPriceLoading } = useTokenDailyPrices('vethor-token')

  const [formattedVetStaked, fullVetStaked] = formatAmount({ amount: stakedVet ?? 0n, decimals: 18 })
  const [formattedVthoBlockRewards] = formatAmount({
    amount: BigInt(accountOverview?.vthoBlockRewards ?? 0),
    decimals: 18,
  })
  const fiatVthoBlockRewards = useMemo(() => {
    if (!vthoPrice || !formattedVthoBlockRewards) return null
    const value = Number(formattedVthoBlockRewards) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, formattedVthoBlockRewards, currencySymbol, formatNumber])

  const [formattedVthoPassiveGeneration] = formatAmount({
    amount: BigInt(accountOverview?.vthoPassiveGeneration ?? 0),
    decimals: 18,
  })
  const fiatVthoPassiveGeneration = useMemo(() => {
    if (!vthoPrice || !formattedVthoPassiveGeneration) return null
    const value = Number(formattedVthoPassiveGeneration) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, formattedVthoPassiveGeneration, currencySymbol, formatNumber])

  const [formattedVthoClaimedStargate] = formatAmount({
    amount: BigInt(accountOverview?.vthoClaimedStargate ?? 0),
    decimals: 18,
  })
  const fiatVthoClaimedStargate = useMemo(() => {
    if (!vthoPrice || !formattedVthoClaimedStargate) return null
    const value = Number(formattedVthoClaimedStargate) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, formattedVthoClaimedStargate, currencySymbol, formatNumber])

  const [formattedTotalEarned, fullTotalEarned] = formatAmount({
    amount: BigInt(accountOverview?.vthoEarnedTotal ?? 0),
    decimals: 18,
  })

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

  const isMobile = useBreakpointValue({ base: true, md: false })

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
            <Image src="/tokens/VET.svg" alt="VET" width={16} height={16} />
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
      hiddenTitle: isMobile,
      childrenContainerProps: {
        w: 'full',
      },
      children: (
        <Stack gap={0} w="full">
          {isAccountOverviewPending ? (
            <HStack gap={2}>
              <Skeleton height="20px" width="100px" />
              <Image src="/tokens/VTHO.svg" alt="VTHO" width={16} height={16} />
            </HStack>
          ) : (
            <Accordion.Root collapsible>
              <Accordion.Item value="vtho-earned" border="none" p="0">
                <Accordion.ItemTrigger p="0" justifyContent="space-between" cursor="pointer">
                  {isMobile && (
                    <Text textStyle="bodyM" color="text-primary">
                      {t('VTHO Earned')}
                    </Text>
                  )}
                  <HStack
                    gap={2}
                    justifyContent={{ base: 'flex-end', md: 'space-between' }}
                    w={{ base: 'auto', md: 'full' }}
                  >
                    <VStack gap={2}>
                      <HStack gap={2}>
                        <Text textStyle="bodyM" color="text-primary">
                          {formattedTotalEarned}
                        </Text>
                        <Image src="/tokens/VTHO.svg" alt="VTHO" width={16} height={16} />
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
                    </VStack>
                    <Accordion.ItemIndicator _icon={{ width: '16px', height: '16px', color: 'text-secondary' }} />
                  </HStack>
                </Accordion.ItemTrigger>

                <Accordion.ItemContent rounded={'none'}>
                  <Accordion.ItemBody pt={2} pb={0} px={0} display="flex" flexDirection="column" gap={4}>
                    <HStack justify="space-between" width="full">
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('Block rewards')}
                      </Text>
                      <VStack gap={2}>
                        <HStack gap={2}>
                          <Text textStyle="bodyS" color="text-primary">
                            {formattedVthoBlockRewards}
                          </Text>
                          <Image src="/tokens/VTHO.svg" alt="VTHO" width={16} height={16} />
                        </HStack>
                        {fiatVthoBlockRewards && (
                          <Text textStyle="bodyS" color="text-secondary">
                            {fiatVthoBlockRewards}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <HStack justify="space-between" width="full">
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('Passive generation')}
                      </Text>
                      <VStack gap={2}>
                        <HStack gap={2}>
                          <Text textStyle="bodyS" color="text-primary">
                            {formattedVthoPassiveGeneration}
                          </Text>
                          <Image src="/tokens/VTHO.svg" alt="VTHO" width={16} height={16} />
                        </HStack>
                        {fiatVthoPassiveGeneration && (
                          <Text textStyle="bodyS" color="text-secondary">
                            {fiatVthoPassiveGeneration}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <HStack justify="space-between" width="full">
                      <Text textStyle="bodyS" color="text-secondary">
                        {t('Claimed Stargate')}
                      </Text>
                      <VStack gap={2}>
                        <HStack gap={2}>
                          <Text textStyle="bodyS" color="text-primary">
                            {formattedVthoClaimedStargate}
                          </Text>
                          <Image src="/tokens/VTHO.svg" alt="VTHO" width={16} height={16} />
                        </HStack>
                        {fiatVthoClaimedStargate && (
                          <Text textStyle="bodyS" color="text-secondary">
                            {fiatVthoClaimedStargate}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          )}
        </Stack>
      ),
    },
  ]

  return (
    <Stack gap={4}>
      <DataCardGroup
        variant="outline"
        items={items}
        desktopColumns={2}
        mobileCardProps={{ w: 'full' }}
        desktopContainerProps={{ w: 'full' }}
      />
    </Stack>
  )
}
