'use client'

import { Circle, Flex, HStack, Icon, Image, Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { Card } from '@/components/ui/Card'
import { useFormatCompactCurrency, useFormatCurrency } from '@/hooks/useFormatting'

type SupportedTokenSymbol = 'VET' | 'VTHO' | 'B3TR'

const formatChangePercent = (change?: number) => {
  if (change === undefined) return '-'
  return `${Math.abs(change).toFixed(2)}%`
}

export const PriceCards = () => {
  const {
    dailyChangePercent: vetDailyChangePercent,
    isLoading: vetDailyLoading,
    price: vetPrice,
    marketCap: vetMarketCap,
  } = useTokenDailyPrices('vechain')
  const {
    dailyChangePercent: vthoDailyChangePercent,
    isLoading: vthoDailyLoading,
    price: vthoPrice,
    marketCap: vthoMarketCap,
  } = useTokenDailyPrices('vethor-token')
  const {
    dailyChangePercent: b3trDailyChangePercent,
    isLoading: b3trDailyLoading,
    price: b3trPrice,
    marketCap: b3trMarketCap,
  } = useTokenDailyPrices('vebetterdao')

  return (
    <Flex
      gap={4}
      flexDirection="row"
      flexWrap="nowrap"
      overflowX={{ base: 'auto', md: 'visible' }}
      mx={{ base: -4, md: 0 }}
      px={{ base: 4, md: 0 }}
      css={{
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <TokenPriceCard
        token="VET"
        label="VET"
        price={vetPrice}
        marketCap={vetMarketCap}
        changePercent={vetDailyChangePercent}
        isLoading={vetDailyLoading}
      />
      <TokenPriceCard
        token="VTHO"
        label="VTHO"
        price={vthoPrice}
        marketCap={vthoMarketCap}
        changePercent={vthoDailyChangePercent}
        isLoading={vthoDailyLoading}
      />
      <TokenPriceCard
        token="B3TR"
        label="B3TR"
        price={b3trPrice}
        marketCap={b3trMarketCap}
        changePercent={b3trDailyChangePercent}
        isLoading={b3trDailyLoading}
      />
    </Flex>
  )
}

interface TokenPriceCardProps {
  token: SupportedTokenSymbol
  label: string
  price?: number
  marketCap?: number
  changePercent?: number
  isLoading?: boolean
}

const TokenPriceCard = ({ token, label, price, marketCap, changePercent, isLoading }: TokenPriceCardProps) => {
  const { t } = useTranslation()
  const formattedPrice = useFormatCurrency()
  const formatCompact = useFormatCompactCurrency()

  return (
    <Card
      alignItems="flex-start"
      flex={{ base: '0 0 auto', md: 1 }}
      flexShrink={0}
      minW={{ base: 'auto', sm: '75%', md: '0' }}
      width={{ base: '70%', sm: 'auto' }}
      py={5}
      px={4}
      gap={4}
    >
      <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <Circle bg="bg-primary" borderWidth="1px" borderColor="border-primary" rounded="full">
          <Image src={`/tokens/${token}.svg`} alt={`${token} token`} width={6} height={6} rounded="full" />
        </Circle>
        <Text textStyle="bodyL">{label}</Text>
      </Flex>

      <HStack gap={2} alignItems="flex-start">
        <Text textStyle="bodyS" color="text-secondary">
          {t('Price')}:
        </Text>
        {isLoading ? (
          <Skeleton height="28px" width="80px" />
        ) : (
          <Text textStyle="displayXs">{formattedPrice(price ?? 0, { minimumFractionDigits: 4 })}</Text>
        )}
        {changePercent !== undefined && !isLoading && (
          <HStack
            textStyle="bodyS"
            color={changePercent >= 0 ? 'success-text' : 'error-text'}
            marginTop={-4}
            bg={changePercent >= 0 ? 'success-surface' : 'error-surface'}
            py={0.5}
            px={2}
            borderRadius="full"
          >
            <Icon as={changePercent >= 0 ? LuTrendingUp : LuTrendingDown} />
            <Text textStyle="bodyS">{formatChangePercent(changePercent)}</Text>
          </HStack>
        )}
      </HStack>

      <Flex gap={1} alignItems="baseline">
        <Text textStyle="bodyS" color="text-secondary">
          {t('Market Cap')}:
        </Text>
        {isLoading ? (
          <Skeleton height="16px" width="60px" />
        ) : (
          <Text textStyle="bodyS" color="text-primary">
            {marketCap !== undefined ? formatCompact(marketCap) : '-'}
          </Text>
        )}
      </Flex>
    </Card>
  )
}
