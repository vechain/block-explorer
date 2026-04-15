import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { COIN_API_URL } from '@/env.public'
import { apiClient } from '@/lib/api'
import { Currency, useSettingsStore } from '@/lib/stores/settings'
import { zodParse } from '@/lib/utils/zod'

const TOKEN_PRICES_QUERY_KEY = 'tokenPrices'

type TokenPriceRecord = {
  price?: number
  marketCap?: number
  totalSupply?: number
}

const EMPTY_TOKEN_PRICE_MAP = new Map<string, TokenPriceRecord>()

const tokenPricesQueryOptions = (ids: string[], currency: Currency) => ({
  queryKey: [TOKEN_PRICES_QUERY_KEY, currency, ids],
  queryFn: () => getTokenPrices(ids, currency),
  enabled: ids.length > 0,
  staleTime: 1000 * 60 * 2,
  refetchInterval: 1000 * 60 * 5,
})

export const useTokenPrices = (ids: string[]) => {
  const { currency } = useSettingsStore()
  const normalizedIds = Array.from(new Set(ids.filter(Boolean))).sort()
  const { data, isLoading, error } = useQuery(tokenPricesQueryOptions(normalizedIds, currency))

  return {
    data: data ?? EMPTY_TOKEN_PRICE_MAP,
    isLoading,
    error,
  }
}

const getTokenPrices = async (ids: string[], currency: Currency) => {
  if (ids.length === 0) {
    return EMPTY_TOKEN_PRICE_MAP
  }

  const { data } = await apiClient.get({
    baseUrl: COIN_API_URL,
    endPoint: '/coins/markets',
    params: {
      ids: ids.join(','),
      vs_currency: currency,
    },
  })

  const parsed = zodParse({
    data,
    schema: tokenPricesSchema,
    errorMessage: 'Invalid token prices response from Coin API',
  })

  return new Map(
    parsed.map(token => [token.id, { price: token.price, marketCap: token.marketCap, totalSupply: token.totalSupply }]),
  )
}

const tokenPricesSchema = z.array(
  z
    .object({
      id: z.string(),
      current_price: z.coerce.number().nullable().optional(),
      market_cap: z.coerce.number().nullable().optional(),
      total_supply: z.coerce.number().nullable().optional(),
    })
    .transform(({ id, current_price, market_cap, total_supply }) => ({
      id,
      price: current_price ?? undefined,
      marketCap: market_cap ?? undefined,
      totalSupply: total_supply ?? undefined,
    })),
)
