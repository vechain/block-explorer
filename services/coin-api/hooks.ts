'use client'

import { useQuery } from '@tanstack/react-query'
import { priceListQueryOptions } from './price-list'

export const usePriceList = () => {
  return useQuery(priceListQueryOptions())
}
