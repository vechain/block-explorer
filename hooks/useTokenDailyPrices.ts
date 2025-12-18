import { useQuery } from '@tanstack/react-query'
import { tokenDailyPricesQueryOptions } from '@/services/coin-api/token-daily-prices'

type PriceData = {
  timestamp: number
  price: number
}

export const useTokenDailyPrices = (
  token: 'vechain' | 'vethor-token' | 'vebetterdao',
  currency: 'usd' | 'eur' | 'gbp',
) => {
  const { data, isLoading, error } = useQuery(tokenDailyPricesQueryOptions(token, currency))

  const formattedData: PriceData[] =
    data?.prices?.map(([timestamp, price]) => ({
      timestamp,
      price,
    })) ?? []

  return {
    data: formattedData,
    isLoading,
    error,
  }
}
