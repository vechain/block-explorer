import { useSuspenseQuery } from '@tanstack/react-query'
import type { Abi } from 'viem'
import { apiClient } from '@/lib/api'

export const useAbi = (signature: string) => {
  return useSuspenseQuery(abiQueryOptions(signature))
}

const abiQueryOptions = (signature: string) => ({
  queryKey: [getAbi.name, signature],
  queryFn: () => getAbi({ signature }),
  retry: false,
})

const getAbi = async ({ signature }: { signature: string }) => {
  const { data } = await apiClient.get<Abi>({
    baseUrl: '/api',
    endPoint: '/b32',
    params: { signature },
  })

  return data
}
