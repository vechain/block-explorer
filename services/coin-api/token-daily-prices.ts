import { queryOptions } from '@tanstack/react-query'

interface PriceDataRaw {
  prices: [number, number][]
}

type TokenId = 'vechain' | 'vethor-token' | 'vebetterdao'
type Currency = 'usd' | 'eur' | 'gbp'

/**
 * Query options for token daily prices
 * Can be used for server-side prefetching
 */
export const tokenDailyPricesQueryOptions = (token: TokenId, currency: Currency) =>
  queryOptions<PriceDataRaw>({
    queryKey: ['priceChart', token, currency],
    queryFn: async () => {
      const response = await fetch(
        `https://coin-api.veworld.vechain.org/coins/${token}/market_chart?days=1&vs_currency=${currency}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch price data')
      }
      return response.json()
    },
    refetchInterval: 300000, // 5 minutes
  })
