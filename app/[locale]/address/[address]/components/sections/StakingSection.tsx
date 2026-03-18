'use client'

import {
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Link,
  Portal,
  Skeleton,
  Stack,
  Text,
  VStack,
  useBreakpointValue,
} from '@chakra-ui/react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LuExternalLink, LuEye, LuX } from 'react-icons/lu'
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

  const [isVthoDetailsOpen, setIsVthoDetailsOpen] = useState(false)
  const isMobile = useBreakpointValue({ base: true, md: false })
  const vthoDetailItems = [
    {
      label: t('Block rewards'),
      amount: formattedVthoBlockRewards,
      fiatValue: fiatVthoBlockRewards,
    },
    {
      label: t('Passive generation'),
      amount: formattedVthoPassiveGeneration,
      fiatValue: fiatVthoPassiveGeneration,
    },
    {
      label: t('Claimed Stargate'),
      amount: formattedVthoClaimedStargate,
      fiatValue: fiatVthoClaimedStargate,
    },
  ]

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
            <Flex align="center" justify="space-between" gap={3} w="full">
              {isMobile && (
                <Text textStyle="bodyM" color="text-primary">
                  {t('VTHO Earned')}
                </Text>
              )}
              <HStack gap={2} ml="auto">
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
                <IconButton
                  aria-label={t('Details')}
                  title={t('Details')}
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVthoDetailsOpen(true)}
                >
                  <LuEye />
                </IconButton>
              </HStack>
            </Flex>
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

      <Dialog.Root open={isVthoDetailsOpen} onOpenChange={details => setIsVthoDetailsOpen(details.open)}>
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner alignItems={{ base: 'flex-end', md: 'center' }} px={{ base: 0, md: 4 }}>
            <Dialog.Content
              mb={{ base: 0, md: 'inherit' }}
              bg="bg-primary"
              backdropFilter="blur(32px)"
              borderTopLeftRadius={{ base: '2xl', md: 'xl' }}
              borderTopRightRadius={{ base: '2xl', md: 'xl' }}
              borderBottomLeftRadius={{ base: 0, md: 'xl' }}
              borderBottomRightRadius={{ base: 0, md: 'xl' }}
              borderWidth="1px"
              borderColor="border-primary"
              maxW={{ base: '100vw', md: '520px' }}
              w={{ base: '100vw', md: '90vw' }}
              maxH={{ base: '85vh', md: 'unset' }}
              overflow="hidden"
              p={0}
            >
              <Dialog.Header p={4} borderBottomWidth="1px" borderColor="border-primary">
                <Flex justify="space-between" align="center">
                  <Dialog.Title textStyle="bodyL" fontWeight="semibold">
                    {t('VTHO Earned')}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      minW="44px"
                      minH="44px"
                      p={1}
                      onClick={() => setIsVthoDetailsOpen(false)}
                    >
                      <LuX size={20} />
                    </Button>
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Header>

              <Dialog.Body p={4}>
                <Stack gap={4}>
                  <VStack gap={1} alignItems="flex-start">
                    <HStack gap={2}>
                      <Text textStyle="displayXs" color="text-primary">
                        {formattedTotalEarned}
                      </Text>
                      <Image src="/tokens/VTHO.svg" alt="VTHO" width={20} height={20} />
                    </HStack>
                    {isVthoPriceLoading ? (
                      <Skeleton height="20px" width="90px" />
                    ) : (
                      vthoFiatValue && (
                        <Text textStyle="bodyL" color="text-secondary">
                          {vthoFiatValue}
                        </Text>
                      )
                    )}
                  </VStack>

                  <Card variant="outline" gap={0}>
                    {vthoDetailItems.map((item, index) => {
                      const isLastItem = index === vthoDetailItems.length - 1

                      return (
                        <HStack
                          key={item.label}
                          justify="space-between"
                          width="full"
                          py={4}
                          borderBottomWidth={isLastItem ? '0' : '1px'}
                          borderColor="border-primary"
                        >
                          <Text textStyle="bodyM" color="text-secondary">
                            {item.label}
                          </Text>
                          <VStack gap={1} alignItems="flex-end">
                            <HStack gap={2}>
                              <Text textStyle="bodyM" color="text-primary">
                                {item.amount}
                              </Text>
                              <Image src="/tokens/VTHO.svg" alt="VTHO" width={16} height={16} />
                            </HStack>
                            {item.fiatValue && (
                              <Text textStyle="bodyS" color="text-secondary">
                                {item.fiatValue}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      )
                    })}
                  </Card>
                </Stack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  )
}
