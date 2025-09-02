import { z } from 'zod'
import { COIN_API_URL } from '@/env.public'
import { apiClient } from '@/lib/api'
import { zodParse } from '@/lib/utils/zod'

export const priceListQueryOptions = () => ({
  queryKey: [getPriceList.name],
  queryFn: getPriceList,
  refetchInterval: 1000 * 60 * 5, // 5 minutes
})

const getPriceList = async () => {
  const { data } = await apiClient.get({
    baseUrl: COIN_API_URL,
    endPoint: '/price-list',
    params: { expanded: 'false' },
  })

  return zodParse(data, priceListSchema, 'Invalid price list response from Coin API')
}

const tokensSchema = z.enum([
  'vet',
  'vtho',
  'usdglo',
  'hai',
  'b3tr',
  'vot3',
  'sha',
  'bvet',
  'yeet',
  'wov',
  'coj',
  'vvet',
  'sht',
  'btc',
  'eth',
  'sol',
  'usdc',
  'usdt',
  'wan',
  'xrp',
  'veed',
  'mva',
  'veusd',
  'wvet',
  'vsea',
  'oce',
  'vpu',
  'gold',
  'jur',
  'mvg',
  'vex',
  'dhn',
  'pla',
  'ppr',
  'union',
  'dragon',
  'banana',
  'vst',
  'dbet',
  'ehrt',
  'tic',
  'gems',
  'mdn',
  'squad',
  'sass',
  'dwvet',
])

const priceSchema = z
  .object({
    price_usd: z.coerce.number(),
    price_eur: z.coerce.number(),
    price_cny: z.coerce.number(),
    price_vet: z.coerce.number(),
    last_updated: z.coerce.number(),
  })
  .transform(data => ({
    usd: data.price_usd,
    eur: data.price_eur,
    cny: data.price_cny,
    vet: data.price_vet,
    lastUpdated: data.last_updated,
  }))

const priceListSchema = z.record(tokensSchema, priceSchema)
