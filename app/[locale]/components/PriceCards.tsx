'use client'

import { Circle, Flex, HStack, Icon, Image, Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu'
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { usePriceList } from '@/services/coin-api/hooks'
import { Card } from '@/components/ui/Card'

type SupportedTokenSymbol = 'VET' | 'VTHO' | 'B3TR'

const formatChangePercent = (change?: number) => {
  if (change === undefined) return '-'
  return `${Math.abs(change).toFixed(2)}%`
}

export const PriceCards = () => {
  const { t } = useTranslation()
  const { data: priceList, isLoading: priceListLoading } = usePriceList()
  const { formatFiat } = useCurrencyConversion()

  const { dailyChangePercent: vetDailyChangePercent, isLoading: vetDailyLoading } = useTokenDailyPrices(
    'vechain',
    'usd',
  )
  const { dailyChangePercent: vthoDailyChangePercent, isLoading: vthoDailyLoading } = useTokenDailyPrices(
    'vethor-token',
    'usd',
  )
  const { dailyChangePercent: b3trDailyChangePercent, isLoading: b3trDailyLoading } = useTokenDailyPrices(
    'vebetterdao',
    'usd',
  )

  return (
    <Flex
      gap={4}
      overflowX={{ base: 'auto', md: 'visible' }}
      flexWrap={{ base: 'nowrap', md: 'nowrap' }}
      pb={{ base: 2, md: 0 }}
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
        label={t('VET Price')}
        price={priceList?.vet.usd}
        changePercent={vetDailyChangePercent}
        isLoading={priceListLoading || !priceList || vetDailyLoading}
        formatFiat={formatFiat}
      />
      <TokenPriceCard
        token="VTHO"
        label={t('VTHO Price')}
        price={priceList?.vtho.usd}
        changePercent={vthoDailyChangePercent}
        isLoading={priceListLoading || !priceList || vthoDailyLoading}
        formatFiat={formatFiat}
      />
      <TokenPriceCard
        token="B3TR"
        label={t('B3TR Price')}
        price={priceList?.b3tr.usd}
        changePercent={b3trDailyChangePercent}
        isLoading={priceListLoading || !priceList || b3trDailyLoading}
        formatFiat={formatFiat}
      />
    </Flex>
  )
}

interface TokenPriceCardProps {
  token: SupportedTokenSymbol
  label: string
  price?: number
  changePercent?: number
  isLoading?: boolean
  formatFiat: (usd?: number, decimals?: number) => string
}

const TokenPriceCard = ({ token, label, price, changePercent, isLoading, formatFiat }: TokenPriceCardProps) => {
  return (
    <Card
      alignItems="flex-start"
      flex={{ base: '0 0 auto', md: 1 }}
      flexShrink={0}
      minW={{ base: '75%', md: '0' }}
      py={5}
      px={4}
      gap={6}
    >
      <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <Circle bg="bg-primary" borderWidth="1px" borderColor="border-primary" rounded="full">
          <Image src={`/tokens/${token}.svg`} alt={`${token} token`} width={6} height={6} rounded="full" />
        </Circle>
        <Text textStyle="bodyL">{label}</Text>
      </Flex>
      {isLoading ? (
        <Skeleton height="28px" width="80px" />
      ) : (
        <HStack gap={2} alignItems="flex-start">
          <Text textStyle="displayXs">{formatFiat(price)}</Text>
          {changePercent !== undefined && (
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
      )}
    </Card>
  )
}
