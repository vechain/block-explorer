'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { priceListQueryOptions } from './price-list'

export const usePriceList = () => {
  return useSuspenseQuery(priceListQueryOptions())
}
