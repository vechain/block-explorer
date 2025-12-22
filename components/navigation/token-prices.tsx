'use client'

import { Link as ChakraLink, Flex, Text } from '@chakra-ui/react'

import { useCurrencyConversion } from '@/hooks/useCurrencyConversion'
import { usePriceList } from '@/services/coin-api/hooks'

export const TokenPrices = () => {
  const { data: priceList } = usePriceList()

  if (!priceList) return null

  return (
    <Flex gap={4} alignItems="center">
      <TokenPrice token="VET" usdPrice={priceList.vet.usd} />
      <TokenPrice token="VTHO" usdPrice={priceList.vtho.usd} />
      <TokenPrice token="B3TR" usdPrice={priceList.b3tr.usd} />
    </Flex>
  )
}
const COINGECKO_TOKEN_IDS = {
  VET: 'vechain',
  VTHO: 'vethor-token',
  B3TR: 'vebetterdao',
}

function TokenPrice({ token, usdPrice }: { token: keyof typeof COINGECKO_TOKEN_IDS; usdPrice: number }) {
  const { formatFiat } = useCurrencyConversion()

  return (
    <Text asChild fontSize="sm" color="fg.muted">
      <ChakraLink href={`https://www.coingecko.com/coins/${COINGECKO_TOKEN_IDS[token]}`} target="_blank">
        {token}: {formatFiat(usdPrice)}
      </ChakraLink>
    </Text>
  )
}
