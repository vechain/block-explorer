import { z } from 'zod'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { COIN_API_URL } from '@/env.public'
import { apiClient } from '@/lib/api'
import { zodParse } from '@/lib/utils/zod'
import { Currency, useSettingsStore } from '@/lib/stores/settings'

export type MarketCapToken = 'vechain' | 'vethor-token' | 'vebetterdao'

export enum MarketCapRange {
  DAY = '1',
  MONTH = '30',
  YEAR = '365',
}

type MarketCapDataPoint = {
  timestamp: number
  marketCap: number
}

const MARKET_CAP_QUERY_KEY = 'marketCapData'
const CIRCULATING_SUPPLY_QUERY_KEY = 'circulatingSupply'

export const marketCapQueryOptions = (token: MarketCapToken, currency: Currency, days: MarketCapRange) => ({
  queryKey: [MARKET_CAP_QUERY_KEY, token, currency, days],
  queryFn: () => getMarketCapHistory(token, currency, days),
  staleTime: 1000 * 60 * 2,
  refetchInterval: 1000 * 60 * 5,
  placeholderData: keepPreviousData,
})

export const circulatingSupplyQueryOptions = (token: MarketCapToken) => ({
  queryKey: [CIRCULATING_SUPPLY_QUERY_KEY, token],
  queryFn: () => getCirculatingSupply(token),
  staleTime: 1000 * 60 * 5,
  refetchInterval: 1000 * 60 * 10,
  placeholderData: keepPreviousData,
})

export const useMarketCapData = (token: MarketCapToken, range: MarketCapRange) => {
  const { currency } = useSettingsStore()

  const { data: marketCapData, isLoading: isLoadingMarketCap } = useQuery<MarketCapDataPoint[]>(
    marketCapQueryOptions(token, currency, range),
  )

  const { data: circulatingSupply, isLoading: isLoadingSupply } = useQuery<number>(circulatingSupplyQueryOptions(token))

  const currentMarketCap = marketCapData?.[marketCapData.length - 1]?.marketCap

  return {
    data: marketCapData ?? [],
    circulatingSupply: circulatingSupply ?? 0,
    currentMarketCap,
    isLoading: isLoadingMarketCap || isLoadingSupply,
  }
}

const getMarketCapHistory = async (token: MarketCapToken, currency: Currency, days: MarketCapRange) => {
  const { data } = await apiClient.get({
    baseUrl: COIN_API_URL,
    endPoint: `/coins/${token}/market_chart`,
    params: { days, vs_currency: currency },
  })

  return zodParse({
    data,
    schema: marketCapHistorySchema,
    errorMessage: 'Invalid market cap response from Coin API',
  })
}

const getCirculatingSupply = async (token: MarketCapToken) => {
  const { data } = await apiClient.get({
    baseUrl: COIN_API_URL,
    endPoint: `/coins/${token}`,
    params: {
      localization: 'false',
      tickers: 'false',
      community_data: 'false',
      developer_data: 'false',
    },
  })

  return zodParse({
    data,
    schema: circulatingSupplySchema,
    errorMessage: 'Invalid circulating supply response from Coin API',
  })
}

const marketCapHistorySchema = z
  .object({
    market_caps: z.array(z.tuple([z.coerce.number(), z.coerce.number()])),
  })
  .transform(({ market_caps }) =>
    market_caps.map(([timestamp, marketCap]) => ({
      timestamp,
      marketCap,
    })),
  )

const circulatingSupplySchema = z
  .object({
    market_data: z.object({
      circulating_supply: z.coerce.number(),
    }),
  })
  .transform(({ market_data }) => market_data.circulating_supply)
