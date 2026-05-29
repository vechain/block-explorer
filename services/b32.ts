import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'
import type { Abi } from 'viem'
import { apiClient } from '@/lib/api'

const ABI_QUERY_KEY = 'getAbi'

const isHexHash = (signature: string): boolean =>
  /^0x[a-fA-F0-9]{8}$/.test(signature) || /^0x[a-fA-F0-9]{64}$/.test(signature)

export const useAbi = (signature: string | null | undefined) => {
  return useQuery(abiQueryOptions(signature))
}

const abiQueryOptions = (signature: string | null | undefined) =>
  queryOptions({
    queryKey: [ABI_QUERY_KEY, signature],
    queryFn: signature && isHexHash(signature) ? () => getAbi({ signature }) : skipToken,
    staleTime: Infinity,
  })

const getAbi = async ({ signature }: { signature: string }) => {
  const { data } = await apiClient.get<Abi>({
    baseUrl: '/api',
    endPoint: '/b32',
    params: { signature },
  })

  return data
}
