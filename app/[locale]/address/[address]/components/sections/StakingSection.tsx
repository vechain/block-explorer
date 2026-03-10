'use client'

import { Accordion, HStack, Link, Skeleton, Stack, Text, VStack, useBreakpointValue } from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LuExternalLink } from 'react-icons/lu'
import { useFormatAmount, useFormatNumber } from '@/hooks/useFormatting'

import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { DataCardGroup, type DataCardGroupItem } from '@/components/ui/DataCardGroup'
import { useAccountOverview } from '@/services/veworld-indexer/account-overview'
import { useAccountStakedVet } from '@/services/veworld-indexer/account-staked-vet'
import { useSettingsStore } from '@/lib/stores/settings'
import { CURRENCIES } from '@/lib/constants/currencies'
import type { AddressString } from '@/lib/schemas'
import { Card } from '@/components/ui/Card'
import { formatUnits } from 'viem'
import { getStargateLink } from '@/lib/constants/stargate-nft'

export const StakingSection = ({ address }: { address: AddressString }) => {
  const { t } = useTranslation()
  const formatAmount = useFormatAmount()
  const formatNumber = useFormatNumber()
  const { currency, activeNetwork } = useSettingsStore()
  const currencySymbol = CURRENCIES[currency].symbol
  const stargateLink = getStargateLink(activeNetwork.name)

  const { data: accountOverview, isPending: isAccountOverviewPending } = useAccountOverview(address)
  const { data: stakedVet, isPending: isStakedVetPending } = useAccountStakedVet(address)
  const { price: vetPrice, isLoading: isVetPriceLoading } = useTokenDailyPrices('vechain')
  const { price: vthoPrice, isLoading: isVthoPriceLoading } = useTokenDailyPrices('vethor-token')
  const [formattedVetStaked, fullVetStaked] = formatAmount({ amount: stakedVet ?? 0n, decimals: 18 })

  const vthoBlockRewards = accountOverview?.vthoBlockRewards ?? 0
  const [formattedVthoBlockRewards] = formatAmount({ amount: BigInt(vthoBlockRewards), decimals: 18 })
  const fiatVthoBlockRewards = useMemo(() => {
    if (!vthoPrice || !vthoBlockRewards) return null
    const value = Number(formatUnits(BigInt(vthoBlockRewards), 18)) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, vthoBlockRewards, currencySymbol, formatNumber])

  const vthoPassiveGeneration = accountOverview?.vthoPassiveGeneration ?? 0
  const [formattedVthoPassiveGeneration] = formatAmount({ amount: BigInt(vthoPassiveGeneration), decimals: 18 })
  const fiatVthoPassiveGeneration = useMemo(() => {
    if (!vthoPrice || !vthoPassiveGeneration) return null
    const value = Number(formatUnits(BigInt(vthoPassiveGeneration), 18)) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, vthoPassiveGeneration, currencySymbol, formatNumber])

  const vthoClaimedStargate = accountOverview?.vthoClaimedStargate ?? 0
  const [formattedVthoClaimedStargate] = formatAmount({ amount: BigInt(vthoClaimedStargate), decimals: 18 })
  const fiatVthoClaimedStargate = useMemo(() => {
    if (!vthoPrice || !vthoClaimedStargate) return null
    const value = Number(formatUnits(BigInt(vthoClaimedStargate), 18)) * vthoPrice
    return `${currencySymbol}${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [vthoPrice, vthoClaimedStargate, currencySymbol, formatNumber])

  const vthoEarnedTotal = accountOverview?.vthoEarnedTotal ?? 0
  const [formattedTotalEarned, fullTotalEarned] = formatAmount({ amount: BigInt(vthoEarnedTotal), decimals: 18 })

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
        <Link
          href={stargateLink}
          target="_blank"
          rel="noopener noreferrer"
          _hover={{ textDecoration: 'none', opacity: 0.8 }}
          _focus={{ outline: 'none', boxShadow: 'none' }}
          _focusVisible={{ outline: 'none', boxShadow: 'none' }}
        >
          <Stack gap={0} alignItems="flex-end">
            <HStack gap={2}>
              {isStakedVetPending ? (
                <Skeleton height="20px" width="100px" />
              ) : (
                <Text textStyle="bodyM" color="text-primary">
                  {formattedVetStaked}
                </Text>
              )}
              <Image src="/tokens/VET.svg" alt="VET" width={16} height={16} />
              <LuExternalLink size={12} color="var(--chakra-colors-text-secondary)" />
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
        </Link>
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
              <Accordion.Item value="vtho-earned" border="none" p="0" gap={4}>
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
                    <VStack gap={1} alignItems="flex-end">
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
                          <Text textStyle="bodyS" color="text-secondary" textAlign="right">
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
                    <Card variant="outline">
                      <HStack
                        justify="space-between"
                        width="full"
                        borderBottomWidth="1px"
                        borderColor="border-primary"
                        pb={2}
                      >
                        <Text textStyle="bodyS" color="text-secondary">
                          {t('Block rewards')}
                        </Text>
                        <VStack gap={2} alignItems="flex-end">
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
                      <HStack
                        justify="space-between"
                        width="full"
                        borderBottomWidth="1px"
                        borderColor="border-primary"
                        pb={2}
                      >
                        <Text textStyle="bodyS" color="text-secondary">
                          {t('Passive generation')}
                        </Text>
                        <VStack gap={2} alignItems="flex-end">
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
                        <VStack gap={2} alignItems="flex-end">
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
                    </Card>
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
