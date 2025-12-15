'use client'

import { Circle, Flex, HStack, Icon, Image, Skeleton, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { usePriceList } from '@/services/coin-api/hooks'

type SupportedTokenSymbol = 'VET' | 'VTHO' | 'B3TR'

const formatFiat = (price?: number) => {
  if (price === undefined) return '-'
  return `$${price.toFixed(4)}`
}

const formatChangePercent = (change?: number) => {
  if (change === undefined) return '-'
  return `${Math.abs(change).toFixed(2)}%`
}

const getDailyChangePercent = (prices?: { price: number }[]) => {
  if (!prices || prices.length < 2) return undefined
  const first = prices[0]?.price
  const last = prices[prices.length - 1]?.price
  if (!first || !last) return undefined

  return ((last - first) / first) * 100
}

export const PriceCards = () => {
  const { t } = useTranslation()
  const { data: priceList, isLoading: priceListLoading } = usePriceList()

  const { data: vetDailyPrices, isLoading: vetDailyLoading } = useTokenDailyPrices('vechain', 'usd')
  const { data: vthoDailyPrices, isLoading: vthoDailyLoading } = useTokenDailyPrices('vethor-token', 'usd')
  const { data: b3trDailyPrices, isLoading: b3trDailyLoading } = useTokenDailyPrices('vebetterdao', 'usd')

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
        changePercent={getDailyChangePercent(vetDailyPrices)}
        isLoading={priceListLoading || !priceList || vetDailyLoading}
      />
      <TokenPriceCard
        token="VTHO"
        label={t('VTHO Price')}
        price={priceList?.vtho.usd}
        changePercent={getDailyChangePercent(vthoDailyPrices)}
        isLoading={priceListLoading || !priceList || vthoDailyLoading}
      />
      <TokenPriceCard
        token="B3TR"
        label={t('B3TR Price')}
        price={priceList?.b3tr.usd}
        changePercent={getDailyChangePercent(b3trDailyPrices)}
        isLoading={priceListLoading || !priceList || b3trDailyLoading}
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
}

const TokenPriceCard = ({ token, label, price, changePercent, isLoading }: TokenPriceCardProps) => {
  return (
    <VStack
      alignItems="flex-start"
      flex={{ base: '0 0 auto', md: 1 }}
      flexShrink={0}
      minW={{ base: '75%', md: '0' }}
      bg="bg-card-surface-2"
      borderRadius="md"
      borderWidth="1px"
      borderColor="bg-card-surface-2"
      py={5}
      px={4}
      gap={6}
    >
      <Flex alignItems="center" justifyContent="space-between" gap={2}>
        <Circle bg="bg-card-surface-2" borderWidth="1px" borderColor="bg-card-surface-2" rounded="full">
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
            <Text
              textStyle="bodyS"
              color={changePercent >= 0 ? 'success-text' : 'error-text'}
              marginTop={-4}
              bg={changePercent >= 0 ? 'success-surface' : 'error-surface'}
              py={0.5}
              px={2}
              borderRadius="full"
            >
              <Icon as={changePercent >= 0 ? LuTrendingUp : LuTrendingDown} /> {formatChangePercent(changePercent)}
            </Text>
          )}
        </HStack>
      )}
    </VStack>
  )
}
