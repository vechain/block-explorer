'use client'

import { Box, Flex, HStack, Image, Skeleton, Text } from '@chakra-ui/react'
import { LuTrendingDown, LuTrendingUp } from 'react-icons/lu'
import { useTokenDailyPrices } from '@/hooks/useTokenDailyPrices'
import { useFormatCurrency } from '@/hooks/useFormatting'

type SupportedTokenSymbol = 'VET' | 'VTHO' | 'B3TR'

/**
 * Compact single-row replacement for the previous PriceCards. Built per the
 * homepage design's `price-strip` — three pills inside one rounded panel
 * with hairline dividers, icon + symbol + price + colour-coded 24h change.
 */
export const CompactPriceStrip = () => {
  const vet = useTokenDailyPrices('vechain')
  const vtho = useTokenDailyPrices('vethor-token')
  const b3tr = useTokenDailyPrices('vebetterdao')

  return (
    <Flex
      borderWidth="1px"
      borderColor="border-primary"
      bg="row-even-bg-primary"
      rounded="2xl"
      overflow="hidden"
      direction={{ base: 'column', md: 'row' }}
    >
      <PriceItem
        token="VET"
        label="VET"
        price={vet.price}
        changePercent={vet.dailyChangePercent}
        isLoading={vet.isLoading}
      />
      <PriceItem
        token="VTHO"
        label="VTHO"
        price={vtho.price}
        changePercent={vtho.dailyChangePercent}
        isLoading={vtho.isLoading}
      />
      <PriceItem
        token="B3TR"
        label="B3TR"
        price={b3tr.price}
        changePercent={b3tr.dailyChangePercent}
        isLoading={b3tr.isLoading}
      />
    </Flex>
  )
}

interface PriceItemProps {
  token: SupportedTokenSymbol
  label: string
  price?: number
  changePercent?: number
  isLoading?: boolean
}

const PriceItem = ({ token, label, price, changePercent, isLoading }: PriceItemProps) => {
  const formatCurrency = useFormatCurrency()

  return (
    <Flex
      flex="1"
      alignItems="center"
      gap="3"
      px="5"
      py="3.5"
      borderRightWidth={{ base: 0, md: '1px' }}
      borderBottomWidth={{ base: '1px', md: 0 }}
      borderColor="border-primary"
      _last={{ borderRightWidth: 0, borderBottomWidth: 0 }}
    >
      <Image src={`/tokens/${token}.svg`} alt={token} width={7} height={7} rounded="full" />
      <Box flex="1" minW="0">
        <Text textStyle="bodyXs" color="text-secondary">
          {label}
        </Text>
        {isLoading ? (
          <Skeleton height="20px" width="68px" mt="1" />
        ) : (
          <Text textStyle="bodyL" color="text-primary">
            {formatCurrency(price ?? 0, { minimumFractionDigits: 4 })}
          </Text>
        )}
      </Box>
      {changePercent !== undefined && !isLoading && (
        <HStack
          gap="1"
          color={changePercent >= 0 ? 'success-text' : 'error-text'}
          textStyle="bodyXs"
          fontWeight="medium"
        >
          {changePercent >= 0 ? <LuTrendingUp size={13} /> : <LuTrendingDown size={13} />}
          <Text>{Math.abs(changePercent).toFixed(2)}%</Text>
        </HStack>
      )}
    </Flex>
  )
}
