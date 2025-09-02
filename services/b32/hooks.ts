'use client'

import { useQuery } from '@tanstack/react-query'
import { abiQueryOptions } from './abi'

export const useAbi = (signature: string) => {
  return useQuery(abiQueryOptions(signature))
}
