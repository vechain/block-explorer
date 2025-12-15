import { useQuery } from '@tanstack/react-query'

interface PriceDataRaw {
  prices: [number, number][]
}

type PriceData = {
  timestamp: number
  price: number
}

export const useTokenDailyPrices = (
  token: 'vechain' | 'vethor-token' | 'vebetterdao',
  currency: 'usd' | 'eur' | 'gbp',
) => {
  const { data, isLoading, error } = useQuery<PriceDataRaw>({
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
    refetchInterval: 300000,
  })

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
