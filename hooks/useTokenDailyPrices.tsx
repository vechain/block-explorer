import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { COIN_API_URL } from '@/env.public'
import { apiClient } from '@/lib/api'
import { zodParse } from '@/lib/utils/zod'
import { Currency, useSettingsStore } from '@/lib/stores/settings'

export type TokenDailyPrice = {
  timestamp: number
  price: number
}

export type TokenDailyPricesToken = 'vechain' | 'vethor-token' | 'vebetterdao' | string

const TOKEN_DAILY_PRICES_QUERY_KEY = 'tokenDailyPrices'

export const tokenDailyPricesQueryOptions = (token: TokenDailyPricesToken, currency: Currency) => ({
  queryKey: [TOKEN_DAILY_PRICES_QUERY_KEY, token, currency],
  queryFn: () => getTokenDailyPrices(token, currency),
  staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
  refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
})

export const useTokenDailyPrices = (token: TokenDailyPricesToken) => {
  const { currency } = useSettingsStore()
  const { data, isLoading, error } = useQuery<TokenDailyPrice[]>(tokenDailyPricesQueryOptions(token, currency))

  const dailyChangePercent = (() => {
    if (!data || data.length < 2) return 0
    const first = data[0]?.price
    const last = data[data.length - 1]?.price
    if (!first || !last) return 0
    return ((last - first) / first) * 100
  })()

  const price = data?.[data.length - 1]?.price

  return {
    data: data ?? [],
    dailyChangePercent,
    isLoading,
    error,
    price,
  }
}

const getTokenDailyPrices = async (token: TokenDailyPricesToken, currency: Currency) => {
  const { data } = await apiClient.get({
    baseUrl: COIN_API_URL,
    endPoint: `/coins/${token}/market_chart`,
    params: { days: '1', vs_currency: currency },
  })

  return zodParse({
    data,
    schema: tokenDailyPricesSchema,
    errorMessage: 'Invalid token daily prices response from Coin API',
  })
}

const tokenDailyPricesSchema = z
  .object({
    prices: z.array(z.tuple([z.coerce.number(), z.coerce.number()])),
  })
  .transform(({ prices }) =>
    prices.map(([timestamp, price]) => ({
      timestamp,
      price,
    })),
  )
