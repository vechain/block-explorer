import { useQuery } from '@tanstack/react-query'
import type { Abi } from 'viem'
import { apiClient } from '@/lib/api'

const ABI_QUERY_KEY = 'getAbi'

export const useAbi = (signature: string) => {
  return useQuery(abiQueryOptions(signature))
}

const abiQueryOptions = (signature: string) => ({
  queryKey: [ABI_QUERY_KEY, signature],
  queryFn: () => getAbi({ signature }),
})

const getAbi = async ({ signature }: { signature: string }) => {
  const { data } = await apiClient.get<Abi>({
    baseUrl: '/api',
    endPoint: '/b32',
    params: { signature },
  })

  return data
}
